# 🔄 Restart Your App - Card Payments Only

## ✅ Changes Applied:

I've updated your app to show **CARD PAYMENTS ONLY** for now.

### What Changed:
1. ✅ Payment intent now creates with `payment_method_allowed: ['card']`
2. ✅ GCash button - Hidden (commented out)
3. ✅ PayMaya button - Hidden (commented out)
4. ✅ Card payment button - Still visible
5. ✅ Info message added - Explains e-wallets will be available later

---

## 🔄 RESTART YOUR APP NOW:

### Step 1: Stop Expo Server
Press `Ctrl + C` in your terminal

### Step 2: Clear Cache and Restart
```bash
npm start -- --clear
```
OR
```bash
npx expo start --clear
```

### Step 3: Reload App
- Press `r` in terminal
- Or shake device → tap "Reload"

---

## 📱 What You'll See:

When you click "Make Payment" → "PayMongo":

**Before (3 options):**
- 🔵 GCash
- 🟢 PayMaya
- 💳 Credit/Debit Card

**After (1 option):**
- 💳 Credit/Debit Card
- ℹ️ Info message: "E-wallet payments (GCash/PayMaya) will be available once approved by PayMongo."

---

## ✅ Test Card Payment:

Once restarted:

1. Go to Tenant Main Dashboard
2. Click "Make Payment"
3. Select February (₱10,000)
4. Choose "PayMongo"
5. Select "Credit/Debit Card"
6. Should work! ✅

**Test Card Details:**
- Card Number: `4343434343434345`
- Expiry: Any future date (e.g., 12/25)
- CVC: Any 3 digits (e.g., 123)
- Name: Any name

---

## 🔮 To Enable E-Wallets Later:

When PayMongo approves your account for e-wallets:

1. Uncomment the GCash and PayMaya buttons in:
   `Desktop/hanapbahay/components/PayMongoPayment.tsx`
   (Lines ~489-523)

2. Update payment intent creation to include e-wallets:
   ```typescript
   payment_method_allowed: ['card', 'gcash', 'paymaya']
   ```

3. Remove the info message (or update it)

4. Test with test keys first!

---

**NOW: Restart your app and test card payment!** 💳
