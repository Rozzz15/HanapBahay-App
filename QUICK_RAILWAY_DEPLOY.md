# 🚀 Quick Railway Deployment Steps

## What You Need to Do:

### 1️⃣ Go to Railway Dashboard
👉 https://railway.app/dashboard

### 2️⃣ Create New Project
- Click **"New Project"**
- Select **"Deploy from GitHub repo"**
- Choose your `hanapbahay` repository

### 3️⃣ Add Environment Variables
Click on your service → **"Variables"** tab → Add these:

```
PAYMONGO_SECRET_KEY=your_secret_key_here
PAYMONGO_PUBLIC_KEY=your_public_key_here
PORT=3000
```

⚠️ **Get your keys from:** https://dashboard.paymongo.com/settings/api-keys

Click **"Add"** after each variable!

### 4️⃣ Wait for Deployment
Railway will automatically:
- ✅ Detect `railway.json` 
- ✅ Install dependencies (`npm install` in server folder)
- ✅ Start the server (`node server.js`)

Usually takes 1-2 minutes ⏱️

### 5️⃣ Verify It Works
After deployment, test the health endpoint:

```
https://web-production-e66fb.up.railway.app/health
```

Should return:
```json
{
  "status": "ok",
  "timestamp": "...",
  "service": "HanapBahay API Server"
}
```

### 6️⃣ Test PayMongo Payment
Now go to your app:
1. Open Tenant Main Dashboard
2. Click "Make Payment"
3. Select February (₱10,000) ✅
4. Choose "PayMongo"
5. Complete payment!

---

## ⚠️ If You Get a Different Railway URL

If Railway gives you a different URL (not `web-production-e66fb.up.railway.app`):

1. Copy your new Railway URL
2. Update `Desktop/hanapbahay/.env`:
   ```
   EXPO_PUBLIC_API_URL=https://your-new-railway-url.up.railway.app
   ```
3. Restart your Expo app

---

## 📖 Need More Details?

See the full guide: `RAILWAY_DEPLOYMENT_GUIDE.md`

---

**That's it! Your backend should now be live on Railway! 🎉**
