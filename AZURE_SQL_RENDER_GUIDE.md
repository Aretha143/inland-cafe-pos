# Azure SQL Database to Render Connection Guide

## 🔗 **Connecting Azure SQL Database to Render Web Service**

This guide will help you connect your Azure SQL database to your Render web service.

## 📋 **Prerequisites**

- ✅ Active Azure SQL Database
- ✅ Active Render web service
- ✅ Azure SQL Database connection details

## 🚀 **Step 1: Get Azure SQL Connection Details**

1. **Go to Azure Portal**: https://portal.azure.com
2. **Navigate to your SQL Database**
3. **Click on "Connection strings"** in the left menu
4. **Copy the connection details**:
   - Server name
   - Database name
   - Username
   - Password

## 🔥 **Step 2: Configure Azure SQL Firewall**

You need to allow Render's IP addresses to access your database:

### **Option A: Allow All Azure Services (Recommended for development)**
1. Go to your SQL Database in Azure Portal
2. Click **"Networking"** in the left menu
3. Under **"Firewall rules"**, enable **"Allow Azure services and resources to access this server"**
4. Click **"Save"**

### **Option B: Add Specific IP Ranges (More secure)**
1. Go to your SQL Database in Azure Portal
2. Click **"Networking"** in the left menu
3. Under **"Firewall rules"**, click **"Add your client IPv4 address"**
4. **Add Render's IP ranges** (you may need to contact Render support for current IPs)
5. Click **"Save"**

## ⚙️ **Step 3: Configure Render Environment Variables**

1. **Go to your Render dashboard**: https://dashboard.render.com
2. **Select your web service**
3. **Go to "Environment"** tab
4. **Add these environment variables**:

```bash
# Azure SQL Database Configuration
AZURE_SQL_SERVER=your-server.database.windows.net
AZURE_SQL_DATABASE=your-database-name
AZURE_SQL_USER=your-username
AZURE_SQL_PASSWORD=your-password

# Application Configuration
NODE_ENV=production
PORT=10000
JWT_SECRET=your-secure-jwt-secret
```

## 🔧 **Step 4: Update Your Application Code**

Your application is already configured to use Azure SQL. The connection is handled in `server/database/azure-connection.ts`.

## 🚀 **Step 5: Deploy to Render**

1. **Push your changes to GitHub**:
```bash
git add .
git commit -m "Configure Azure SQL connection for Render"
git push origin main
```

2. **Render will automatically deploy** your updated application

## 🧪 **Step 6: Test the Connection**

1. **Check Render logs** for connection status
2. **Test your API endpoints** to ensure database operations work
3. **Verify data persistence** by creating test records

## 🔍 **Troubleshooting**

### **Issue: Connection Timeout**
**Solution**: 
- Check firewall rules in Azure
- Verify connection string format
- Ensure database is running

### **Issue: Authentication Failed**
**Solution**:
- Verify username and password
- Check if user has proper permissions
- Ensure user exists in Azure SQL

### **Issue: SSL/TLS Error**
**Solution**:
- Azure SQL requires encrypted connections
- Your code already has `encrypt: true` configured

### **Issue: Database Not Found**
**Solution**:
- Verify database name
- Check if database exists
- Ensure user has access to the database

## 📊 **Monitoring**

### **Azure SQL Monitoring**
1. Go to Azure Portal
2. Check **"Metrics"** for connection statistics
3. Review **"Query Performance Insights"**

### **Render Monitoring**
1. Check **"Logs"** in Render dashboard
2. Monitor **"Metrics"** for performance
3. Set up **alerts** for errors

## 🔐 **Security Best Practices**

1. **Use Azure Key Vault** for storing sensitive connection strings
2. **Enable Azure SQL Auditing** for security monitoring
3. **Use Azure Active Directory** authentication when possible
4. **Regularly rotate passwords**
5. **Enable threat detection** in Azure SQL

## 📈 **Performance Optimization**

1. **Use connection pooling** (already configured in your code)
2. **Optimize queries** for better performance
3. **Monitor query performance** in Azure Portal
4. **Consider read replicas** for read-heavy workloads

## 🎯 **Expected Results**

After successful connection:
- ✅ Database operations working on Render
- ✅ Data persistence across deployments
- ✅ All POS functionality operational
- ✅ Real-time data synchronization

## 📞 **Support**

If you encounter issues:
1. Check Azure SQL firewall rules
2. Verify environment variables in Render
3. Review application logs
4. Test connection locally first

---

**Status**: ✅ Ready for Azure SQL to Render connection
**Last Updated**: August 21, 2025
