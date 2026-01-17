# 🧪 Complete Testing Guide - Media Upload Fixes

## 🎯 What We Fixed

1. ✅ Photos/videos now upload to Supabase cloud storage (not stored as local URIs)
2. ✅ Cover photos display correctly in Owner/My Listings
3. ✅ Listings appear in Tenant Dashboard with cover photos
4. ✅ Database field conversion (snake_case ↔ camelCase) works properly

---

## 🚀 Quick Start - Run the App

### Option 1: Start Expo Development Server
```bash
cd Desktop/hanapbahay
npm start
```
Then:
- Press `a` for Android emulator
- Press `i` for iOS simulator
- Scan QR code with Expo Go app on physical device

### Option 2: Run on Specific Platform
```bash
# Android
npm run android

# iOS
npm run ios

# Web (for quick testing)
npm run web
```

---

## 📋 Manual Testing Steps

### ✅ Step 1: Verify Database Connection

Before testing in the app, run the verification script:

```bash
cd Desktop/hanapbahay
node tmp_rovodev_verify_listings.js
```

**Expected Output:**
```
🔍 Verifying Listings Database...
📊 Found X recent listings
✅ ALL GOOD
```

---

### ✅ Step 2: Test as Owner

**Login Requirements:**
- Owner account must be **approved by barangay official**
- Check `owner_applications` table: `approval_status = 'approved'`

**Testing Workflow:**

1. **Login as Owner**
   ```
   Email: [your-owner-email]
   Password: [your-password]
   ```

2. **Create New Listing**
   - Navigate to Owner Dashboard
   - Click "Create Listing" / "Add Property"
   
3. **Fill Basic Info (Step 1)**
   ```
   Property Type: House/Apartment/Room
   Rental Type: Long-term/Short-term
   Monthly Rent: e.g., 10000
   Address: Full address
   Barangay: Select from dropdown
   Rooms: e.g., 2
   Bathrooms: e.g., 1
   ```

4. **Add Media (Step 2)** 🎯 **CRITICAL TEST**
   - Click "Add Cover Photo"
   - Select an image
   - **Watch console for:**
     ```
     📤 Uploading media to cloud storage...
     📤 Uploading cover photo to Supabase storage...
     ✅ Cover photo uploaded: https://...
     ✅ Media uploaded successfully: { photos: 0, videos: 0, hasCoverPhoto: true }
     ```
   
   - Click "Add Photos" (add 2-3 property photos)
   - **Watch console for:**
     ```
     📤 Uploading photo to Supabase storage...
     ✅ Photo uploaded: https://...
     ```

5. **Complete Listing (Steps 3-4)**
   - Add amenities (WiFi, Parking, Kitchen, etc.)
   - Add house rules
   - Fill owner contact info
   - Click "Submit"

6. **Verify Success**
   - ✅ Success alert appears
   - **Console shows:**
     ```
     ✅ Listing saved and verified successfully
     ✅ Media saved in published_listings
     ```

7. **Check "My Listings"**
   - Navigate to Owner → My Listings
   - **Expected:** ✅ Cover photo displays (not "No Photo" placeholder)
   - Click listing to view details
   - **Expected:** ✅ All photos display in gallery

---

### ✅ Step 3: Test as Tenant

1. **Logout and Login as Tenant**
   ```
   OR
   Use a different device/browser
   ```

2. **View Main Dashboard**
   - Navigate to Tenant Dashboard (Home screen)
   - **Watch console for:**
     ```
     📋 Found published listings: X
     ✅ ACCEPTED: Listing [id] will show
     📸 Using database media for listing
     Has Cover Photo: ✅ YES
     ```

3. **Verify Listing Displays**
   - **Expected:** ✅ Your new listing appears in the list
   - **Expected:** ✅ Cover photo is visible
   - **Expected:** ✅ Property details are correct

4. **Click on Listing**
   - Click the listing card
   - Navigate to listing details
   - **Expected:** ✅ All photos display in gallery
   - **Expected:** ✅ Cover photo shows at top
   - **Expected:** ✅ Videos play (if uploaded)

---

## 🔍 What to Look For

### ✅ Success Indicators

**In Owner/My Listings:**
- Cover photo displays immediately
- No "No Photo" placeholder
- Image loads without errors

**In Tenant Dashboard:**
- Listing appears in the list
- Cover photo displays
- Image URL starts with `https://` (not `file://`)

**In Console:**
```
✅ Media uploaded successfully
✅ Photo uploaded: https://...
✅ Image loaded for listing: [id]
📸 Using database media for listing
Has Cover Photo: ✅ YES
```

### ❌ Failure Indicators

**Visual Issues:**
- "No Photo" placeholder shows
- Broken image icon
- Image appears then disappears

**Console Errors:**
```
❌ Image load error for listing
❌ Failed to upload photo
⚠️ No media found
undefined for coverPhoto field
```

**Database Issues:**
- coverPhoto field is `null` or `undefined`
- Photos array is empty
- URLs start with `file://` instead of `https://`

---

## 🐛 Troubleshooting

### Issue: Cover Photo Not Uploading

**Symptoms:**
- "No Photo" shows in My Listings
- Console shows upload errors

**Solutions:**
1. Check Supabase connection:
   ```javascript
   // In app, check console for:
   "☁️ Upserting to cloud: published_listings"
   "✅ Successfully upserted"
   ```

2. Check Supabase storage bucket exists:
   - Bucket name: `property-images`
   - Make sure it's created and public

3. Check file permissions:
   - iOS: Check `Info.plist` for photo library permissions
   - Android: Check `AndroidManifest.xml` for storage permissions

### Issue: Listing Not Appearing in Dashboard

**Symptoms:**
- Listing created successfully
- Shows in My Listings
- Doesn't show in Tenant Dashboard

**Solutions:**
1. Check listing status:
   ```sql
   SELECT id, status FROM published_listings WHERE id = 'your-listing-id';
   ```
   - Must be exactly `'published'` (lowercase)

2. Check console filtering:
   ```
   ⚠️ REJECTED: Status is "Published" not "published"
   ```
   - Status must be lowercase

3. Check barangay field:
   - Must not be null or empty
   - Should match dropdown values

### Issue: Images Show Then Disappear

**Symptoms:**
- Image briefly displays
- Then shows broken image icon

**Cause:** Using local URI instead of cloud URL

**Solution:**
- Check that `savePropertyMedia` is called before saving listing
- Verify URLs in database start with `https://`

---

## 📊 Test Results Checklist

After testing, verify all these pass:

- [ ] ✅ Cover photo uploads successfully
- [ ] ✅ Property photos upload successfully  
- [ ] ✅ Console shows `https://` URLs (not `file://`)
- [ ] ✅ Cover photo displays in Owner/My Listings
- [ ] ✅ All photos display in listing details
- [ ] ✅ Listing appears in Tenant Dashboard
- [ ] ✅ Cover photo displays in Tenant Dashboard
- [ ] ✅ Search/filter shows listing with cover photo
- [ ] ✅ No console errors about images
- [ ] ✅ Database `cover_photo` field has URL

---

## 🎯 Key Files Changed

Review these files for the fixes:

1. **app/(owner)/create-listing.tsx** (Lines 564-579)
   - Added media upload before saving listing
   
2. **utils/media-storage.ts** (Lines 145-212)
   - Changed return type to return uploaded URLs
   - Added Supabase storage upload logic

3. **utils/media-storage.ts** (Line 289)
   - Read both `cover_photo` and `coverPhoto` fields

4. **app/(tabs)/index.tsx** (Line 669)
   - Changed from direct Supabase call to `db.list()`
   - Ensures camelCase field conversion

---

## 📞 Support

If you encounter issues:

1. **Check Console Logs**
   - Look for error messages
   - Check for upload confirmations

2. **Check Database**
   - Run `tmp_rovodev_verify_listings.js`
   - Verify cover_photo has URL

3. **Review Changes**
   - Check the 4 key files listed above
   - Ensure all fixes are applied

---

## ✅ Final Verification

Run this command to verify everything:

```bash
# Check listings in database
node tmp_rovodev_verify_listings.js

# Start the app
npm start

# Then test manually following the steps above
```

**Expected Final State:**
- All new listings have cloud URLs for images
- Cover photos display everywhere
- No broken images or "No Photo" placeholders
- Console shows successful uploads

---

## 🎉 Success!

If all tests pass:
- ✅ The fix is working correctly
- ✅ Ready for production
- ✅ Can build and deploy

Next steps:
1. Build production APK/IPA
2. Test on physical devices
3. Deploy to users
