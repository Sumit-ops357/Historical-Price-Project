# 🚀 Deploy Historical Token Price Oracle on Render

## 📋 **Prerequisites**
- GitHub repository with your project
- Render account (free tier available)
- MongoDB Atlas database (already configured)
- Redis Cloud (already configured)

## 🔧 **Step 1: Backend Deployment**

### **1.1 Create Web Service**
1. Go to [render.com](https://render.com)
2. Sign up/Login with GitHub
3. Click "New +" → "Web Service"
4. Connect your GitHub repository

### **1.2 Configure Backend Service**
```
Name: price-oracle-backend
Environment: Node
Region: Choose closest to you
Branch: main
Root Directory: backend
Build Command: npm install
Start Command: npm start
```

### **1.3 Set Environment Variables**
Click "Environment" tab and add:

```env
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb+srv://sumitrathod22724:HVJqT0cmZUsIgdXu@cluster0.1bhqcmt.mongodb.net/price-oracle
REDIS_HOST=redis-15494.c9.us-east-1-2.ec2.cloud.redislabs.com
REDIS_PORT=15494
REDIS_PASSWORD=o3Ph6MpXftJ7BIRbtsIMIDI5uFEsdevm
ALCHEMY_API_KEY=your_alchemy_api_key_here
ALCHEMY_NETWORK=eth-mainnet
```

### **1.4 Deploy Backend**
- Click "Create Web Service"
- Wait for build to complete
- Note the URL: `https://your-backend-name.onrender.com`

## 🎨 **Step 2: Frontend Deployment**

### **2.1 Create Static Site**
1. Click "New +" → "Static Site"
2. Connect the same repository

### **2.2 Configure Frontend**
```
Name: price-oracle-frontend
Environment: Static Site
Build Command: cd frontend && npm install && npm run build
Publish Directory: frontend/.next
```

### **2.3 Set Environment Variables**
```env
NEXT_PUBLIC_API_URL=https://your-backend-name.onrender.com
```

### **2.4 Deploy Frontend**
- Click "Create Static Site"
- Wait for build to complete
- Note the URL: `https://your-frontend-name.onrender.com`

## 🔗 **Step 3: Update API URLs**

### **3.1 Update Frontend Environment**
After backend deploys, update the frontend environment variable:
```env
NEXT_PUBLIC_API_URL=https://your-actual-backend-url.onrender.com
```

### **3.2 Redeploy Frontend**
- Go to your frontend service on Render
- Click "Manual Deploy" → "Deploy latest commit"

## ✅ **Step 4: Test Deployment**

### **4.1 Test Backend API**
```bash
# Test health endpoint
curl https://your-backend-name.onrender.com/health

# Test price endpoint
curl "https://your-backend-name.onrender.com/api/price-oracle/price?token=0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48&network=ethereum&timestamp=1577836800"
```

### **4.2 Test Frontend**
- Visit your frontend URL
- Try price lookup functionality
- Test schedule history feature

## 🎯 **Expected URLs**

After deployment, you'll have:
- **Backend**: `https://price-oracle-backend.onrender.com`
- **Frontend**: `https://price-oracle-frontend.onrender.com`
- **API Health**: `https://price-oracle-backend.onrender.com/health`

## 🔧 **Troubleshooting**

### **Common Issues:**

1. **Build Fails**
   - Check Node.js version (use 18+)
   - Verify all dependencies in package.json

2. **Environment Variables**
   - Ensure all variables are set correctly
   - Check for typos in URLs

3. **CORS Issues**
   - Backend should allow all origins in production
   - Frontend should use correct API URL

4. **Database Connection**
   - Verify MongoDB Atlas connection string
   - Check network access settings

## 🚀 **Quick Deploy with render.yaml**

If you have the `render.yaml` file in your repository:

1. Go to Render Dashboard
2. Click "New +" → "Blueprint"
3. Connect your repository
4. Render will automatically create both services

## 📊 **Monitoring**

- **Logs**: View real-time logs in Render dashboard
- **Metrics**: Monitor performance and errors
- **Uptime**: Check service health status

## 💰 **Costs**

- **Free Tier**: 750 hours/month per service
- **Paid Plans**: Start at $7/month for more resources

## 🎉 **Success!**

Your Historical Token Price Oracle is now live on Render with:
- ✅ Scalable backend API
- ✅ Fast frontend interface
- ✅ Persistent MongoDB storage
- ✅ Redis caching
- ✅ Automatic deployments

**Visit your frontend URL and start using the price oracle!** 🚀 