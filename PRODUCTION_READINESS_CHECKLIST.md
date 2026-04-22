# 🚀 Production Readiness Checklist

## Current Status: ⚠️ **NOT PRODUCTION-READY YET**

Your app has critical security issues that MUST be fixed before going to production.

---

## 🔴 CRITICAL ISSUES (MUST FIX)

### 1. ⚠️⚠️⚠️ API Keys Security - **URGENT**

**Problem:** PayMongo LIVE keys were exposed in:
- Git commit history (visible locally)
- This chat conversation
- Potentially in Railway logs

**Impact:** Anyone with these keys can:
- Process payments on your behalf
- Access your PayMongo account
- Steal money from your customers

**IMMEDIATE ACTION REQUIRED:**

1. **Rotate PayMongo Keys NOW:**
   ```
   Go to: https://dashboard.paymongo.com/settings/api-keys
   
   Steps:
   1. Delete current live keys
   2. Generate new live keys
   3. Copy the NEW keys
   4. Update Railway environment variables
   5. NEVER share these keys again
   ```

2. **Update Railway Variables:**
   ```
   Go to: https://railway.app/project/9d312170-bd55-4f9d-b139-1bd7998f825c
   
   Variables tab:
   - Delete old PAYMONGO_SECRET_KEY
   - Delete old PAYMONGO_PUBLIC_KEY
   - Add NEW keys
   - Save and redeploy
   ```

3. **Verify No Keys in Code:**
   - ✅ Already done - no keys hardcoded in your code
   - ✅ Keys are only in Railway environment variables
   - ⚠️ But old keys are in Git history

---

### 2. 🔐 Use Test Keys for Development

**Current:** You're using LIVE keys everywhere

**Problem:** 
- Testing with live keys can process real payments
- Mistakes in testing = real money lost
- Can't test refunds, failures, etc. safely

**Solution:**

Create two Railway services:

**A. Development/Staging (Use Test Keys)**
```
Service: hanapbahay-staging
URL: https://hanapbahay-staging.up.railway.app
Environment:
  PAYMONGO_SECRET_KEY=sk_test_XXXXXXX (test key)
  PAYMONGO_PUBLIC_KEY=pk_test_XXXXXXX (test key)
  NODE_ENV=development
```

**B. Production (Use Live Keys)**
```
Service: hanapbahay-production
URL: https://hanapbahay-production.up.railway.app
Environment:
  PAYMONGO_SECRET_KEY=sk_live_XXXXXXX (NEW live key)
  PAYMONGO_PUBLIC_KEY=pk_live_XXXXXXX (NEW live key)
  NODE_ENV=production
```

**In your app:**
```env
# Development
EXPO_PUBLIC_API_URL=https://hanapbahay-staging.up.railway.app

# Production
EXPO_PUBLIC_API_URL=https://hanapbahay-production.up.railway.app
```

---

### 3. 🗄️ Database Backup & Recovery

**Current:** Using Supabase cloud database ✅

**Missing:**
- [ ] Automated backups configured
- [ ] Backup restoration tested
- [ ] Disaster recovery plan

**Action Required:**

1. **Enable Supabase Backups:**
   ```
   Go to: Supabase Dashboard → Project Settings → Backups
   
   Configure:
   - Enable daily backups
   - Retention: 7 days minimum
   - Test restore procedure
   ```

2. **Document Recovery Process:**
   - How to restore from backup
   - Who has access
   - Emergency contact information

---

### 4. 📊 Monitoring & Logging

**Current:** Basic console.log statements

**Missing:**
- [ ] Error tracking (e.g., Sentry)
- [ ] Performance monitoring
- [ ] Payment transaction logging
- [ ] Audit trail for critical operations

**Recommended:**

1. **Add Sentry for Error Tracking:**
   ```bash
   npm install @sentry/node
   ```
   
   Configure in `server.js`:
   ```javascript
   const Sentry = require('@sentry/node');
   
   Sentry.init({
     dsn: process.env.SENTRY_DSN,
     environment: process.env.NODE_ENV || 'production'
   });
   ```

2. **Log All Payment Transactions:**
   - Payment intent created
   - Payment method attached
   - Payment confirmed
   - Payment success/failure
   - Store in database, not just console

3. **Railway Logs:**
   - Already available in Railway dashboard
   - But limited retention (7 days on free plan)

---

### 5. 🔒 Security Headers & CORS

**Current:** Basic CORS enabled for all origins

**Issues:**
```javascript
// server.js - line 23
app.use(cors()); // ⚠️ Allows ALL origins!
```

**Production Fix:**

```javascript
// Configure CORS properly
const allowedOrigins = [
  'https://yourdomain.com',
  'hanapbahay://', // Your app's deep link
  process.env.NODE_ENV === 'development' ? 'http://localhost:8081' : null
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Add security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});
```

---

### 6. 💳 Payment Webhook Verification

**Current:** Webhook signature verification commented out

**Issue:**
```javascript
// paymongo-routes.js - line 407-420
// TODO: Implement webhook signature verification
// This prevents unauthorized webhook calls
```

**Production Fix:**

```javascript
router.post('/webhook', async (req, res) => {
  try {
    const signature = req.headers['paymongo-signature'];
    const webhookSecret = process.env.PAYMONGO_WEBHOOK_SECRET;
    
    // CRITICAL: Verify signature
    const computedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(JSON.stringify(req.body))
      .digest('hex');
    
    if (signature !== computedSignature) {
      console.error('⚠️ Invalid webhook signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }
    
    // Process webhook...
  }
});
```

**Setup Webhook:**
1. Go to PayMongo Dashboard → Webhooks
2. Create webhook: `https://v-production-6704.up.railway.app/api/paymongo/webhook`
3. Copy webhook secret
4. Add to Railway: `PAYMONGO_WEBHOOK_SECRET=whsec_XXXXX`

---

### 7. 🧪 Testing Coverage

**Current:** No automated tests

**Missing:**
- [ ] Unit tests for payment logic
- [ ] Integration tests for API endpoints
- [ ] End-to-end tests for payment flow

**Recommended:**

Create test files:
```
server/
  __tests__/
    payment-logic.test.js
    api-routes.test.js
```

---

### 8. 📈 Rate Limiting

**Current:** No rate limiting

**Issue:** API can be abused with unlimited requests

**Production Fix:**

```bash
npm install express-rate-limit
```

```javascript
const rateLimit = require('express-rate-limit');

// Limit payment intent creation
const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per IP
  message: 'Too many payment requests, please try again later'
});

router.post('/create-payment-intent', paymentLimiter, async (req, res) => {
  // ...
});
```

---

### 9. 💰 Payment Amount Validation

**Current:** Basic validation

**Add Production Checks:**

```javascript
router.post('/create-payment-intent', async (req, res) => {
  const { amount } = req.body;
  
  // Validate amount
  if (!amount || amount < 10000) { // Min ₱100.00
    return res.status(400).json({
      error: 'Invalid amount: minimum ₱100.00'
    });
  }
  
  if (amount > 10000000) { // Max ₱100,000.00
    return res.status(400).json({
      error: 'Invalid amount: maximum ₱100,000.00'
    });
  }
  
  // Amount must be integer (centavos)
  if (!Number.isInteger(amount)) {
    return res.status(400).json({
      error: 'Amount must be an integer (in centavos)'
    });
  }
  
  // Continue with payment...
});
```

---

### 10. 🔄 Graceful Shutdown

**Current:** Server stops immediately on SIGTERM

**Production Fix:**

```javascript
// At end of server.js
let server;

function startServer() {
  server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    // Close database connections, etc.
    process.exit(0);
  });
});

startServer();
```

---

## ✅ WHAT'S ALREADY GOOD

### Infrastructure
- ✅ Railway deployment configured
- ✅ Environment variables used (not hardcoded)
- ✅ Health check endpoint
- ✅ Auto-restart on failure
- ✅ HTTPS enabled by Railway
- ✅ Cloud database (Supabase)

### Code Quality
- ✅ Bug fixes completed (complaints, payments)
- ✅ Payment calculation logic correct
- ✅ No duplicate payment issues
- ✅ Error handling in place

### Security Basics
- ✅ No API keys in code
- ✅ Using environment variables
- ✅ HTTPS enforced

---

## 📋 PRODUCTION DEPLOYMENT CHECKLIST

### Before Launch:

- [ ] **CRITICAL:** Rotate PayMongo keys (delete old, generate new)
- [ ] **CRITICAL:** Update Railway with NEW keys
- [ ] **CRITICAL:** Implement webhook signature verification
- [ ] Set up separate staging and production environments
- [ ] Configure proper CORS settings
- [ ] Add rate limiting to API endpoints
- [ ] Set up error tracking (Sentry)
- [ ] Configure Supabase backups
- [ ] Test disaster recovery procedure
- [ ] Document all API endpoints
- [ ] Create user documentation
- [ ] Test payment flow with test keys thoroughly
- [ ] Test payment flow with live keys (small amounts)
- [ ] Set up monitoring alerts
- [ ] Configure payment amount validation
- [ ] Implement graceful shutdown
- [ ] Review and secure all environment variables

### After Launch:

- [ ] Monitor error rates daily
- [ ] Check payment success rates
- [ ] Review logs for suspicious activity
- [ ] Monitor Railway resource usage
- [ ] Set up uptime monitoring (e.g., UptimeRobot)
- [ ] Regular security audits
- [ ] Keep dependencies updated
- [ ] Test backup restoration monthly

---

## 🚨 EMERGENCY PROCEDURES

### If API Keys Compromised:
1. Immediately disable keys in PayMongo dashboard
2. Generate new keys
3. Update Railway variables
4. Force redeploy
5. Check for unauthorized transactions
6. Contact PayMongo support

### If Payment Issues:
1. Check Railway logs
2. Check Supabase database
3. Verify PayMongo dashboard
4. Contact customer if payment succeeded but not reflected
5. Never double-charge - verify first!

### If Server Down:
1. Check Railway deployment status
2. Check logs for errors
3. Verify environment variables
4. Manual redeploy if needed
5. Check Supabase connection

---

## 📞 SUPPORT CONTACTS

- **PayMongo Support:** support@paymongo.com
- **Railway Support:** https://railway.app/help
- **Supabase Support:** https://supabase.com/support

---

## ⏱️ TIMELINE TO PRODUCTION

**Minimum 1-2 weeks needed to make production-ready:**

**Week 1:**
- Day 1-2: Rotate keys, set up staging environment
- Day 3-4: Implement security fixes (CORS, rate limiting, webhook verification)
- Day 5-7: Testing with test keys, fix bugs

**Week 2:**
- Day 1-2: Set up monitoring and backups
- Day 3-4: Documentation and testing
- Day 5: Final security audit
- Day 6-7: Go live with careful monitoring

---

## 💡 RECOMMENDATION

**Current Status:** Your backend works but has critical security issues.

**Next Steps:**
1. **TODAY:** Rotate PayMongo keys immediately
2. **THIS WEEK:** Set up staging environment with test keys
3. **NEXT WEEK:** Implement security fixes
4. **WEEK 3:** Testing and monitoring setup
5. **WEEK 4:** Production launch

**Do NOT** launch to real users until:
- ✅ New PayMongo keys are in place
- ✅ Webhook verification is implemented
- ✅ Staging environment is working
- ✅ Monitoring is set up

---

## ✅ CURRENT WORKING STATUS

**For Testing/Development:** ✅ **YES, it works!**
- Backend is deployed
- Payments can be processed
- All bug fixes are applied

**For Production:** ❌ **NO, not yet!**
- Critical security issues must be fixed first
- Need proper monitoring and backups
- Need staging environment for testing

---

**Would you like me to help you implement any of these production fixes?**
