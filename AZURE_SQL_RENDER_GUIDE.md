# Azure SQL Database with Render Deployment Guide

## 🎯 **Overview**
This guide shows you how to use Azure SQL Database with your Render deployment, giving you the best of both worlds:
- **Render**: Excellent deployment platform
- **Azure SQL**: Robust, scalable database

## ✅ **Benefits**
- **Data Persistence**: Your data won't be lost when the server restarts
- **Better Performance**: Dedicated database vs. in-memory storage
- **Scalability**: Azure SQL can handle growth
- **Backup & Recovery**: Automatic backups and point-in-time recovery
- **Security**: Enterprise-grade security features

## 🗄️ **Step 1: Create Azure SQL Database**

### **1.1 Go to Azure Portal**
1. Visit [portal.azure.com](https://portal.azure.com)
2. Sign in with your Azure account

### **1.2 Create SQL Database**
1. Click **"Create a resource"**
2. Search for **"SQL Database"**
3. Click **"Create"**

### **1.3 Configure Database**
- **Subscription**: Your Azure subscription
- **Resource group**: Create new or use existing
- **Database name**: `inland-cafe-pos-db`
- **Server**: Create new server
  - **Server name**: `inland-cafe-pos-server` (must be unique)
  - **Location**: Choose a region close to you
  - **Authentication method**: **SQL authentication**
  - **Server admin login**: `admin` (or your preferred username)
  - **Password**: Create a strong password (save this!)
- **Compute + storage**: **Basic** (free tier for students)
- **Backup storage redundancy**: **Locally redundant storage**

### **1.4 Get Connection Details**
After creation, go to your database and note:
- **Server name**: `your-server.database.windows.net`
- **Database name**: `inland-cafe-pos-db`
- **Username**: `admin` (or what you chose)
- **Password**: The password you created

## 🔧 **Step 2: Configure Render Environment Variables**

### **2.1 Go to Render Dashboard**
1. Visit [dashboard.render.com](https://dashboard.render.com)
2. Select your **inland-cafe-pos** service

### **2.2 Add Environment Variables**
Go to **"Environment"** tab and add these variables:

```bash
USE_AZURE_SQL=true
AZURE_SQL_SERVER=your-server.database.windows.net
AZURE_SQL_DATABASE=inland-cafe-pos-db
AZURE_SQL_USER=admin
AZURE_SQL_PASSWORD=your-password-here
```

### **2.3 Redeploy**
Click **"Manual Deploy"** → **"Deploy latest commit**

## 🚀 **Step 3: Test Your Setup**

### **3.1 Check Logs**
After deployment, check the logs to see:
```
🔗 Using Azure SQL Database
✅ Connected to Azure SQL Database
✅ Azure SQL Database schema initialized successfully
✅ Azure SQL Database seeded with sample data
```

### **3.2 Test Your Application**
Visit your Render URL and test:
- Login with `admin` / `admin`
- Create categories and products
- Place orders
- Check that data persists after page refresh

## 🔒 **Step 4: Security Best Practices**

### **4.1 Firewall Rules**
In Azure Portal → Your SQL Database → **"Networking"**:
1. Add your IP address to allow connections
2. Or set **"Allow Azure services and resources to access this server"** to **Yes**

### **4.2 Connection String Security**
- Never commit passwords to Git
- Use environment variables in Render
- Rotate passwords regularly

## 📊 **Step 5: Monitor Your Database**

### **5.1 Azure Portal Monitoring**
- **Overview**: Check database status and performance
- **Query Performance Insight**: Monitor slow queries
- **Metrics**: Track usage and performance

### **5.2 Render Monitoring**
- **Logs**: Check application logs for database errors
- **Metrics**: Monitor response times and errors

## 🛠️ **Troubleshooting**

### **Common Issues**

#### **Connection Timeout**
```
Error: Connection timeout
```
**Solution**: Check firewall rules in Azure SQL Database

#### **Authentication Failed**
```
Error: Login failed for user 'admin'
```
**Solution**: Verify username and password in environment variables

#### **Schema Initialization Failed**
```
Error: Cannot create table
```
**Solution**: Check if tables already exist, the script handles this automatically

### **Fallback to SQLite**
If Azure SQL doesn't work, you can fallback to SQLite by:
1. Remove the `USE_AZURE_SQL=true` environment variable
2. Redeploy your application

## 💰 **Cost Management**

### **Azure SQL Database Costs**
- **Basic Tier**: Free for students (limited to 5 DTUs)
- **Standard Tier**: ~$5-15/month
- **Premium Tier**: $465+/month

### **Cost Optimization**
1. Start with Basic tier
2. Monitor usage in Azure Portal
3. Scale up only when needed
4. Use auto-pause for development databases

## 🔄 **Migration from SQLite to Azure SQL**

If you have existing data in SQLite:

### **Export SQLite Data**
```bash
# In your local development environment
sqlite3 server/database/pos.db ".dump" > backup.sql
```

### **Import to Azure SQL**
1. Connect to Azure SQL Database
2. Run the exported SQL commands
3. Verify data integrity

## 📈 **Scaling Considerations**

### **When to Scale Up**
- High CPU usage (>80%)
- Slow query performance
- Connection pool exhaustion
- Storage approaching limits

### **Scaling Options**
1. **Scale Up**: Increase DTUs/vCores
2. **Scale Out**: Read replicas for read-heavy workloads
3. **Partitioning**: Split large tables

## 🎉 **Success Indicators**

You'll know it's working when you see:
- ✅ Database connection successful
- ✅ Schema initialized
- ✅ Sample data loaded
- ✅ Application functions normally
- ✅ Data persists across deployments

## 📞 **Support**

### **Azure SQL Issues**
- Azure Portal → Help + Support
- Microsoft Documentation
- Azure Community Forums

### **Render Issues**
- Render Dashboard → Support
- Render Documentation
- Render Community

---

**🎯 Your POS system is now running on Render with Azure SQL Database - the best of both worlds!**
