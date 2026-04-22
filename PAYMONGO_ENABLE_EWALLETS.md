# 💳 How to Enable GCash and PayMaya on PayMongo

## 🔍 The Truth About E-Wallet Payments:

You're right - there's **NO toggle button** to enable e-wallets in PayMongo dashboard!

Here's what's actually happening:

---

## 📋 **PayMongo E-Wallet Requirements:**

### **Option 1: Automatic Approval (Best Case)**

**For Business Accounts:**
E-wallets are **automatically enabled** when you:
1. ✅ Complete business verification
2. ✅ Submit required documents
3. ✅ Get approved by PayMongo

**Check your account status:**
1. Go to: https://dashboard.paymongo.com/settings/business-profile
2. Look for verification status
3. If "Verified" → E-wallets should already be available

---

### **Option 2: Contact PayMongo Support**

If e-wallets are not working even after verification:

**Email PayMongo:**
```
To: support@paymongo.com
Subject: Request to Enable E-Wallet Payments (GCash and PayMaya)

Dear PayMongo Support,

I would like to request the enablement of e-wallet payment methods 
(GCash and PayMaya) for my account.

Account Details:
- Email: [your email]
- Business Name: [your business name]
- Merchant ID: [if available]

I have completed business verification and would like to offer 
e-wallet payments to my customers.

Please let me know if you need any additional information.

Thank you!
```

**Response time:** Usually 1-2 business days

---

### **Option 3: Check Your Account Type**

E-wallets are available for **specific account types only**:

**✅ Business Accounts:**
- Full business registration
- Business permit
- DTI/SEC registration
- Bank account verification
- **E-wallets available**

**❌ Personal/Starter Accounts:**
- Individual registration
- Basic KYC only
- **E-wallets NOT available**

**Check your account type:**
1. Go to: https://dashboard.paymongo.com/settings
2. Look for "Account Type" or "Business Profile"
3. If you see "Starter" or "Personal" → Upgrade required

---

## 🧪 **For Testing: Use Test Keys**

Good news! You can **test e-wallets without approval** using test keys:

### **Step 1: Get Test Keys**
1. Go to: https://dashboard.paymongo.com/settings/api-keys
2. Find **"Test Keys"** section
3. Copy:
   - Secret Key: `sk_test_XXXXX`
   - Public Key: `pk_test_XXXXX`

### **Step 2: Use Test Keys in Development**
Update your Railway environment or `.env.local`:
```env
PAYMONGO_SECRET_KEY=sk_test_XXXXX
PAYMONGO_PUBLIC_KEY=pk_test_XXXXX
```

### **Step 3: Test E-Wallet Payments**
With test keys:
- ✅ GCash works in test mode
- ✅ PayMaya works in test mode
- ✅ Card works in test mode
- ❌ NO real money is charged
- ✅ Can test full payment flow

### **Step 4: Test Payment Details**
When testing with test keys, use:
- **GCash:** Any mobile number
- **PayMaya:** Any email
- **Card:** `4343434343434345` (test card)

---

## 🔍 **How to Verify E-Wallets Are Available:**

### **Method 1: API Test**

Run this in your terminal:
```bash
curl https://v-production-6704.up.railway.app/api/paymongo/create-payment-intent \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 10000,
    "description": "Test",
    "metadata": {}
  }'
```

**Check the response:**
```json
{
  "data": {
    "attributes": {
      "payment_method_allowed": ["card", "gcash", "paymaya"]
    }
  }
}
```

If you see `["card"]` only → E-wallets not enabled
If you see `["card", "gcash", "paymaya"]` → E-wallets enabled ✅

### **Method 2: Try Creating Payment**

In your app:
1. Create a payment intent
2. Check the error message
3. If error says "gcash not allowed" → Not enabled
4. If it works → Enabled ✅

---

## 📧 **What Actually Determines E-Wallet Availability:**

PayMongo enables e-wallets based on:

1. **Account Type**
   - Business account required
   - Not available for personal accounts

2. **Business Verification Status**
   - Complete KYC
   - Business documents submitted
   - Bank account verified

3. **PayMongo's Internal Approval**
   - They review your business
   - Check compliance
   - Approve/reject e-wallet access

4. **API Keys Used**
   - Test keys: E-wallets always available (test mode)
   - Live keys: E-wallets only if approved

---

## 💡 **Most Likely Scenario:**

Based on your error, one of these is true:

### **Scenario A: Using Live Keys Without Approval**
- ✅ Account exists
- ✅ Live API keys work
- ❌ E-wallet not approved yet
- **Solution:** Contact PayMongo support OR use test keys for now

### **Scenario B: Personal/Starter Account**
- ✅ Account exists
- ❌ Not a business account
- ❌ E-wallets not available
- **Solution:** Upgrade to business account

### **Scenario C: Business Under Review**
- ✅ Business account created
- ⏳ Documents under review
- ❌ E-wallet pending approval
- **Solution:** Wait for approval OR use test keys

---

## 🎯 **Immediate Action Plan:**

### **For Production (Live Payments):**

1. **Check Account Type:**
   - Dashboard → Settings → Business Profile
   - Verify it's a "Business" account

2. **Contact PayMongo:**
   ```
   Email: support@paymongo.com
   Request: Enable e-wallet payments
   Include: Account email, business name
   ```

3. **Wait for Response:**
   - Usually 1-2 business days
   - They'll tell you what's needed

### **For Testing (Right Now):**

1. **Switch to Test Keys:**
   - Get from PayMongo dashboard
   - Update Railway environment variables
   - E-wallets will work in test mode

2. **Uncomment E-Wallet Buttons:**
   - In `PayMongoPayment.tsx`
   - Uncomment GCash and PayMaya buttons
   - Change `payment_method_allowed` to `['card', 'gcash', 'paymaya']`

3. **Test Full Flow:**
   - Test with test payment methods
   - Verify everything works
   - Switch back to live keys when approved

---

## 📞 **PayMongo Contact Information:**

**Email Support:**
- support@paymongo.com
- Response time: 1-2 business days

**Dashboard Chat:**
- https://dashboard.paymongo.com
- Click chat icon in bottom right
- Live chat during business hours

**Documentation:**
- https://developers.paymongo.com
- Check for e-wallet requirements

---

## ✅ **Quick Decision Guide:**

**Need to test NOW?**
→ Use test keys (e-wallets work in test mode)

**Need for production?**
→ Contact PayMongo support + wait for approval

**Don't need e-wallets yet?**
→ Keep card payments only (current setup)

---

## 🔮 **When E-Wallets Are Approved:**

You'll know when they're ready:
1. ✅ PayMongo sends confirmation email
2. ✅ API test shows `["card", "gcash", "paymaya"]`
3. ✅ No more "not allowed" errors

Then:
1. Uncomment e-wallet buttons in your app
2. Update `payment_method_allowed` array
3. Test with small real payment
4. Go live!

---

**Recommendation: Email PayMongo support now to ask about e-wallet enablement for your account!**

Would you like me to help you set up test keys so you can test e-wallets right now?
