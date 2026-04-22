# ⚡ Quick Test Guide - Owner Document Upload

## 🚀 Step-by-Step Testing

### Step 1: Restart Expo (IMPORTANT!)
```bash
cd C:\Users\Admin\Desktop\hanapbahay
npx expo start --clear
```

**Wait for:**
```
✅ Metro waiting on exp://192.168.x.x:8081
```

### Step 2: Open App
- **Android Emulator:** Press `a`
- **iOS Simulator:** Press `i`
- **Physical Device:** Scan QR code with Expo Go

### Step 3: Navigate to Owner Signup
```
App Opens
  ↓
Click "Sign Up" or "Get Started"
  ↓
Select "Owner" (not Tenant)
```

### Step 4: Fill the Form
```
Test Data:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
First Name:     John
Last Name:      Test
Email:          john.test@example.com
Phone:          +639123456789
Password:       Test1234!
House #:        123
Street:         Test Street
Barangay:       (Select any - e.g., Burgos)
```

### Step 5: Upload Documents
```
Click "Upload Documents"
  ↓
Select Type: "Government ID"
  ↓
Click "Choose Image" or "Take Photo"
  ↓
Select any image (jpg/png)
  ↓
✅ You should see image preview
```

**Optional:** Upload more documents
- Business Permit
- Barangay Clearance
- DTI Registration

### Step 6: Submit
```
☑️ Check "I agree to Terms & Conditions"
  ↓
Click "Create Account"
  ↓
🎯 Watch the console!
```

---

## 👀 What to Look For

### ✅ SUCCESS Signs:

**In Console (Metro Bundler):**
```
🔍 Supabase URL check: ✅ Found
🔍 Supabase Key check: ✅ Found
📤 Starting upload to Supabase Storage...
📊 Image URI prefix: file:///...
✅ Upload successful: owner-documents/temp_xxxxx/government_id_0.jpg
✅ 1 documents uploaded to Supabase Storage
✅ Owner application created successfully
```

**In App:**
- Document preview appears with checkmark
- "Creating account..." loader shows
- No error alerts
- Success message appears
- Redirected to Owner Dashboard

**In Supabase Storage:**
1. Go to: https://supabase.com/dashboard/project/dkrctrkqhunttrnkqzsu/storage/buckets/owner-documents
2. Click "owner-documents" bucket
3. You should see: `temp_[timestamp]/` folder
4. Inside: Your uploaded images

---

## ❌ ERROR Scenarios

### Error: "Supabase is not configured"

**Means:** Config not loaded from app.json

**Fix:**
1. Stop Expo (Ctrl+C)
2. Run: `npx expo start --clear` (don't forget --clear!)
3. Wait for Metro to fully start
4. Try again

**Check:**
- Console should show: `🔍 Supabase URL check: ✅ Found`
- If it shows `❌ Missing`, config isn't loaded

---

### Error: "Permission denied" or "Access denied"

**Means:** Bucket might not be fully public

**Fix:**
1. Check: https://supabase.com/dashboard/project/dkrctrkqhunttrnkqzsu/storage/buckets
2. Verify "owner-documents" shows "Public" badge
3. If not, click Settings → Toggle "Public bucket" ON

---

### Error: "Failed to upload after 3 attempts"

**Means:** Network issue or file problem

**Fix:**
1. Check internet connection
2. Try a smaller image (< 5MB)
3. Make sure it's jpg/png/pdf format
4. Check console for detailed error

---

### Error: "Bucket not found"

**Means:** Bucket name mismatch

**Fix:**
1. Verify bucket name is exactly: `owner-documents` (with dash)
2. Check in Supabase Storage UI
3. If missing, run SQL script: `tmp_rovodev_fix_bucket_public.sql`

---

## 📊 Quick Debug Commands

### Check if Expo is using correct config:
Look for these in Metro bundler output when app starts:
```
EXPO_PUBLIC_SUPABASE_URL
EXPO_PUBLIC_SUPABASE_ANON_KEY
```

### Check if bucket exists:
```bash
node tmp_rovodev_check_bucket.js
```

Should show:
```
✅ owner-documents bucket exists!
   Public: ✅ YES
```

---

## 📞 Report Results

After testing, tell me:

**✅ IF IT WORKS:**
```
"✅ SUCCESS! Documents uploaded successfully!"
- How many documents uploaded?
- Account created?
- Any warnings in console?
```

**⚠️ IF PARTIAL SUCCESS:**
```
"⚠️ PARTIAL: Some issues but progress"
- What worked?
- What didn't work?
- Error messages?
```

**❌ IF IT FAILS:**
```
"❌ ERROR: Still not working"
- Copy FULL error message from console
- At what step did it fail?
- Any alerts in the app?
- Screenshot if possible
```

---

## 🎯 Expected Timeline

```
Restart Expo          → 30 seconds
App opens             → 10 seconds
Fill form             → 2 minutes
Upload document       → 30 seconds
Submit                → 5 seconds
Account created       → 3 seconds
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TOTAL: ~4 minutes
```

---

## ✅ Success Criteria

- [ ] Expo restarted with `--clear`
- [ ] Console shows: `🔍 Supabase URL check: ✅ Found`
- [ ] Document uploaded without errors
- [ ] Console shows: `✅ X documents uploaded`
- [ ] No error alerts in app
- [ ] Account created successfully
- [ ] Files visible in Supabase Storage

---

Go ahead and start testing! I'm here watching for your results! 🚀
