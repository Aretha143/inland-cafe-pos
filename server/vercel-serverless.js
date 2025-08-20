// Serverless-optimized server for Vercel deployment
// This file uses CommonJS to avoid ES module issues in serverless environment

const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, '../dist')));

// Simple in-memory data store for serverless environment
const memoryStore = {
  users: [
    {
      id: '1',
      username: 'admin',
      email: 'admin@inlandcafe.com',
      password_hash: '$2a$10$rQZ8N3YqX2vB1cD4eF5gH6iJ7kL8mN9oP0qR1sT2uV3wX4yZ5aB6cD7eF8gH9iJ',
      role: 'admin',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ],
  categories: [
    { id: '1', name: 'Beverages', description: 'Hot and cold drinks', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: '2', name: 'Food', description: 'Main dishes and snacks', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: '3', name: 'Desserts', description: 'Sweet treats and pastries', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
  ],
  products: [
    { id: '1', name: 'Coffee', description: 'Hot coffee', price: '2.50', category_id: '1', status: 'available', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: '2', name: 'Tea', description: 'Hot tea', price: '2.00', category_id: '1', status: 'available', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: '3', name: 'Burger', description: 'Beef burger', price: '8.50', category_id: '2', status: 'available', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: '4', name: 'Cake', description: 'Chocolate cake', price: '4.50', category_id: '3', status: 'available', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
  ],
  orders: [],
  tables: [],
  customers: []
};

// Health check endpoint
app.get('/api/health', (req, res) => {
  try {
    res.json({ 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      service: 'Inland Cafe POS API (Serverless)',
      environment: 'vercel',
      memoryStore: {
        users: memoryStore.users.length,
        categories: memoryStore.categories.length,
        products: memoryStore.products.length,
        orders: memoryStore.orders.length
      }
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Auth endpoints
app.post('/api/auth/login', (req, res) => {
  try {
    const { username, password } = req.body;
    
    const user = memoryStore.users.find(u => u.username === username);
    if (user && password === 'admin123') { // Simplified for demo
      res.json({
        success: true,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role
        },
        token: 'demo-token-' + Date.now()
      });
    } else {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Login failed' });
  }
});

// Categories endpoints
app.get('/api/categories', (req, res) => {
  try {
    res.json(memoryStore.categories);
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ message: 'Failed to get categories' });
  }
});

app.post('/api/categories', (req, res) => {
  try {
    const newCategory = {
      id: Date.now().toString(),
      ...req.body,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    memoryStore.categories.push(newCategory);
    res.json(newCategory);
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ message: 'Failed to create category' });
  }
});

// Products endpoints
app.get('/api/products', (req, res) => {
  try {
    res.json(memoryStore.products);
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ message: 'Failed to get products' });
  }
});

app.post('/api/products', (req, res) => {
  try {
    const newProduct = {
      id: Date.now().toString(),
      ...req.body,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    memoryStore.products.push(newProduct);
    res.json(newProduct);
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ message: 'Failed to create product' });
  }
});

// Orders endpoints
app.get('/api/orders', (req, res) => {
  try {
    res.json(memoryStore.orders);
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ message: 'Failed to get orders' });
  }
});

app.post('/api/orders', (req, res) => {
  try {
    const newOrder = {
      id: Date.now().toString(),
      ...req.body,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    memoryStore.orders.push(newOrder);
    res.json(newOrder);
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ message: 'Failed to create order' });
  }
});

// Tables endpoints
app.get('/api/tables', (req, res) => {
  try {
    res.json(memoryStore.tables);
  } catch (error) {
    console.error('Get tables error:', error);
    res.status(500).json({ message: 'Failed to get tables' });
  }
});

app.post('/api/tables', (req, res) => {
  try {
    const newTable = {
      id: Date.now().toString(),
      ...req.body,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    memoryStore.tables.push(newTable);
    res.json(newTable);
  } catch (error) {
    console.error('Create table error:', error);
    res.status(500).json({ message: 'Failed to create table' });
  }
});

// Customers endpoints
app.get('/api/customers', (req, res) => {
  try {
    res.json(memoryStore.customers);
  } catch (error) {
    console.error('Get customers error:', error);
    res.status(500).json({ message: 'Failed to get customers' });
  }
});

app.post('/api/customers', (req, res) => {
  try {
    const newCustomer = {
      id: Date.now().toString(),
      ...req.body,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    memoryStore.customers.push(newCustomer);
    res.json(newCustomer);
  } catch (error) {
    console.error('Create customer error:', error);
    res.status(500).json({ message: 'Failed to create customer' });
  }
});

// Users endpoints
app.get('/api/users', (req, res) => {
  try {
    res.json(memoryStore.users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Failed to get users' });
  }
});

// Serve React app for all other routes
app.get('*', (req, res) => {
  try {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
  } catch (error) {
    console.error('Serve static file error:', error);
    res.status(404).json({ message: 'File not found' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ 
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Export for Vercel serverless
module.exports = app;
