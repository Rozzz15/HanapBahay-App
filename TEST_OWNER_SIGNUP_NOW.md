# 🧪 TEST: Owner Document Upload

## ✅ Setup Complete!

All fixes have been applied:
- ✅ Code fixes applied (app.json, supabase-client.ts, supabase-storage-enhanced.ts)
- ✅ owner-documents bucket is now PUBLIC
- ⏳ Next: Restart Expo and test

---

## 🚀 Step 1: Restart Expo

**Important:** Use the `--clear` flag to load all changes!

```bash
cd C:\Users\Admin\Desktop\hanapbahay
npx expo start --clear
```

Wait for:
```
✅ Metro waiting on exp://...
```

Then scan the QR code or press `a` for Android / `i` for iOS.

---

## 🧪 Step 2: Test Owner Signup

### A. Open the App
1. Launch the app on your device/emulator
2. Click **"Sign Up"** or **"Register"**
3. Select **"Owner"** role

### B. Fill the Form
```
First Name: John
Last Name: Doe
Email: john.doe.test@example.com
Phone: +639123456789
Password: Test1234!
Confirm Password: Test1234!
House Number: 123
Street: Sample Street
Barangay: Select any (e.g., Burgos)
```

### C. Upload Documents
1. Click **"Upload Documents"** button
2. Select document type: **"Government ID"**
3. Click **"Choose Image"** or **"Take Photo"**
4. Select an image from gallery (or take a photo)
5. You should see the image preview with a checkmark ✅
6. **Repeat for other documents** (optional):
   - Business Permit
   - Barangay Clearance
   - DTI Registration
   - Proof of Ownership

### D. Submit
1. Check the **"I agree to Terms & Conditions"** checkbox
2. Click **"Create Account"** button

---

## ✅ Expected Results

### During Upload:
Watch the console/logs. You should see:
```
🔍 Supabase URL check: ✅ Found
🔍 Supabase Key check: ✅ Found
📤 Starting upload to Supabase Storage...
📊 Image URI prefix: file:///...
✅ Upload successful: owner-documents/temp_1234567890/government_id_0.jpg
✅ 1 documents uploaded to Supabase Storage
```

**NO MORE ERRORS!** ✅

### After Submit:
```
✅ Account created successfully!
✅ Owner application submitted
✅ Barangay notified
→ Redirected to Owner Dashboard
```

### In Supabase Dashboard:
1. Go to: https://supabase.com/dashboard/project/dkrctrkqhunttrnkqzsu/storage/buckets/owner-documents
2. You should see new files uploaded:
   ```
   temp_1737225600/
     └── government_id_0.jpg
     └── business_permit_0.jpg
     └── ...
   ```

---

## 🔍 What to Look For

### ✅ Success Indicators:
- No error messages during upload
- Documents show with preview before submit
- Console shows: `✅ X documents uploaded to Supabase Storage`
- Account created successfully
- Files visible in Supabase Storage bucket

### ❌ If You See Errors:

**Error: "Supabase is not configured"**
- Did you restart Expo with `--clear` flag?
- Check console logs for: `🔍 Supabase URL check: ✅ Found`
- If not found, restart Expo again

**Error: "Permission denied" or "Bucket not found"**
- Verify bucket is PUBLIC in Supabase UI
- Check bucket name is exactly `owner-documents`
- Check console for actual error message

**Error: "Upload failed after 3 attempts"**
- Check your internet connection
- Try a smaller image file
- Check console logs for detailed error
- Verify file type is allowed (jpg, png, pdf)

---

## 📊 Test Checklist

- [ ] Expo restarted with `--clear` flag
- [ ] App opened successfully
- [ ] Navigated to Sign Up → Owner
- [ ] Filled all required fields
- [ ] Uploaded at least 1 document (Government ID)
- [ ] Saw image preview with checkmark
- [ ] Clicked "Create Account"
- [ ] Console shows: `✅ X documents uploaded`
- [ ] No error messages
- [ ] Account created successfully
- [ ] Redirected to Owner Dashboard
- [ ] Files visible in Supabase Storage

---

## 🎯 What We Fixed

### Code Changes:
1. **app.json** - Added Supabase credentials to `extra` field
   ```json
   "extra": {
     "supabaseUrl": "https://dkrctrkqhunttrnkqzsu.supabase.co",
     "supabaseAnonKey": "eyJhbGci..."
   }
   ```

2. **supabase-client.ts** - Multi-source config loading
   ```typescript
   const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 
     Constants.expoConfig?.extra?.supabaseUrl
   ```

3. **supabase-storage-enhanced.ts** - Better error messages
   ```typescript
   console.log('🔍 Supabase URL check:', supabaseUrl ? '✅ Found' : '❌ Missing');
   console.log('🔍 Supabase Key check:', supabaseKey ? '✅ Found' : '❌ Missing');
   ```

### Supabase Changes:
1. **owner-documents bucket** - Made PUBLIC ✅
   - Before: Private (uploads failed)
   - After: Public (uploads work!)

---

## 📞 Report Results

After testing, let me know:
1. ✅ **SUCCESS** - Documents uploaded, account created
2. ⚠️ **PARTIAL** - Some issues but progress made
3. ❌ **FAILED** - Still getting errors (share error message)

I'll help debug if needed! 🚀

---

## 🧹 Cleanup (After Testing)

Once everything works, you can delete these temporary files:
- `tmp_rovodev_fix_bucket_public.sql`
- `tmp_rovodev_check_policies.sql`
- `tmp_rovodev_SETUP_INSTRUCTIONS.md`
- `TEST_OWNER_SIGNUP_NOW.md` (this file)

Keep these for reference:
- `FIX_OWNER_DOCUMENTS_FINAL.md`
- `OWNER_DOCUMENTS_BUCKET_FIX_SUMMARY.md`
