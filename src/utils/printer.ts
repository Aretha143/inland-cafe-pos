import { Order } from '../types';
import { formatAmount } from './currency';

export interface PrintOptions {
  includeLogo?: boolean;
  includeFooter?: boolean;
  paperWidth?: number; // in characters for thermal printers
}

export class BillPrinter {
  private paperWidth: number;

  constructor(paperWidth: number = 48) {
    this.paperWidth = paperWidth;
  }

  // Center text within paper width
  private centerText(text: string): string {
    const padding = Math.max(0, Math.floor((this.paperWidth - text.length) / 2));
    return ' '.repeat(padding) + text;
  }

  // Right align text
  private rightAlign(text: string): string {
    const padding = Math.max(0, this.paperWidth - text.length);
    return ' '.repeat(padding) + text;
  }

  // Create a line with left and right text
  private createLine(left: string, right: string): string {
    const maxLeftLength = this.paperWidth - right.length - 1;
    const truncatedLeft = left.length > maxLeftLength ? left.substring(0, maxLeftLength) : left;
    const padding = this.paperWidth - truncatedLeft.length - right.length;
    return truncatedLeft + ' '.repeat(Math.max(1, padding)) + right;
  }

  // Create separator line
  private separator(char: string = '-'): string {
    return char.repeat(this.paperWidth);
  }

  // Format order for thermal printer
  public formatReceipt(order: Order, options: PrintOptions = {}): string {
    const lines: string[] = [];

    // Header with logo/business name
    if (options.includeLogo !== false) {
      lines.push(this.centerText('INLAND CAFE'));
      lines.push(this.centerText('BANSABARI'));
      lines.push(this.centerText('Tel: +977-XXX-XXXXX'));
      lines.push('');
    }

    // Receipt title
    lines.push(this.centerText('RECEIPT'));
    lines.push(this.separator('='));

    // Order details
    lines.push(`Order No: ${order.order_number}`);
    lines.push(`Date: ${new Date(order.created_at).toLocaleString()}`);
    lines.push(`Customer: ${order.customer_name || 'Walk-in Customer'}`);
    if (order.table_number) {
      lines.push(`Table: ${order.table_number}`);
    }
    lines.push(`Cashier: Admin`); // You can get this from user context
    lines.push(this.separator());

    // Items header
    lines.push('ITEMS:');
    lines.push(this.separator('-'));

    // Order items
    if (order.items && order.items.length > 0) {
      order.items.forEach(item => {
        // Item name and quantity
        const itemLine = `${item.quantity || 1}x ${item.product_name || item.name || 'Unknown Item'}`;
        lines.push(itemLine);
        
        // Price and total on next line, right aligned
        const unitPrice = item.unit_price || item.price || 0;
        const totalPrice = item.total_price || (unitPrice * (item.quantity || 1));
        
        const priceLine = this.createLine(
          `  @ ${formatAmount(unitPrice)}`,
          formatAmount(totalPrice)
        );
        lines.push(priceLine);

        // Item notes if any
        if (item.notes) {
          lines.push(`  Note: ${item.notes}`);
        }
        lines.push(''); // Empty line between items
      });
    }

    lines.push(this.separator('-'));

    // Totals
    lines.push(this.createLine('Subtotal:', formatAmount(order.total_amount)));
    
    if ((order.discount_amount || 0) > 0) {
      lines.push(this.createLine('Discount:', `-${formatAmount(order.discount_amount)}`));
    }
    
    if ((order.tax_amount || 0) > 0) {
      lines.push(this.createLine('Tax:', formatAmount(order.tax_amount)));
    }
    
    lines.push(this.separator('='));
    lines.push(this.createLine('TOTAL:', formatAmount(order.final_amount)));
    lines.push(this.separator('='));

    // Payment info
    lines.push('');
    lines.push(`Payment: ${(order.payment_method || 'CASH').toUpperCase()}`);
    lines.push(`Status: ${(order.order_status || 'PENDING').toUpperCase()}`);

    // Footer
    if (options.includeFooter !== false) {
      lines.push('');
      lines.push(this.centerText('Thank you for visiting!'));
      lines.push(this.centerText('Please come again'));
      lines.push('');
      lines.push(this.centerText('GST No: XXXXXXXXXXXXXXX'));
      lines.push('');
    }

    // Cut command for thermal printers
    lines.push('\n\n\n');

    return lines.join('\n');
  }

  // Print using browser's print functionality
  public printReceipt(order: Order, options: PrintOptions = {}): void {
    const receiptContent = this.formatReceipt(order, options);
    
    // Create a new window for printing
    const printWindow = window.open('', '_blank', 'width=300,height=600');
    
    if (!printWindow) {
      alert('Please allow pop-ups for printing functionality');
      return;
    }

    // HTML content for printing
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Receipt - ${order.order_number}</title>
        <style>
          @media print {
            @page {
              margin: 0;
              size: 80mm auto;
            }
            body { 
              margin: 0; 
              padding: 5mm;
              font-family: 'Courier New', monospace;
              font-size: 12px;
              line-height: 1.2;
            }
            .no-print { display: none; }
          }
          body {
            font-family: 'Courier New', monospace;
            font-size: 12px;
            line-height: 1.2;
            margin: 10px;
            background: white;
            color: black;
          }
          .receipt-content {
            white-space: pre-line;
            max-width: 300px;
          }
          .print-button {
            margin: 10px 0;
            padding: 10px 20px;
            background: #3b82f6;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
          }
        </style>
      </head>
      <body>
        <div class="no-print">
          <button class="print-button" onclick="window.print()">🖨️ Print Receipt</button>
          <button class="print-button" onclick="window.close()" style="background: #6b7280;">Close</button>
        </div>
        <div class="receipt-content">${receiptContent}</div>
        <script>
          // Auto-print when page loads
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 500);
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  }

  // Generate downloadable receipt file
  public downloadReceipt(order: Order, options: PrintOptions = {}): void {
    const receiptContent = this.formatReceipt(order, options);
    const blob = new Blob([receiptContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `receipt-${order.order_number}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  // ESC/POS commands for thermal printers (if using direct printer connection)
  public generateESCPOS(order: Order): Uint8Array {
    const commands: number[] = [];
    
    // Initialize printer
    commands.push(0x1B, 0x40); // ESC @ - Initialize
    
    // Set character set
    commands.push(0x1B, 0x74, 0x00); // ESC t 0 - Select character set
    
    // Center alignment
    commands.push(0x1B, 0x61, 0x01); // ESC a 1 - Center alignment
    
    // Double width and height for header
    commands.push(0x1B, 0x21, 0x30); // ESC ! 48 - Double width and height
    
    // Business name
    const businessName = 'INLAND CAFE\n';
    for (let i = 0; i < businessName.length; i++) {
      commands.push(businessName.charCodeAt(i));
    }
    
    // Reset font size
    commands.push(0x1B, 0x21, 0x00); // ESC ! 0 - Normal font
    
    // Business details
    const details = 'BANSABARI\nTel: +977-XXX-XXXXX\n\n';
    for (let i = 0; i < details.length; i++) {
      commands.push(details.charCodeAt(i));
    }
    
    // Left alignment for receipt content
    commands.push(0x1B, 0x61, 0x00); // ESC a 0 - Left alignment
    
    // Receipt content
    const receiptText = this.formatReceipt(order, { includeLogo: false });
    for (let i = 0; i < receiptText.length; i++) {
      commands.push(receiptText.charCodeAt(i));
    }
    
    // Cut paper
    commands.push(0x1D, 0x56, 0x42, 0x00); // GS V B 0 - Cut paper
    
    return new Uint8Array(commands);
  }
}

// Export singleton instance
export const billPrinter = new BillPrinter(48); // 48 characters for standard thermal printer

// Utility function for quick printing
export const printOrderReceipt = (order: Order, options?: PrintOptions) => {
  billPrinter.printReceipt(order, options);
};

// Utility function for quick download
export const downloadOrderReceipt = (order: Order, options?: PrintOptions) => {
  billPrinter.downloadReceipt(order, options);
};
