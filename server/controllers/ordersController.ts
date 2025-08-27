import { Response } from 'express';
import { dbUtils } from '../database/connection';
import { AuthRequest } from '../middleware/auth';

export const getOrders = async (req: AuthRequest, res: Response) => {
  try {
    const { status, date, limit = 50 } = req.query;
    
    let query = `
      SELECT o.*, c.name as customer_name, c.phone as customer_phone
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
    `;
    
    const conditions = [];
    const params = [];

    if (status) {
      conditions.push('o.order_status = ?');
      params.push(status);
    }

    if (date) {
      conditions.push('DATE(o.created_at) = ?');
      params.push(date);
    }

    // Always exclude combined orders to prevent duplicates
    conditions.push('o.order_number NOT LIKE \'TABLE-%\'');
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY o.created_at DESC LIMIT ?';
    params.push(Number(limit));

    const orders = await dbUtils.all(query, params);
    
    // Get order items for each order
    for (const order of orders) {
      const items = await dbUtils.all(`
        SELECT oi.*, p.name as product_name, p.price as product_price
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        WHERE oi.order_id = ?
      `, [order.id]);
      
      order.items = items;
    }

    res.json(orders);
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getOrderById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    const order = await dbUtils.get(`
      SELECT o.*, c.name as customer_name, c.phone as customer_phone, c.email as customer_email
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      WHERE o.id = ?
    `, [id]);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Get order items
    const items = await dbUtils.all(`
      SELECT oi.*, p.name as product_name, p.price as product_price, p.sku as product_sku
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ?
    `, [id]);

    // Get payments
    const payments = await dbUtils.all(`
      SELECT * FROM payments WHERE order_id = ? ORDER BY created_at
    `, [id]);

    order.items = items;
    order.payments = payments;

    res.json(order);
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const createOrder = async (req: AuthRequest, res: Response) => {
  try {
    const {
      customer_id,
      table_id,
      items,
      payment_method,
      discount_amount = 0,
      table_number,
      order_type = 'dine_in',
      notes
    } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'Order must have at least one item' });
    }

    if (!payment_method) {
      return res.status(400).json({ message: 'Payment method is required' });
    }

    // Generate order number
    const orderNumber = `ORD-${Date.now()}`;

    // Calculate totals
    let subtotal = 0;
    const orderItems: Array<{
      product_id: number;
      quantity: number;
      unit_price: number;
      total_price: number;
      notes: string | null;
    }> = [];

    for (const item of items) {
      const product = await dbUtils.get(
        'SELECT * FROM products WHERE id = ? AND is_active = 1',
        [item.product_id]
      );

      if (!product) {
        return res.status(400).json({ 
          message: `Product with ID ${item.product_id} not found or inactive` 
        });
      }

      if (product.stock_quantity < item.quantity) {
        return res.status(400).json({ 
          message: `Insufficient stock for ${product.name}. Available: ${product.stock_quantity}` 
        });
      }

      const itemTotal = product.price * item.quantity;
      subtotal += itemTotal;

      orderItems.push({
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: product.price,
        total_price: itemTotal,
        notes: item.notes || null
      });
    }

    const finalAmount = subtotal - discount_amount;

    // Create order in transaction
    const result = await dbUtils.transaction([
      async () => {
        // Create order
        const orderResult = await dbUtils.run(`
          INSERT INTO orders 
          (order_number, customer_id, table_id, total_amount, discount_amount, tax_amount, 
           final_amount, payment_method, payment_status, cashier_name, table_number, 
           order_type, notes)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          orderNumber,
          customer_id || null,
          table_id || null,
          subtotal,
          discount_amount,
          0, // No tax
          finalAmount,
          payment_method,
          'pending',
          req.user?.full_name || 'Unknown',
          table_number || null,
          order_type,
          notes || null
        ]);

        const orderId = orderResult.lastID;

        // Create order items and update stock
        for (const item of orderItems) {
          await dbUtils.run(`
            INSERT INTO order_items 
            (order_id, product_id, quantity, unit_price, total_price, notes)
            VALUES (?, ?, ?, ?, ?, ?)
          `, [
            orderId,
            item.product_id,
            item.quantity,
            item.unit_price,
            item.total_price,
            item.notes
          ]);

          // Update stock
          await dbUtils.run(
            'UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?',
            [item.quantity, item.product_id]
          );

          // Record inventory transaction
          await dbUtils.run(`
            INSERT INTO inventory_transactions 
            (product_id, transaction_type, quantity, reference_id, reference_type)
            VALUES (?, ?, ?, ?, ?)
          `, [
            item.product_id,
            'sale',
            -item.quantity,
            orderId,
            'order'
          ]);
        }

        // Create payment record
        await dbUtils.run(`
          INSERT INTO payments 
          (order_id, amount, payment_method, status)
          VALUES (?, ?, ?, ?)
        `, [orderId, finalAmount, payment_method, 'completed']);

        return orderId;
      }
    ]);

    const orderId = result[0];

    // Get the created order with details
    const newOrder = await dbUtils.get(`
      SELECT o.*, c.name as customer_name, c.phone as customer_phone
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      WHERE o.id = ?
    `, [orderId]);

    const items_details = await dbUtils.all(`
      SELECT oi.*, p.name as product_name, p.price as product_price
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ?
    `, [orderId]);

    newOrder.items = items_details;

    res.status(201).json(newOrder);
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateOrderStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['active', 'completed', 'cancelled', 'refunded'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid order status' });
    }

    // Check if order exists
    const order = await dbUtils.get(
      'SELECT * FROM orders WHERE id = ?',
      [id]
    );

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Update order status
    await dbUtils.run(
      'UPDATE orders SET order_status = ? WHERE id = ?',
      [status, id]
    );

    // If refunding, restore stock
    if (status === 'refunded' && order.order_status !== 'refunded') {
      const orderItems = await dbUtils.all(
        'SELECT * FROM order_items WHERE order_id = ?',
        [id]
      );

      for (const item of orderItems) {
        await dbUtils.run(
          'UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ?',
          [item.quantity, item.product_id]
        );

        // Record inventory transaction
        await dbUtils.run(`
          INSERT INTO inventory_transactions 
          (product_id, transaction_type, quantity, reference_id, reference_type, notes)
          VALUES (?, ?, ?, ?, ?, ?)
        `, [
          item.product_id,
          'adjustment',
          item.quantity,
          id,
          'refund',
          'Stock restored due to order refund'
        ]);
      }
    }

    const updatedOrder = await dbUtils.get(`
      SELECT o.*, c.name as customer_name, c.phone as customer_phone
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      WHERE o.id = ?
    `, [id]);

    res.json(updatedOrder);
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getTodayStats = async (req: AuthRequest, res: Response) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const stats = await dbUtils.get(`
      SELECT 
        COUNT(*) as total_orders,
        COALESCE(SUM(final_amount), 0) as total_sales,
        COUNT(DISTINCT customer_id) as unique_customers
      FROM orders 
      WHERE DATE(created_at) = ? AND order_status != 'cancelled'
    `, [today]);

    const paymentMethods = await dbUtils.all(`
      SELECT 
        payment_method,
        COUNT(*) as count,
        SUM(final_amount) as total
      FROM orders 
      WHERE DATE(created_at) = ? AND order_status != 'cancelled'
      GROUP BY payment_method
    `, [today]);

    const topProducts = await dbUtils.all(`
      SELECT 
        p.name,
        p.price,
        SUM(oi.quantity) as quantity_sold,
        SUM(oi.total_price) as revenue
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      JOIN products p ON oi.product_id = p.id
      WHERE DATE(o.created_at) = ? AND o.order_status != 'cancelled'
      GROUP BY p.id, p.name, p.price
      ORDER BY quantity_sold DESC
      LIMIT 5
    `, [today]);

    res.json({
      ...stats,
      payment_methods: paymentMethods,
      top_products: topProducts
    });
  } catch (error) {
    console.error('Get today stats error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getOrdersByTable = async (req: AuthRequest, res: Response) => {
  try {
    const { tableId } = req.params;
    console.log('Getting orders for table:', tableId);
    
    const orders = await dbUtils.all(`
      SELECT o.*, c.name as customer_name, c.phone as customer_phone
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      WHERE (o.table_id = ? OR (o.table_id IS NULL AND o.table_number = (SELECT table_number FROM tables WHERE id = ?)))
      AND o.order_status != 'cancelled'
      AND o.order_status != 'refunded'
      AND o.payment_status != 'completed'
      AND o.order_number NOT LIKE 'TABLE-%'
      ORDER BY o.created_at DESC
      LIMIT 10
    `, [tableId, tableId]);

    console.log('Found orders for table:', orders.length);
    orders.forEach(order => {
      console.log(`Order ${order.id}: status=${order.order_status}, payment=${order.payment_status}, table_id=${order.table_id}, table_number=${order.table_number}`);
    });

    // Get order items for each order
    for (const order of orders) {
      const items = await dbUtils.all(`
        SELECT oi.*, p.name as product_name, p.price as product_price
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        WHERE oi.order_id = ?
      `, [order.id]);
      
      order.items = items;
    }

    res.json(orders);
  } catch (error) {
    console.error('Get orders by table error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getTableTotals = async (req: AuthRequest, res: Response) => {
  try {
    const { tableId } = req.params;
    console.log('Getting table totals for table:', tableId);
    
    // Get completed orders and orders moved to unpaid (exclude combined orders)
    const orders = await dbUtils.all(`
      SELECT o.*, c.name as customer_name, c.phone as customer_phone,
             CASE 
               WHEN o.payment_status = 'completed' THEN 'completed'
               WHEN EXISTS (SELECT 1 FROM unpaid_orders uo WHERE uo.order_id = o.id) THEN 'transferred'
               ELSE 'other'
             END as order_type
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      WHERE (o.table_id = ? OR (o.table_id IS NULL AND o.table_number = (SELECT table_number FROM tables WHERE id = ?)))
      AND o.order_status != 'cancelled'
      AND o.order_status != 'refunded'
      AND (o.payment_status = 'completed' OR EXISTS (SELECT 1 FROM unpaid_orders uo WHERE uo.order_id = o.id))
      AND o.order_number NOT LIKE 'TABLE-%'
      ORDER BY o.created_at DESC
      LIMIT 50
    `, [tableId, tableId]);

    console.log('Found total orders for table:', orders.length);

    // Get order items for each order
    for (const order of orders) {
      const items = await dbUtils.all(`
        SELECT oi.*, p.name as product_name, p.price as product_price
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        WHERE oi.order_id = ?
      `, [order.id]);
      
      order.items = items;
    }

    res.json(orders);
  } catch (error) {
    console.error('Get table totals error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getTableBillSummary = async (req: AuthRequest, res: Response) => {
  try {
    const { tableId } = req.params;
    
    // Check if table exists
    const table = await dbUtils.get(
      'SELECT * FROM tables WHERE id = ?',
      [tableId]
    );

    if (!table) {
      return res.status(404).json({ message: 'Table not found' });
    }

    // Get all unpaid/active orders for this table
    const orders = await dbUtils.all(`
      SELECT o.*, c.name as customer_name, c.phone as customer_phone
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      WHERE (o.table_id = ? OR (o.table_id IS NULL AND o.table_number = ?))
      AND o.order_status IN ('active', 'completed')
      AND o.payment_status != 'completed'
      ORDER BY o.created_at ASC
    `, [tableId, table.table_number]);

    if (orders.length === 0) {
      return res.json({
        table,
        orders: [],
        bill_summary: {
          total_orders: 0,
          subtotal: 0,
          total_discount: 0,
          total_tax: 0,
          grand_total: 0,
          items: []
        }
      });
    }

    let billSummary = {
      total_orders: orders.length,
      subtotal: 0,
      total_discount: 0,
      total_tax: 0,
      grand_total: 0,
      items: [] as any[]
    };

    const itemsMap = new Map();

    // Get order items for each order and calculate totals
    for (const order of orders) {
      const items = await dbUtils.all(`
        SELECT oi.*, p.name as product_name, p.price as product_price
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        WHERE oi.order_id = ?
      `, [order.id]);
      
      order.items = items;
      
      // Add to bill summary
      billSummary.subtotal += order.total_amount;
      billSummary.total_discount += order.discount_amount;
      billSummary.grand_total += order.final_amount;

      // Combine similar items
      for (const item of items) {
        const key = `${item.product_id}-${item.unit_price}`;
        if (itemsMap.has(key)) {
          const existingItem = itemsMap.get(key);
          existingItem.quantity += item.quantity;
          existingItem.total_price += item.total_price;
        } else {
          itemsMap.set(key, {
            product_id: item.product_id,
            product_name: item.product_name,
            unit_price: item.unit_price,
            quantity: item.quantity,
            total_price: item.total_price,
            notes: item.notes
          });
        }
      }
    }

    billSummary.items = Array.from(itemsMap.values());

    res.json({
      table,
      orders,
      bill_summary: billSummary
    });

  } catch (error) {
    console.error('Get table bill summary error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const createTableCombinedOrder = async (req: AuthRequest, res: Response) => {
  try {
    const { tableId } = req.params;
    const { discountType, discountValue } = req.body;
    
    // Check if table exists
    const table = await dbUtils.get(
      'SELECT * FROM tables WHERE id = ?',
      [tableId]
    );

    if (!table) {
      return res.status(404).json({ message: 'Table not found' });
    }

    // Check if there's already a pending combined order for this table
    const existingCombinedOrder = await dbUtils.get(`
      SELECT * FROM orders
      WHERE table_id = ? 
      AND order_number LIKE 'TABLE-%'
      AND payment_status = 'pending'
      ORDER BY created_at DESC
      LIMIT 1
    `, [tableId]);

    if (existingCombinedOrder) {
      console.log(`Found existing combined order #${existingCombinedOrder.order_number} for table ${table.table_number}`);
      return res.json({
        combined_order_id: existingCombinedOrder.id,
        combined_order_number: existingCombinedOrder.order_number,
        original_orders_count: 0,
        total_amount: existingCombinedOrder.final_amount,
        message: 'Using existing combined order'
      });
    }

    // First, let's see all orders for this table
    const allTableOrders = await dbUtils.all(`
      SELECT id, order_number, order_status, payment_status, final_amount FROM orders 
      WHERE (table_id = ? OR (table_id IS NULL AND table_number = ?))
      ORDER BY created_at DESC
    `, [tableId, table.table_number]);
    
    console.log(`Table ${table.table_number} has ${allTableOrders.length} total orders:`, 
      allTableOrders.map(o => `#${o.order_number} (${o.order_status}/${o.payment_status})`).join(', '));

    // Get all orders for this table that haven't been combined yet
    const orders = await dbUtils.all(`
      SELECT * FROM orders 
      WHERE (table_id = ? OR (table_id IS NULL AND table_number = ?))
      AND order_status IN ('active', 'completed')
      AND payment_status != 'completed'
      AND (notes IS NULL OR notes NOT LIKE '%COMBINED_INTO:%')
      AND order_number NOT LIKE 'TABLE-%'
    `, [tableId, table.table_number]);

    console.log(`Found ${orders.length} orders available for table ${table.table_number} payment`);

    if (orders.length === 0) {
      return res.status(400).json({ message: 'No orders available for table payment. Orders may have already been combined.' });
    }

    // Get all items from all orders
    const allItems: Array<{
      product_id: number;
      quantity: number;
      unit_price: number;
      total_price: number;
      notes: string | null;
    }> = [];
    let totalAmount = 0;
    let totalDiscount = 0;
    let totalTax = 0;

    for (const order of orders) {
      const items = await dbUtils.all(`
        SELECT oi.*, p.name as product_name, p.price as product_price
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        WHERE oi.order_id = ?
      `, [order.id]);
      
      totalAmount += order.total_amount;
      totalDiscount += order.discount_amount;
      
      allItems.push(...items);
    }

    // Apply additional discount if provided
    if (discountType && discountValue) {
      let additionalDiscount = 0;
      if (discountType === 'percentage') {
        additionalDiscount = (totalAmount * discountValue) / 100;
      } else if (discountType === 'fixed') {
        additionalDiscount = discountValue;
      }
      totalDiscount += additionalDiscount;
      totalAmount = Math.max(0, totalAmount - additionalDiscount); // Ensure total doesn't go below 0
    }

    // Generate combined order number
    const combinedOrderNumber = `TABLE-${table.table_number}-${Date.now()}`;

    // Create combined order in transaction
    const result = await dbUtils.transaction([
      async () => {
        // Create combined order
        const orderResult = await dbUtils.run(`
          INSERT INTO orders 
          (order_number, table_id, total_amount, discount_amount, tax_amount, 
           final_amount, payment_method, payment_status, order_status, cashier_name, 
           table_number, order_type, notes)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          combinedOrderNumber,
          tableId,
          totalAmount,
          totalDiscount,
          0, // No tax
          totalAmount - totalDiscount,
          'pending', // Will be set during payment
          'pending',
          'active',
          req.user?.full_name || 'System',
          table.table_number,
          'dine_in',
          `Combined bill for table ${table.table_number} - ${orders.length} orders`
        ]);

        const combinedOrderId = orderResult.lastID;

        // Add all items to combined order
        for (const item of allItems) {
          await dbUtils.run(`
            INSERT INTO order_items 
            (order_id, product_id, quantity, unit_price, total_price, notes)
            VALUES (?, ?, ?, ?, ?, ?)
          `, [
            combinedOrderId,
            item.product_id,
            item.quantity,
            item.unit_price,
            item.total_price,
            item.notes
          ]);
        }

        // Store reference to original orders for later processing
        for (const order of orders) {
          await dbUtils.run(`
            UPDATE orders SET notes = COALESCE(notes || ' | ', '') || 'COMBINED_INTO:${combinedOrderId}' WHERE id = ?
          `, [order.id]);
        }

        return combinedOrderId;
      }
    ]);

    const combinedOrderId = result[0];

    res.json({
      combined_order_id: combinedOrderId,
      combined_order_number: combinedOrderNumber,
      original_orders_count: orders.length,
      total_amount: totalAmount - totalDiscount
    });

  } catch (error) {
    console.error('Create table combined order error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const processTablePayment = async (req: AuthRequest, res: Response) => {
  try {
    const { tableId } = req.params;
    const { 
      payment_method, 
      amount_paid, 
      discount_amount = 0,
      notes 
    } = req.body;

    if (!payment_method) {
      return res.status(400).json({ message: 'Payment method is required' });
    }

    // Check if table exists
    const table = await dbUtils.get(
      'SELECT * FROM tables WHERE id = ?',
      [tableId]
    );

    if (!table) {
      return res.status(404).json({ message: 'Table not found' });
    }

    // Get all unpaid orders for this table (exclude combined orders)
    const orders = await dbUtils.all(`
      SELECT * FROM orders 
      WHERE (table_id = ? OR (table_id IS NULL AND table_number = ?))
      AND order_status IN ('active', 'completed')
      AND payment_status != 'completed'
      AND order_number NOT LIKE 'TABLE-%'
    `, [tableId, table.table_number]);

    if (orders.length === 0) {
      return res.status(400).json({ message: 'No unpaid orders found for this table' });
    }

    // Calculate total bill
    const totalBill = orders.reduce((sum, order) => sum + order.final_amount, 0);
    const finalAmount = totalBill - discount_amount;

    if (amount_paid < finalAmount) {
      return res.status(400).json({ 
        message: `Insufficient payment. Required: ${finalAmount}, Paid: ${amount_paid}` 
      });
    }

    // Process payment in transaction
    await dbUtils.transaction([
      async () => {
        // Update all orders to completed and paid
        for (const order of orders) {
          await dbUtils.run(
            'UPDATE orders SET order_status = ?, payment_status = ? WHERE id = ?',
            ['completed', 'completed', order.id]
          );

          // Create payment record for each order (proportional)
          const orderProportion = order.final_amount / totalBill;
          const orderPayment = (amount_paid * orderProportion) - (discount_amount * orderProportion);
          
          await dbUtils.run(`
            INSERT INTO payments 
            (order_id, amount, payment_method, status, reference_number)
            VALUES (?, ?, ?, ?, ?)
          `, [
            order.id, 
            orderPayment, 
            payment_method, 
            'completed',
            `TABLE-${table.table_number}-${Date.now()}`
          ]);
        }

        // Update table status to available
        await dbUtils.run(
          'UPDATE tables SET status = ?, current_order_id = NULL WHERE id = ?',
          ['available', tableId]
        );
      }
    ]);

    const change = amount_paid - finalAmount;

    res.json({
      message: `Payment processed successfully for table ${table.table_number}`,
      payment_details: {
        total_orders: orders.length,
        subtotal: totalBill,
        discount: discount_amount,
        final_amount: finalAmount,
        amount_paid,
        change: change > 0 ? change : 0,
        payment_method,
        table_status: 'available'
      }
    });

  } catch (error) {
    console.error('Process table payment error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const resetTable = async (req: AuthRequest, res: Response) => {
  try {
    const { tableId } = req.params;
    console.log('Resetting table:', tableId);

    // Check if table exists
    const table = await dbUtils.get(
      'SELECT * FROM tables WHERE id = ?',
      [tableId]
    );

    if (!table) {
      console.log('Table not found:', tableId);
      return res.status(404).json({ message: 'Table not found' });
    }

    console.log('Current table status:', table.status);
    console.log('Current table current_order_id:', table.current_order_id);

    // Get all active orders for this table before resetting (exclude combined orders)
    const activeOrders = await dbUtils.all(`
      SELECT o.id, o.order_number, o.final_amount, o.payment_status, o.order_status
      FROM orders o
      WHERE (o.table_id = ? OR (o.table_id IS NULL AND o.table_number = ?))
      AND o.order_status != 'cancelled'
      AND o.order_status != 'refunded'
      AND o.payment_status != 'completed'
      AND o.order_number NOT LIKE 'TABLE-%'
    `, [tableId, table.table_number]);

    console.log('Found active orders to move to Total:', activeOrders.length);

    // Move all active orders to Total by marking them as completed
    if (activeOrders.length > 0) {
      await dbUtils.transaction([
        async () => {
          for (const order of activeOrders) {
            console.log(`Moving order ${order.id} (${order.order_number}) to Total`);
            
            // Mark order as completed to move it to Total
            await dbUtils.run(
              'UPDATE orders SET payment_status = ?, order_status = ? WHERE id = ?',
              ['completed', 'completed', order.id]
            );

            // Create a payment record for the order
            await dbUtils.run(`
              INSERT INTO payments 
              (order_id, amount, payment_method, status, reference_number)
              VALUES (?, ?, ?, ?, ?)
            `, [
              order.id,
              order.final_amount,
              'table_reset',
              'completed',
              `RESET-${table.table_number}-${Date.now()}`
            ]);
          }
        }
      ]);
    }

    // Reset table status to available and clear current order reference
    const updateResult = await dbUtils.run(
      'UPDATE tables SET status = ?, current_order_id = NULL WHERE id = ?',
      ['available', tableId]
    );

    console.log('Update result:', updateResult);

    // Get updated table info
    const updatedTable = await dbUtils.get(
      'SELECT * FROM tables WHERE id = ?',
      [tableId]
    );

    console.log('Updated table status:', updatedTable.status);
    console.log('Updated table current_order_id:', updatedTable.current_order_id);

    res.json({ 
      message: `Table ${table.table_number} has been cleared. ${activeOrders.length} active orders moved to Total.`,
      table: updatedTable,
      orders_moved_to_total: activeOrders.length
    });

  } catch (error) {
    console.error('Reset table error:', error);
    res.status(500).json({ message: 'Failed to reset table' });
  }
};

export const clearTableOrders = async (req: AuthRequest, res: Response) => {
  try {
    const { tableId } = req.params;
    const { restoreStock = true } = req.body;

    // Check if table exists
    const table = await dbUtils.get(
      'SELECT * FROM tables WHERE id = ?',
      [tableId]
    );

    if (!table) {
      return res.status(404).json({ message: 'Table not found' });
    }

    // Get all orders for this table
    const orders = await dbUtils.all(`
      SELECT o.id, o.order_status
      FROM orders o
      WHERE (o.table_id = ? OR (o.table_id IS NULL AND o.table_number = ?))
    `, [tableId, table.table_number]);

    if (orders.length === 0) {
      return res.json({ message: 'No orders found for this table', deleted_count: 0 });
    }

    const orderIds = orders.map(order => order.id);

    // Execute deletion in a transaction
    await dbUtils.transaction([
      async () => {
        // If restoreStock is true, restore inventory for non-refunded orders
        if (restoreStock) {
          for (const order of orders) {
            if (order.order_status !== 'refunded') {
              const orderItems = await dbUtils.all(
                'SELECT * FROM order_items WHERE order_id = ?',
                [order.id]
              );

              for (const item of orderItems) {
                // Restore stock
                await dbUtils.run(
                  'UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ?',
                  [item.quantity, item.product_id]
                );

                // Record inventory transaction
                await dbUtils.run(`
                  INSERT INTO inventory_transactions 
                  (product_id, transaction_type, quantity, reference_id, reference_type, notes)
                  VALUES (?, ?, ?, ?, ?, ?)
                `, [
                  item.product_id,
                  'adjustment',
                  item.quantity,
                  order.id,
                  'table_clear',
                  `Stock restored due to table ${table.table_number} order clearance`
                ]);
              }
            }
          }
        }

        // Delete related records in proper order (respecting foreign key constraints)
        // Delete loyalty transactions
        await dbUtils.run(
          `DELETE FROM loyalty_transactions WHERE order_id IN (${orderIds.map(() => '?').join(',')})`,
          orderIds
        );

        // Delete payments
        await dbUtils.run(
          `DELETE FROM payments WHERE order_id IN (${orderIds.map(() => '?').join(',')})`,
          orderIds
        );

        // Delete order items (cascade should handle this, but being explicit)
        await dbUtils.run(
          `DELETE FROM order_items WHERE order_id IN (${orderIds.map(() => '?').join(',')})`,
          orderIds
        );

        // Delete inventory transactions related to these orders
        await dbUtils.run(
          `DELETE FROM inventory_transactions WHERE reference_id IN (${orderIds.map(() => '?').join(',')}) AND reference_type = 'order'`,
          orderIds
        );

        // Delete the orders themselves
        await dbUtils.run(
          `DELETE FROM orders WHERE id IN (${orderIds.map(() => '?').join(',')})`,
          orderIds
        );

        // Update table status to available and clear current_order_id
        await dbUtils.run(
          'UPDATE tables SET status = ?, current_order_id = NULL WHERE id = ?',
          ['available', tableId]
        );
      }
    ]);

    res.json({
      message: `Successfully cleared ${orders.length} orders from table ${table.table_number}`,
      deleted_count: orders.length,
      table_status: 'available'
    });

  } catch (error) {
    console.error('Clear table orders error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteOrderHistory = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { restoreStock = true } = req.body;

    // Check if order exists
    const order = await dbUtils.get(
      'SELECT * FROM orders WHERE id = ?',
      [id]
    );

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Execute deletion in a transaction
    await dbUtils.transaction([
      async () => {
        // If restoreStock is true and order wasn't already refunded, restore inventory
        if (restoreStock && order.order_status !== 'refunded') {
          const orderItems = await dbUtils.all(
            'SELECT * FROM order_items WHERE order_id = ?',
            [id]
          );

          for (const item of orderItems) {
            // Restore stock
            await dbUtils.run(
              'UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ?',
              [item.quantity, item.product_id]
            );

            // Record inventory transaction
            await dbUtils.run(`
              INSERT INTO inventory_transactions 
              (product_id, transaction_type, quantity, reference_id, reference_type, notes)
              VALUES (?, ?, ?, ?, ?, ?)
            `, [
              item.product_id,
              'adjustment',
              item.quantity,
              id,
              'order_deletion',
              `Stock restored due to order ${order.order_number} deletion`
            ]);
          }
        }

        // Delete related records in proper order
        // Delete loyalty transactions
        await dbUtils.run(
          'DELETE FROM loyalty_transactions WHERE order_id = ?',
          [id]
        );

        // Delete payments
        await dbUtils.run(
          'DELETE FROM payments WHERE order_id = ?',
          [id]
        );

        // Delete order items (cascade should handle this, but being explicit)
        await dbUtils.run(
          'DELETE FROM order_items WHERE order_id = ?',
          [id]
        );

        // Delete inventory transactions related to this order
        await dbUtils.run(
          'DELETE FROM inventory_transactions WHERE reference_id = ? AND reference_type = ?',
          [id, 'order']
        );

        // Delete the order itself
        await dbUtils.run(
          'DELETE FROM orders WHERE id = ?',
          [id]
        );

        // If this order was associated with a table, update table status
        if (order.table_id) {
          const tableHasOtherOrders = await dbUtils.get(
            'SELECT COUNT(*) as count FROM orders WHERE table_id = ?',
            [order.table_id]
          );

          if (tableHasOtherOrders.count === 0) {
            await dbUtils.run(
              'UPDATE tables SET status = ?, current_order_id = NULL WHERE id = ?',
              ['available', order.table_id]
            );
          }
        }
      }
    ]);

    res.json({
      message: `Order ${order.order_number} has been permanently deleted`,
      order_number: order.order_number
    });

  } catch (error) {
    console.error('Delete order history error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteAllReports = async (req: AuthRequest, res: Response) => {
  try {
    console.log('Starting delete all reports operation...');

    await dbUtils.transaction([
      async () => {
        // Delete all orders and related data
        console.log('Deleting all order items...');
        await dbUtils.run('DELETE FROM order_items');

        console.log('Deleting all payments...');
        await dbUtils.run('DELETE FROM payments');

        console.log('Deleting all orders...');
        await dbUtils.run('DELETE FROM orders');

        // Delete daily sales summary if it exists
        console.log('Deleting daily sales summary...');
        await dbUtils.run('DELETE FROM daily_sales').catch(() => {
          // Table might not exist, ignore error
          console.log('Daily sales table not found or already empty');
        });

        // Delete inventory transactions
        console.log('Deleting inventory transactions...');
        await dbUtils.run('DELETE FROM inventory_transactions');

        // Reset auto-increment counters
        console.log('Resetting auto-increment counters...');
        await dbUtils.run(`UPDATE sqlite_sequence SET seq = 0 WHERE name IN ('orders', 'order_items', 'payments', 'daily_sales', 'inventory_transactions')`);

        // Restore all product stock to original levels (optional)
        console.log('Resetting product stock quantities...');
        await dbUtils.run('UPDATE products SET stock_quantity = 100 WHERE stock_quantity < 100');

        console.log('All reports data deleted successfully');
      }
    ]);

    res.json({
      success: true,
      message: 'All reports and sales data have been deleted successfully',
      deleted: {
        orders: 'All orders deleted',
        order_items: 'All order items deleted',
        payments: 'All payment records deleted',
        daily_sales: 'Daily sales summary cleared',
        inventory_transactions: 'Inventory transactions cleared',
        counters_reset: 'Auto-increment counters reset'
      }
    });

  } catch (error) {
    console.error('Delete all reports error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getSalesAnalytics = async (req: AuthRequest, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    console.log('Analytics request:', { startDate, endDate, user: req.user?.username });
    
    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Start date and end date are required' });
    }

    // Get daily sales data for the date range
    const salesData = await dbUtils.all(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as orders,
        COALESCE(SUM(final_amount), 0) as sales
      FROM orders 
      WHERE DATE(created_at) BETWEEN ? AND ? 
      AND order_status != 'cancelled'
      GROUP BY DATE(created_at)
      ORDER BY DATE(created_at)
    `, [startDate, endDate]);

    console.log('Raw sales data from DB:', salesData);

    // Fill in missing dates with zero values
    const start = new Date(startDate as string);
    const end = new Date(endDate as string);
    const allDates = [];
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      const existingData = salesData.find(item => item.date === dateStr);
      
      allDates.push({
        date: dateStr,
        sales: existingData ? parseFloat(existingData.sales) : 0,
        orders: existingData ? existingData.orders : 0
      });
    }

    console.log('Processed analytics data:', allDates);

    res.json({
      success: true,
      data: allDates
    });

  } catch (error) {
    console.error('Get sales analytics error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Unpaid Orders Management Functions

export const getUnpaidOrders = async (req: AuthRequest, res: Response) => {
  try {
    const { customer_name, table_number, limit = 50 } = req.query;
    
    let query = `
      SELECT uo.*, o.order_number, o.order_status, o.payment_status
      FROM unpaid_orders uo
      JOIN orders o ON uo.order_id = o.id
    `;
    
    const conditions = [];
    const params = [];

    if (customer_name) {
      conditions.push('uo.customer_name LIKE ?');
      params.push(`%${customer_name}%`);
    }

    if (table_number) {
      conditions.push('uo.table_number = ?');
      params.push(table_number);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY uo.created_at DESC LIMIT ?';
    params.push(Number(limit));

    console.log('Executing query:', query);
    console.log('Query params:', params);

    const unpaidOrders = await dbUtils.all(query, params);
    
    console.log('Raw unpaid orders from DB:', unpaidOrders);
    
    // Parse items summary for each unpaid order
    for (const order of unpaidOrders) {
      try {
        order.items = JSON.parse(order.items_summary || '[]');
      } catch (error) {
        order.items = [];
      }
    }

    console.log('Processed unpaid orders:', unpaidOrders);
    res.json(unpaidOrders);
  } catch (error) {
    console.error('Get unpaid orders error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const addToUnpaidTable = async (req: AuthRequest, res: Response) => {
  try {
    const { order_id, customer_name, customer_phone, table_number, notes } = req.body;

    console.log('Adding to unpaid table:', { order_id, customer_name, customer_phone, table_number, notes });

    if (!order_id || !customer_name) {
      return res.status(400).json({ message: 'Order ID and customer name are required' });
    }

    // Check if order exists (allow both paid and unpaid orders)
    const order = await dbUtils.get(`
      SELECT o.*, c.name as customer_name, c.phone as customer_phone
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      WHERE o.id = ?
    `, [order_id]);

    console.log('Found order:', order);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Warn if order is already completed but still allow it
    if (order.payment_status === 'completed') {
      console.log('Adding completed order to unpaid table:', order_id);
    }

    // Check if already in unpaid table
    const existingUnpaid = await dbUtils.get(
      'SELECT * FROM unpaid_orders WHERE order_id = ?',
      [order_id]
    );

    console.log('Existing unpaid order:', existingUnpaid);

    if (existingUnpaid) {
      return res.status(400).json({ message: 'Order is already in the unpaid table' });
    }

    // Get order items for summary
    const items = await dbUtils.all(`
      SELECT oi.*, p.name as product_name
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ?
    `, [order_id]);

    const itemsSummary = items.map(item => ({
      product_name: item.product_name,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total_price: item.total_price
    }));

    // Add to unpaid table
    const result = await dbUtils.run(`
      INSERT INTO unpaid_orders 
      (order_id, customer_name, customer_phone, table_number, total_amount, items_summary, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      order_id,
      customer_name,
      customer_phone || order.customer_phone,
      table_number || order.table_number,
      order.final_amount,
      JSON.stringify(itemsSummary),
      notes || null
    ]);

    const unpaidOrder = await dbUtils.get(`
      SELECT uo.*, o.order_number, o.order_status, o.payment_status
      FROM unpaid_orders uo
      JOIN orders o ON uo.order_id = o.id
      WHERE uo.id = ?
    `, [result.lastID]);

    // Parse items summary
    try {
      unpaidOrder.items = JSON.parse(unpaidOrder.items_summary || '[]');
    } catch (error) {
      unpaidOrder.items = [];
    }

    res.status(201).json(unpaidOrder);
  } catch (error) {
    console.error('Add to unpaid table error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const removeFromUnpaidTable = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Check if unpaid order exists
    const unpaidOrder = await dbUtils.get(
      'SELECT * FROM unpaid_orders WHERE id = ?',
      [id]
    );

    if (!unpaidOrder) {
      return res.status(404).json({ message: 'Unpaid order not found' });
    }

    // Remove from unpaid table
    await dbUtils.run(
      'DELETE FROM unpaid_orders WHERE id = ?',
      [id]
    );

    res.json({ 
      message: 'Order removed from unpaid table successfully',
      order_id: unpaidOrder.order_id
    });
  } catch (error) {
    console.error('Remove from unpaid table error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const markUnpaidOrderAsPaid = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { payment_method = 'cash', notes } = req.body;

    // Check if unpaid order exists
    const unpaidOrder = await dbUtils.get(
      'SELECT uo.*, o.* FROM unpaid_orders uo JOIN orders o ON uo.order_id = o.id WHERE uo.id = ?',
      [id]
    );

    if (!unpaidOrder) {
      return res.status(404).json({ message: 'Unpaid order not found' });
    }

    console.log('Marking unpaid order as paid:', unpaidOrder);

    // Update the original order to mark it as paid
    await dbUtils.run(
      'UPDATE orders SET payment_status = ?, payment_method = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      ['completed', payment_method, unpaidOrder.order_id]
    );

    // Create a payment record for this order
    await dbUtils.run(`
      INSERT INTO payments (
        order_id, 
        payment_method, 
        amount_paid, 
        payment_status, 
        transaction_date, 
        notes,
        cashier_name
      ) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, ?, ?)
    `, [
      unpaidOrder.order_id,
      payment_method,
      unpaidOrder.total_amount,
      'completed',
      notes || `Payment processed from unpaid orders - ${unpaidOrder.customer_name}`,
      req.user?.username || 'System'
    ]);

    // Remove from unpaid orders table
    await dbUtils.run(
      'DELETE FROM unpaid_orders WHERE id = ?',
      [id]
    );

    // Get updated order info
    const updatedOrder = await dbUtils.get(
      'SELECT * FROM orders WHERE id = ?',
      [unpaidOrder.order_id]
    );

    res.json({ 
      message: `Order marked as paid successfully. Payment of ${unpaidOrder.total_amount} processed.`,
      order: updatedOrder,
      payment_method,
      amount_paid: unpaidOrder.total_amount
    });

  } catch (error) {
    console.error('Mark unpaid order as paid error:', error);
    res.status(500).json({ message: 'Failed to mark order as paid' });
  }
};

export const updateUnpaidOrder = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { customer_name, customer_phone, table_number, notes } = req.body;

    // Check if unpaid order exists
    const unpaidOrder = await dbUtils.get(
      'SELECT * FROM unpaid_orders WHERE id = ?',
      [id]
    );

    if (!unpaidOrder) {
      return res.status(404).json({ message: 'Unpaid order not found' });
    }

    // Update unpaid order
    await dbUtils.run(`
      UPDATE unpaid_orders 
      SET customer_name = ?, customer_phone = ?, table_number = ?, notes = ?
      WHERE id = ?
    `, [
      customer_name || unpaidOrder.customer_name,
      customer_phone || unpaidOrder.customer_phone,
      table_number || unpaidOrder.table_number,
      notes || unpaidOrder.notes,
      id
    ]);

    const updatedUnpaidOrder = await dbUtils.get(`
      SELECT uo.*, o.order_number, o.order_status, o.payment_status
      FROM unpaid_orders uo
      JOIN orders o ON uo.order_id = o.id
      WHERE uo.id = ?
    `, [id]);

    // Parse items summary
    try {
      updatedUnpaidOrder.items = JSON.parse(updatedUnpaidOrder.items_summary || '[]');
    } catch (error) {
      updatedUnpaidOrder.items = [];
    }

    res.json(updatedUnpaidOrder);
  } catch (error) {
    console.error('Update unpaid order error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getUnpaidOrderById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const unpaidOrder = await dbUtils.get(`
      SELECT uo.*, o.order_number, o.order_status, o.payment_status, o.created_at as order_created_at
      FROM unpaid_orders uo
      JOIN orders o ON uo.order_id = o.id
      WHERE uo.id = ?
    `, [id]);

    if (!unpaidOrder) {
      return res.status(404).json({ message: 'Unpaid order not found' });
    }

    // Parse items summary
    try {
      unpaidOrder.items = JSON.parse(unpaidOrder.items_summary || '[]');
    } catch (error) {
      unpaidOrder.items = [];
    }

    res.json(unpaidOrder);
  } catch (error) {
    console.error('Get unpaid order error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getUnpaidStats = async (req: AuthRequest, res: Response) => {
  try {
    const stats = await dbUtils.get(`
      SELECT 
        COUNT(*) as total_unpaid_orders,
        COALESCE(SUM(total_amount), 0) as total_unpaid_amount,
        COUNT(DISTINCT customer_name) as unique_customers
      FROM unpaid_orders
    `);

    const customerBreakdown = await dbUtils.all(`
      SELECT 
        customer_name,
        COUNT(*) as order_count,
        SUM(total_amount) as total_amount
      FROM unpaid_orders
      GROUP BY customer_name
      ORDER BY total_amount DESC
      LIMIT 10
    `);

    res.json({
      ...stats,
      customer_breakdown: customerBreakdown
    });
  } catch (error) {
    console.error('Get unpaid stats error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
