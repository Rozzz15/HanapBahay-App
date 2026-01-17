# 🚀 Deploy Your Backend to Railway NOW

## ✅ Test Results:
- Railway Project ID: `9d312170-bd55-4f9d-b139-1bd7998f825c`
- Railway URL: `https://web-production-e66fb.up.railway.app`
- **Status:** ❌ Backend NOT deployed yet (404 error)

---

## 🎯 Quick Deployment Steps:

### Step 1: Open Railway Dashboard
👉 **Click here:** https://railway.app/project/9d312170-bd55-4f9d-b139-1bd7998f825c

### Step 2: Check Your Service
You should see your service. Click on it to view details.

**If you don't see a service:**
1. Click **"+ New"** 
2. Select **"GitHub Repo"**
3. Choose your `Hanapbahay` repository
4. Railway will create a new service

### Step 3: Configure Settings

Click on your service → Go to **"Settings"** tab:

**Set the Start Command:**
```
cd server && npm install && node server.js
```

**Set the Root Directory (if needed):**
- Leave it as `/` (root)
- Railway should detect the `railway.json` automatically

### Step 4: Add Environment Variables

Click on your service → Go to **"Variables"** tab

Add these variables (click **"Add"** after each):

```
PAYMONGO_SECRET_KEY=your_secret_key_here
PAYMONGO_PUBLIC_KEY=your_public_key_here
PORT=3000
```

⚠️ **IMPORTANT:** Get your PayMongo keys from:
https://dashboard.paymongo.com/settings/api-keys

### Step 5: Trigger Deployment

**Option A - Automatic (Recommended):**
- Railway should automatically deploy after you set the variables
- Wait 1-2 minutes

**Option B - Manual:**
1. Go to **"Deployments"** tab
2. Click **"Deploy"** button
3. Wait for deployment to complete

### Step 6: Monitor Deployment

Watch the deployment logs:
1. Click on the deployment (in Deployments tab)
2. View the build logs
3. Look for:
   - ✅ `npm install` completed
   - ✅ `node server.js` started
   - ✅ Server running on port 3000

**Expected log output:**
```
🚀 HanapBahay API Server running on port 3000
📍 Health check: http://localhost:3000/health
💳 Paymongo routes: http://localhost:3000/api/paymongo
```

### Step 7: Verify Deployment

After deployment completes, test the endpoints:

**Test 1 - Health Check:**
Open in browser: https://web-production-e66fb.up.railway.app/health

Expected response:
```json
{
  "status": "ok",
  "timestamp": "...",
  "service": "HanapBahay API Server"
}
```

**Test 2 - Run the checker:**
```bash
cd Desktop/hanapbahay
node check-railway-deployment.js
```

You should see ✅ for both tests!

---

## 🔧 Troubleshooting

### Issue: "Build failed"

**Check these:**
1. `server/package.json` exists and has correct dependencies
2. Start command is: `cd server && npm install && node server.js`
3. Railway logs show the actual error

**Fix:**
- Go to Settings → Check start command
- Redeploy manually

### Issue: "PAYMONGO_SECRET_KEY not set" warning

**Fix:**
1. Go to Variables tab
2. Add `PAYMONGO_SECRET_KEY` and `PAYMONGO_PUBLIC_KEY`
3. Redeploy

### Issue: "Port binding error"

**Fix:**
- Ensure `PORT=3000` is set in environment variables
- The server should bind to `0.0.0.0` (already configured in `server.js`)

### Issue: Still getting 404

**Possible causes:**
1. Deployment is still in progress (wait 2-3 minutes)
2. Deployment failed (check logs)
3. Wrong Railway URL (verify in Railway dashboard)

**Fix:**
- Check Railway dashboard for deployment status
- View logs for errors
- Try manual redeploy

---

## ✅ Success Checklist

- [ ] Railway project opened
- [ ] Service connected to GitHub repo
- [ ] Start command set: `cd server && npm install && node server.js`
- [ ] Environment variables added (PAYMONGO keys + PORT)
- [ ] Deployment triggered
- [ ] Build logs show success
- [ ] Health endpoint returns 200 OK
- [ ] PayMongo endpoint accessible
- [ ] Test with checker script passes

---

## 🎉 After Successful Deployment

Once deployment is successful:

1. **Test in your app:**
   - Open HanapBahay app
   - Go to Tenant Main Dashboard
   - Click "Make Payment"
   - Select February (₱10,000)
   - Choose "PayMongo"
   - Complete payment!

2. **Verify payment flow:**
   - Payment intent created
   - PayMongo redirects work
   - Payment completes successfully

---

## 📞 Need Help?

If you're stuck:

1. **Share the Railway deployment logs** - Copy the build/deploy logs from Railway dashboard
2. **Check Railway status** - https://status.railway.app
3. **Verify GitHub connection** - Make sure Railway has access to your repo

---

**Good luck! Your backend should be live in a few minutes! 🚀**
