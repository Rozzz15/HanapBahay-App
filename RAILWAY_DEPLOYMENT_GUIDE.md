# 🚂 Railway Backend Deployment Guide

This guide will help you deploy the HanapBahay backend server to Railway for PayMongo integration.

## 📋 Prerequisites

- Railway account (sign up at https://railway.app)
- Railway CLI installed (optional, but recommended)
- Git repository with your code

---

## 🚀 Deployment Steps

### **Method 1: Deploy via Railway Dashboard (Easiest)**

#### Step 1: Create New Project

1. Go to https://railway.app/dashboard
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose your `hanapbahay` repository
5. Railway will automatically detect your project

#### Step 2: Configure Environment Variables

In your Railway project dashboard:

1. Click on your service
2. Go to **"Variables"** tab
3. Add the following environment variables:

```
PAYMONGO_SECRET_KEY=your_secret_key_here
PAYMONGO_PUBLIC_KEY=your_public_key_here
PORT=3000
```

⚠️ **Get your keys from:** https://dashboard.paymongo.com/settings/api-keys

**Important:** Click **"Add"** after each variable!

#### Step 3: Configure Start Command

1. Go to **"Settings"** tab
2. Scroll to **"Deploy"** section
3. Set **Start Command** to:
   ```
   cd server && npm install && node server.js
   ```
4. Click **"Save"**

#### Step 4: Deploy

1. Railway will automatically deploy when you push to your repository
2. Or click **"Deploy"** button to manually trigger deployment
3. Wait for deployment to complete (usually 1-2 minutes)

#### Step 5: Get Your Railway URL

1. After deployment, you'll see your service URL (e.g., `https://web-production-xxxxx.up.railway.app`)
2. Copy this URL

#### Step 6: Update Your App's .env File

Update the `EXPO_PUBLIC_API_URL` in `Desktop/hanapbahay/.env`:

```env
EXPO_PUBLIC_API_URL=https://web-production-xxxxx.up.railway.app
```

Replace `xxxxx` with your actual Railway project ID.

---

### **Method 2: Deploy via Railway CLI**

#### Step 1: Install Railway CLI

```bash
npm install -g @railway/cli
```

#### Step 2: Login to Railway

```bash
railway login
```

#### Step 3: Initialize Railway Project

```bash
cd Desktop/hanapbahay
railway init
```

Select "Create new project" and give it a name (e.g., "hanapbahay-backend")

#### Step 4: Set Environment Variables

```bash
railway variables set PAYMONGO_SECRET_KEY=your_secret_key_here
railway variables set PAYMONGO_PUBLIC_KEY=your_public_key_here
railway variables set PORT=3000
```

#### Step 5: Deploy

```bash
railway up
```

Railway will automatically:
- Detect `railway.json` configuration
- Install dependencies in the `server/` folder
- Start the server with `node server.js`

#### Step 6: Get Your Railway URL

```bash
railway domain
```

Copy the URL and update your `.env` file.

---

## ✅ Verify Deployment

### Test Health Endpoint

Open your browser or use curl:

```bash
curl https://your-railway-url.up.railway.app/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2026-01-17T...",
  "service": "HanapBahay API Server"
}
```

### Test PayMongo Endpoint

```bash
curl https://your-railway-url.up.railway.app/api/paymongo/create-payment-intent \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"amount":10000,"description":"Test Payment","metadata":{}}'
```

If successful, you'll get a payment intent response.

---

## 🔧 Troubleshooting

### "Application not found" Error

**Cause:** Railway hasn't deployed your backend or the URL is incorrect.

**Solution:**
1. Check Railway dashboard for deployment logs
2. Ensure `railway.json` is in the root directory
3. Verify environment variables are set
4. Manually trigger a redeploy

### "PAYMONGO_SECRET_KEY not set" Warning

**Cause:** Environment variables not configured in Railway.

**Solution:**
1. Go to Railway dashboard → Variables tab
2. Add `PAYMONGO_SECRET_KEY` and `PAYMONGO_PUBLIC_KEY`
3. Redeploy the service

### Server Not Starting

**Cause:** Start command is incorrect or dependencies failed to install.

**Solution:**
1. Check Railway logs for errors
2. Verify `server/package.json` exists
3. Ensure start command is: `cd server && npm install && node server.js`

### Port Issues

**Cause:** Railway requires binding to `0.0.0.0` and using the `PORT` environment variable.

**Solution:**
- Our `server.js` already handles this correctly:
  ```javascript
  app.listen(PORT, '0.0.0.0', () => { ... });
  ```

---

## 📁 Important Files Created

I've created these files for Railway deployment:

1. **`railway.json`** - Already exists, configures Railway build and deploy
2. **`railway.toml`** - Alternative Railway configuration
3. **`Procfile`** - Backup start command for Railway
4. **`.nixpacks`** - Nixpacks configuration for Railway

Railway will automatically detect and use these configurations.

---

## 🔐 Security Notes

### Production Best Practices

1. **Never commit `.env` files** with real API keys to public repositories
2. **Use Railway's environment variables** for sensitive data
3. **Rotate keys regularly** - Get new keys from PayMongo dashboard
4. **Use different keys** for development (test keys) and production (live keys)

### Getting Your Keys

🔑 **Get your PayMongo API keys:**
1. Go to https://dashboard.paymongo.com/settings/api-keys
2. Copy your Secret Key (starts with `sk_live_` or `sk_test_`)
3. Copy your Public Key (starts with `pk_live_` or `pk_test_`)
4. Use these keys in Railway environment variables

⚠️ **IMPORTANT:** Never commit API keys to your repository!

---

## 📱 Testing After Deployment

Once deployed, test the PayMongo payment flow:

1. **Open HanapBahay App**
2. **Go to Tenant Main Dashboard**
3. **Click "Make Payment"**
4. **Select a payment** (e.g., February - ₱10,000)
5. **Choose "PayMongo"** as payment method
6. **Complete payment** with test card:
   - Card Number: `4343434343434345`
   - Expiry: Any future date
   - CVC: Any 3 digits

If everything works, you'll see the payment processing screen!

---

## 🆘 Need Help?

If you encounter issues:

1. Check Railway logs: `railway logs`
2. Verify environment variables: `railway variables`
3. Test endpoints manually with curl
4. Check PayMongo dashboard for any API issues

---

## ✅ Deployment Checklist

- [ ] Railway account created
- [ ] Project created on Railway
- [ ] Environment variables set (PAYMONGO_SECRET_KEY, PAYMONGO_PUBLIC_KEY, PORT)
- [ ] Code pushed to repository
- [ ] Deployment successful (check Railway dashboard)
- [ ] Health endpoint responding (`/health`)
- [ ] PayMongo endpoint responding (`/api/paymongo/create-payment-intent`)
- [ ] `.env` file updated with Railway URL
- [ ] App restarted to use new backend URL
- [ ] Payment tested successfully in app

---

**Good luck with your deployment! 🚀**
