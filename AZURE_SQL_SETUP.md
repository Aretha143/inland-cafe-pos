# 🔧 Azure SQL Database Setup for Inland Cafe POS

## 🎯 **Quick Setup Guide**

Your POS system is now configured to use Azure SQL Database! Here's how to set it up:

## 📋 **Step 1: Get Your Azure SQL Connection Details**

You need these details from your Azure SQL Database:
- **Server name**: `your-server.database.windows.net`
- **Database name**: `your-database-name`
- **Username**: `your-username`
- **Password**: `your-password`

## 🔧 **Step 2: Set Environment Variables**

Run these commands in your terminal:

```bash
export AZURE_SQL_SERVER=your-server.database.windows.net
export AZURE_SQL_DATABASE=your-database-name
export AZURE_SQL_USER=your-username
export AZURE_SQL_PASSWORD=your-password
export USE_AZURE_SQL=true
```

**Example:**
```bash
export AZURE_SQL_SERVER=inland-cafe-pos-server.database.windows.net
export AZURE_SQL_DATABASE=inland-cafe-pos-db
export AZURE_SQL_USER=admin
export AZURE_SQL_PASSWORD=YourStrongPassword123!
export USE_AZURE_SQL=true
```

## 🚀 **Step 3: Start the Application**

### **Option A: Use the Setup Script**
```bash
./setup-azure-sql.sh
```

### **Option B: Manual Start**
```bash
npm run dev
```

## ✅ **Step 4: Verify Connection**

You should see these messages in the console:
```
🔗 Using Azure SQL Database
✅ Connected to Azure SQL Database
✅ Azure SQL Database schema initialized successfully
✅ Azure SQL Database seeded with sample data
```

## 🔐 **Step 5: Login**

Use these credentials to log in:
- **Admin**: `admin` / `admin123`
- **Cashier**: `cashier` / `cashier123`

## 🛠️ **Troubleshooting**

### **Connection Issues**
If you see connection errors:
1. Check your Azure SQL firewall settings
2. Verify your connection details
3. Make sure your Azure SQL Database is running

### **Fallback to SQLite**
If Azure SQL doesn't work, the app will automatically fall back to SQLite:
```bash
unset USE_AZURE_SQL
npm run dev
```

## 🔒 **Security Notes**

- Never commit passwords to Git
- Use environment variables for sensitive data
- Consider using Azure Key Vault for production

## 📞 **Need Help?**

If you're having issues:
1. Check the console logs for error messages
2. Verify your Azure SQL connection details
3. Make sure your Azure SQL Database is accessible from your IP

---

**🎉 Your POS system is now ready to use with Azure SQL Database!**
