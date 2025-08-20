# 🚀 Quick Start Guide - Inland Cafe POS

## One-Command Setup

Run the setup script to install dependencies and initialize the database:

```bash
./setup.sh
```

## Manual Setup (if setup script fails)

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Initialize database:**
   ```bash
   npm run db:migrate
   npm run db:seed
   ```

3. **Start the application:**
   ```bash
   npm run dev
   ```

## Access the Application

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3001/api

## Default Login Credentials

| Role    | Username | Password  |
|---------|----------|-----------|
| Admin   | admin    | admin123  |
| Cashier | cashier  | cashier123|

## Key Features Available

### ✅ Completed Features
- 🔐 **User Authentication** - Secure login with role-based access
- 🛒 **Point of Sale** - Complete ordering system with cart management
- 📊 **Dashboard** - Real-time analytics and business insights
- 📦 **Product Management** - Full inventory control with categories
- 📋 **Order Management** - Track and manage all customer orders
- 📈 **Reports & Analytics** - Sales trends and performance metrics
- 🎨 **Modern UI** - Responsive design optimized for cafe operations

### 🔄 Core Functionality
- **Multi-Category Menu** - Coffee, Tea, Pastries, Sandwiches, Desserts, Beverages
- **Real-time Inventory** - Automatic stock updates with low-stock alerts
- **Multiple Payment Methods** - Cash, Card, Mobile payments
- **Order Customization** - Table numbers, special notes, discounts
- **Receipt Generation** - Professional transaction receipts
- **Stock Management** - Inventory tracking with automatic adjustments

### 📱 User Experience
- **Intuitive POS Interface** - Quick product selection and checkout
- **Real-time Updates** - Instant cart and inventory updates
- **Responsive Design** - Works on desktop, tablet, and mobile
- **Visual Feedback** - Clear status indicators and notifications
- **Fast Performance** - Optimized for high-volume operations

## Database Schema

The system includes pre-configured tables for:
- Users & Authentication
- Product Categories & Items
- Orders & Order Items
- Payments & Transactions
- Inventory Management
- Sales Analytics

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Current user info

### Products & Categories
- `GET /api/categories` - List all categories
- `GET /api/products` - List all products (with filters)
- `POST /api/products` - Create new product (admin/manager)

### Orders
- `POST /api/orders` - Create new order
- `GET /api/orders` - List orders (with filters)
- `GET /api/orders/stats/today` - Today's statistics

## Troubleshooting

### Network Issues During Setup
If npm install fails due to network timeouts:
```bash
npm install --verbose --timeout=60000
```

### Database Issues
If database setup fails:
```bash
rm -f server/database/pos.db
npm run db:migrate
npm run db:seed
```

### Port Conflicts
If ports 3001 or 5173 are in use:
- Backend: Set `PORT=3002` in environment
- Frontend: Vite will automatically use next available port

## Next Steps

1. **Customize Menu** - Add your actual cafe products through the admin interface
2. **Configure Settings** - Adjust tax rates, discount rules, etc.
3. **Train Staff** - Use the cashier account to familiarize staff with the system
4. **Go Live** - Start processing real orders!

## Support

For questions or issues:
- Check the full README.md for detailed documentation
- Review the code comments for implementation details
- Test all features with the demo data provided

---

**Happy Selling! ☕️**
