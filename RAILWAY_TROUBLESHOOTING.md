# 🔧 Railway Deployment Troubleshooting

## Current Status:
- ✅ Code pushed to GitHub
- ✅ Railway configuration simplified
- ⏳ Deployment still showing 404

---

## 📊 Understanding the Warnings You Saw:

### ⚠️ These are NORMAL warnings (not errors):

1. **SecretsUsedInArgOrEnv** - Railway warning about API keys in ENV
   - **Status:** Normal - this is the correct way to use secrets in Railway
   - **Action:** None needed

2. **UndefinedVar: $NIXPACKS_PATH** - Nixpacks internal variable
   - **Status:** Normal - Nixpacks handles this automatically
   - **Action:** None needed

---

## 🔍 What to Check in Railway Dashboard:

### Go to: https://railway.app/project/9d312170-bd55-4f9d-b139-1bd7998f825c

### 1. Check if Service Exists
- Do you see a service in your project?
- If NO: You need to create a service and connect it to your GitHub repo

### 2. Check Deployment Status
Click on your service → Look for:
- **"Building"** - Deployment in progress ⏳
- **"Success"** - Deployment completed ✅
- **"Failed"** - Deployment failed ❌
- **"Crashed"** - Application started but crashed 💥

### 3. Check Deployment Logs
Click on the latest deployment → View logs:

**Look for:**
```
✓ Installing dependencies
✓ Starting application
✓ Server running on port 3000
```

**Or errors like:**
```
✗ npm install failed
✗ Module not found
✗ Port already in use
✗ Cannot find module './server.js'
```

---

## 🛠️ Common Issues & Solutions:

### Issue 1: No Service Connected
**Symptoms:** Railway project exists but no service

**Solution:**
1. In Railway dashboard, click **"+ New"**
2. Select **"GitHub Repo"**
3. Choose **"Rozzz15/Hanapbahay"**
4. Railway will create and deploy the service

---

### Issue 2: Build Failing
**Symptoms:** Logs show "Build failed" or npm errors

**Solution:**
1. Check if `server/package.json` exists in your repo
2. Verify the start command in Settings:
   ```
   cd server && npm install && node server.js
   ```
3. Check that `server/server.js` exists

---

### Issue 3: Missing Environment Variables
**Symptoms:** Logs show "PAYMONGO_SECRET_KEY not set"

**Solution:**
1. Go to **Variables** tab
2. Add these variables:
   ```
   PAYMONGO_SECRET_KEY=<your_secret_key>
   PAYMONGO_PUBLIC_KEY=<your_public_key>
   PORT=3000
   ```
3. Get keys from: https://dashboard.paymongo.com/settings/api-keys
4. Click **"Add"** after each variable
5. Railway will auto-redeploy

---

### Issue 4: Server Crashes After Starting
**Symptoms:** Logs show server started but then crashed

**Check:**
1. Database connection errors
2. Missing dependencies in `server/package.json`
3. Port binding issues

**Solution:**
- Check full deployment logs for the actual error
- Share the error message for specific help

---

### Issue 5: Wrong Start Command
**Symptoms:** Can't find `server.js` or module errors

**Solution:**
1. Go to **Settings** tab
2. Scroll to **"Deploy"** section
3. Set **Start Command** to:
   ```
   cd server && npm install && node server.js
   ```
4. Save and redeploy

---

### Issue 6: Railway URL Not Working
**Symptoms:** 404 Application not found

**Check:**
1. Is deployment complete? (not still building)
2. Is the service running? (check status in dashboard)
3. Is the URL correct? (copy from Railway dashboard)

**Solution:**
- Wait for deployment to complete (can take 2-5 minutes)
- Check deployment logs for errors
- Try accessing: `https://web-production-e66fb.up.railway.app/health`

---

## 🎯 Step-by-Step Deployment Check:

### Step 1: Verify Service Connection
```
✓ Railway project exists
✓ Service connected to GitHub repo
✓ Latest commit is visible in Railway
```

### Step 2: Verify Configuration
```
✓ Start command: cd server && npm install && node server.js
✓ Environment variables set (PAYMONGO keys + PORT)
✓ Railway.json exists in repo
```

### Step 3: Trigger Deployment
```
✓ Click "Deploy" or wait for auto-deploy
✓ Watch deployment logs
✓ Wait for "Success" status
```

### Step 4: Test Endpoints
```
✓ Health: https://web-production-e66fb.up.railway.app/health
✓ PayMongo: https://web-production-e66fb.up.railway.app/api/paymongo/create-payment-intent
```

---

## 🚨 If Nothing Works:

### Option 1: Delete and Recreate Service
1. Delete the current service in Railway
2. Create a new service
3. Connect to GitHub repo
4. Set environment variables
5. Deploy

### Option 2: Check Railway Status
- Visit: https://status.railway.app
- Check if Railway has any ongoing issues

### Option 3: Use Local Backend (Temporary)
If Railway continues to have issues, you can run the backend locally:

1. Update `.env`:
   ```
   EXPO_PUBLIC_API_URL=http://localhost:3000
   ```

2. Start backend:
   ```bash
   cd Desktop/hanapbahay/server
   npm install
   node server.js
   ```

3. Keep the terminal open while testing
4. Test PayMongo in your app

---

## 📸 Share for Help:

If you need help, share:
1. **Screenshot of Railway dashboard** - showing service status
2. **Deployment logs** - last 50 lines
3. **Environment variables** - names only (not the actual keys)
4. **Error messages** - full text from logs

---

## ✅ Success Indicators:

When deployment is successful, you'll see:
- ✅ Service status: "Active" (green)
- ✅ Health endpoint returns JSON response
- ✅ PayMongo endpoint accessible
- ✅ App can create payments

---

**Current Next Step:** Check your Railway dashboard and share what you see!
