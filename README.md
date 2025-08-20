# Inland Cafe - Point of Sale System

A modern, full-featured Point of Sale system built specifically for Inland Cafe. This system provides comprehensive functionality for managing orders, inventory, customers, and sales analytics.

## Features

### 🛒 Point of Sale
- **Intuitive Order Interface**: Easy-to-use interface for quick order entry
- **Product Categories**: Organized menu with coffee, tea, pastries, sandwiches, desserts, and beverages
- **Real-time Cart Management**: Add, remove, and modify items with instant updates
- **Multiple Payment Methods**: Support for cash, card, and mobile payments
- **Table Management**: Track orders by table number
- **Order Notes**: Add special instructions and customizations

### 📊 Dashboard & Analytics
- **Real-time Statistics**: Today's sales, orders, and customer count
- **Sales Trends**: Visual representation of daily sales performance
- **Top Products**: Track best-selling items
- **Payment Method Breakdown**: Analyze payment preferences
- **Low Stock Alerts**: Automatic notifications for inventory management

### 📦 Inventory Management
- **Product Management**: Add, edit, and organize menu items
- **Stock Tracking**: Real-time inventory levels with automatic updates
- **Low Stock Alerts**: Configurable minimum stock levels
- **Category Organization**: Organize products by categories with custom colors
- **Cost Tracking**: Monitor product costs and profit margins

### 📋 Order Management
- **Order History**: Complete order tracking and history
- **Order Status**: Track orders from creation to completion
- **Customer Information**: Optional customer details and loyalty tracking
- **Receipt Generation**: Professional receipts for all transactions
- **Refund Processing**: Handle returns and refunds with inventory restoration

### 📈 Reports & Analytics
- **Sales Reports**: Detailed sales analysis with date range filters
- **Performance Metrics**: Track key business indicators
- **Product Performance**: Analyze which items are performing best
- **Payment Analytics**: Understand customer payment preferences

### 👥 User Management
- **Role-based Access**: Admin, Manager, and Cashier roles
- **Secure Authentication**: JWT-based authentication system
- **User Activity Tracking**: Monitor system usage and activities

## Technology Stack

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **Zustand** for state management
- **React Router** for navigation
- **Lucide React** for icons
- **Vite** for development and building

### Backend
- **Node.js** with Express
- **TypeScript** for type safety
- **SQLite** for database (lightweight and portable)
- **JWT** for authentication
- **bcrypt** for password hashing

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd inland-cafe-pos
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Initialize the database**
   ```bash
   npm run db:migrate
   npm run db:seed
   ```

5. **Start the development servers**
   ```bash
   npm run dev
   ```

This will start both the frontend (http://localhost:5173) and backend (http://localhost:3001) servers.

### Default Login Credentials

After seeding the database, you can use these credentials:

- **Admin**: `admin` / `admin123`
- **Cashier**: `cashier` / `cashier123`

## Project Structure

```
inland-cafe-pos/
├── src/                    # Frontend React application
│   ├── components/         # Reusable UI components
│   ├── pages/             # Page components
│   ├── store/             # Zustand state management
│   ├── types/             # TypeScript type definitions
│   ├── utils/             # Utility functions and API client
│   └── ...
├── server/                # Backend Express application
│   ├── controllers/       # Request handlers
│   ├── middleware/        # Express middleware
│   ├── models/           # Database models
│   ├── routes/           # API routes
│   ├── database/         # Database configuration and schema
│   └── scripts/          # Database migration and seeding
├── public/               # Static assets
└── ...
```

## Available Scripts

- `npm run dev` - Start development servers (frontend + backend)
- `npm run build` - Build the production application
- `npm run server` - Start only the backend server
- `npm run client` - Start only the frontend development server
- `npm run db:migrate` - Run database migrations
- `npm run db:seed` - Seed the database with sample data

## Database Schema

The system uses SQLite with the following main tables:

- **users** - System users and authentication
- **categories** - Product categories
- **products** - Menu items and inventory
- **orders** - Customer orders
- **order_items** - Individual items in orders
- **payments** - Payment records
- **customers** - Customer information
- **inventory_transactions** - Stock movement tracking
- **daily_sales** - Daily sales summaries

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/change-password` - Change password

### Categories
- `GET /api/categories` - List categories
- `POST /api/categories` - Create category
- `PUT /api/categories/:id` - Update category
- `DELETE /api/categories/:id` - Delete category

### Products
- `GET /api/products` - List products
- `POST /api/products` - Create product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product
- `GET /api/products/low-stock` - Get low stock items
- `PATCH /api/products/:id/stock` - Update stock

### Orders
- `GET /api/orders` - List orders
- `POST /api/orders` - Create order
- `GET /api/orders/:id` - Get order details
- `PATCH /api/orders/:id/status` - Update order status
- `GET /api/orders/stats/today` - Get today's statistics

## Features in Detail

### Order Processing
1. **Add Products**: Browse categories and add items to cart
2. **Customize Orders**: Add notes and special instructions
3. **Apply Discounts**: Percentage or fixed amount discounts
4. **Process Payment**: Choose payment method and complete transaction
5. **Generate Receipt**: Automatic receipt generation
6. **Update Inventory**: Real-time stock level updates

### Inventory Management
- **Automatic Stock Updates**: Stock levels adjust automatically with each sale
- **Low Stock Monitoring**: Visual alerts when products reach minimum levels
- **Stock Adjustments**: Manual stock level adjustments with reason tracking
- **Cost Tracking**: Monitor product costs for profit analysis

### Reporting
- **Daily Sales**: Track daily performance metrics
- **Product Analysis**: Identify top-selling items
- **Payment Trends**: Analyze customer payment preferences
- **Time-based Reports**: Filter reports by date ranges

## Security Features

- **JWT Authentication**: Secure token-based authentication
- **Role-based Authorization**: Different access levels for different user roles
- **Password Hashing**: Secure password storage using bcrypt
- **Input Validation**: Server-side validation for all inputs
- **SQL Injection Prevention**: Parameterized queries for database safety

## Customization

The system is designed to be easily customizable:

- **Branding**: Update colors and styling in Tailwind configuration
- **Menu Items**: Easily add, remove, or modify products through the admin interface
- **Tax Rates**: Configure tax rates in the order processing logic
- **Business Rules**: Modify discount rules, minimum stock levels, etc.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support or questions, please contact the development team or create an issue in the repository.

---

**Inland Cafe POS System** - Streamlining cafe operations with modern technology. ☕️
