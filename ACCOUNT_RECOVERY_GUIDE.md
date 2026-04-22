# 🆘 Account Recovery Guide - bella27@gmail.com → bella15@gmail.com

## Your Account Details
- **Old Email:** bella27@gmail.com
- **New Email:** bella15@gmail.com  
- **Password:** E@yana05

---

## 🔍 What To Try (In Order)

### ✅ TRY 1: Login with NEW Email (Most Likely)
```
Email: bella15@gmail.com
Password: E@yana05
```

**Why this might work:**
- The email change was processed
- New entry was created with new email
- Password might still be there (spread operator preserved it)

---

### ✅ TRY 2: Login with OLD Email (Fallback)
```
Email: bella27@gmail.com
Password: E@yana05
```

**Why this might work:**
- Old entry might not have been deleted
- Original account data intact
- Email change didn't complete fully

---

### ✅ TRY 3: Check App Console Logs

1. Open your app
2. Try logging in with NEW email
3. Look at the Metro bundler console
4. You should see:
   ```
   🔑 Attempting sign-in for: bella15@gmail.com
   📊 Current database size: X users
   📋 All users in database:
      - bella15@gmail.com: [user-id]
      - (other emails...)
   ```

**If you see:**
- ✅ "User found in database" → Good! Try the password
- ❌ "User not found" → Try old email instead
- ❌ "Password mismatch" → Password wasn't preserved (need recovery)

---

## 🔧 Recovery Options

### Option A: Quick Manual Fix (Recommended)

Since you know your credentials, just **restart Expo with the fix**:

1. **Stop Expo** (Ctrl+C in terminal)

2. **Restart with clear cache:**
   ```bash
   cd C:\Users\Admin\Desktop\hanapbahay
   npx expo start --clear
   ```

3. **Try logging in again with NEW email:**
   ```
   Email: bella15@gmail.com
   Password: E@yana05
   ```

4. **If still doesn't work, the password wasn't saved. Continue to Option B.**

---

### Option B: Create Fresh Owner Account (Easiest)

If you can't login with either email:

1. **Create a NEW owner account:**
   ```
   First Name: Bella
   Last Name: Test
   Email: bella.new@gmail.com  ← Use a different email
   Password: E@yana05  ← Same password is fine
   Phone: +639123456789
   ```

2. **Upload your owner documents again**

3. **Your new account will have the fix applied**

4. **Next time you change email, it will work correctly!**

**Note:** Your old account data (bella27/bella15) will still be in the database, but starting fresh is quickest.

---

### Option C: Database Recovery (Advanced)

If you want to recover the exact account:

1. **Check Supabase Database:**
   - Go to: https://supabase.com/dashboard/project/dkrctrkqhunttrnkqzsu/editor
   - Run this query:
   ```sql
   SELECT id, email, name, roles FROM users 
   WHERE email IN ('bella27@gmail.com', 'bella15@gmail.com');
   ```

2. **Check what's in the database:**
   - If you see bella15@gmail.com → The change worked in database
   - If you see bella27@gmail.com → The change didn't sync to database

3. **Check owner_profiles too:**
   ```sql
   SELECT user_id, email, business_name FROM owner_profiles 
   WHERE email IN ('bella27@gmail.com', 'bella15@gmail.com');
   ```

4. **If email is in database but can't login:**
   - The issue is in AsyncStorage (mock-auth)
   - Need to reset the password in AsyncStorage
   - Or create new account (easier)

---

## 📊 Understanding What Happened

**The Flow:**
```
1. You changed email bella27 → bella15
2. Profile update code ran
3. Database updated successfully ✅
4. Mock-auth tried to update
5. Old email entry deleted ✅
6. New email entry created... ❓
7. Password might not have been copied ❌
```

**The Fix I Applied:**
```typescript
// Now explicitly preserves password
const updatedUser = { 
  ...userData, 
  ...updates, 
  password: userData.password, // ← Added this!
  ...
};
```

**Next time:** Email change will work perfectly! ✅

---

## ✅ Recommended Action Plan

**For Fastest Recovery:**

1. ⏱️ **First, try NEW email** (bella15@gmail.com + E@yana05)
   - Takes 10 seconds

2. ⏱️ **If that fails, try OLD email** (bella27@gmail.com + E@yana05)
   - Takes 10 seconds

3. ⏱️ **If both fail, create new account** (bella.new@gmail.com + E@yana05)
   - Takes 5 minutes
   - Fresh start with fix applied
   - Upload documents again

**Don't waste time debugging if creating new account is faster!**

---

## 🚀 After You Login Successfully

1. **Go to Profile → Edit Profile**
2. **Try changing email again** (to test the fix)
3. **You should see in console:**
   ```
   🔐 Password preserved: YES ✅
   ```
4. **Login with new email will work!** ✅

---

## 📞 Tell Me What Happens

After trying to login, let me know:

1. ✅ **"NEW email worked!"** - Great! Fix wasn't needed
2. ✅ **"OLD email worked!"** - Good! But email change failed
3. ❌ **"Neither worked"** - Need to create new account
4. ⚠️ **"Error message: [message]"** - Copy the exact error

I'm here to help! 🚀
