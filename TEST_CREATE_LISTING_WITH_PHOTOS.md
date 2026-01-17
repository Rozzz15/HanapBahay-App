# 🧪 Test Guide: Create New Listing with Photos

## Overview
This guide will help you test the complete flow of creating a property listing with photos to verify cloud storage is working.

---

## 📋 Pre-Test Checklist

Before starting, verify:
- ✅ Storage buckets created (DONE - you have 7 buckets)
- ✅ Files already uploaded (DONE - 6 images exist)
- ✅ App is installed and running
- ✅ You have an owner account (or can create one)

---

## 🎯 Test Procedure

### **Step 1: Launch the App**

```bash
cd Desktop/hanapbahay
npm start
# or
npx expo start
```

Choose your platform:
- Press `a` for Android emulator
- Press `i` for iOS simulator
- Scan QR code for physical device

---

### **Step 2: Log In as Owner**

1. Open the app
2. If not logged in, click **"Sign Up"** or **"Log In"**
3. Use an owner account or create a new one:
   - Role: **Owner** (property owner)
   - Fill in required details
   - Complete sign up/login

**Test Accounts (if available):**
- Check `BRGY_PASSWORDS.txt` for test accounts
- Look for owner accounts in your database

---

### **Step 3: Navigate to Create Listing**

1. After login, you should see the **Owner Dashboard**
2. Look for **"Create Listing"** or **"Add Property"** button
3. Click to open the create listing form

**Expected Screen:** Form with fields for:
- Property title
- Description
- Price
- Location/Barangay
- Property type
- Amenities
- **Photos section** 📸
- **Videos section** 🎥

---

### **Step 4: Fill Out Listing Details**

Fill in the required information:

**Basic Info:**
```
Title: Test Property - Beachfront House
Description: Beautiful 2-bedroom house near the beach, fully furnished
Price: ₱15,000 per month
```

**Location:**
```
Barangay: Select any (e.g., Burgos, Talolong, etc.)
Address: 123 Test Street
```

**Property Details:**
```
Property Type: House / Apartment / Room
Bedrooms: 2
Bathrooms: 1
Square meters: 50
```

---

### **Step 5: Add Photos (THIS IS THE KEY TEST!)**

#### **Adding Cover Photo:**
1. Scroll to **"Cover Photo"** section
2. Click **"Select Cover Photo"** or camera icon
3. Choose a photo from:
   - 📱 Device gallery
   - 📷 Camera (take new photo)
4. **Observe:** Photo should appear as thumbnail

#### **Adding Multiple Photos:**
1. Scroll to **"Property Photos"** section
2. Click **"Add Photos"** or **"+"** button
3. Select **3-5 photos** from gallery
4. **Observe:** All photos should display as thumbnails
5. Try deleting one photo (if delete option exists)
6. Try reordering photos (if drag/drop exists)

**Expected Behavior:**
- ✅ Photos show immediately after selection
- ✅ Thumbnails load properly
- ✅ No errors or crashes
- ✅ Can add multiple photos

---

### **Step 6: Add Videos (Optional)**

1. Scroll to **"Videos"** section
2. Click **"Add Video"**
3. Select a short video (< 30 seconds recommended)
4. **Observe:** Video thumbnail appears

---

### **Step 7: Submit the Listing**

1. Review all entered information
2. Scroll to bottom
3. Click **"Create Listing"** or **"Publish"** button
4. **Wait for confirmation** (loading indicator should appear)

**Expected Behavior:**
- ✅ Loading/uploading indicator shows
- ✅ Success message appears
- ✅ Redirected to listing details or dashboard
- ✅ No error messages

**⏱️ Upload Time:**
- Small photos (< 1MB): 2-5 seconds
- Multiple photos: 5-15 seconds
- With video: 15-30 seconds

---

### **Step 8: Verify the Listing**

#### **A. In the App:**
1. Navigate to **"My Listings"** or **"Dashboard"**
2. Find your newly created listing
3. Click to view details
4. **Check:**
   - ✅ Cover photo displays correctly
   - ✅ All photos appear in gallery
   - ✅ Photos load from cloud (fast loading)
   - ✅ Can swipe/navigate through photos
   - ✅ Videos play properly (if added)

#### **B. In Supabase Dashboard:**
1. Go to: https://app.supabase.com
2. Open your project
3. Navigate to: **Storage** → **property-images**
4. **Check:**
   - ✅ New files appear in the list
   - ✅ File names follow pattern: `listing_[id]_[userId]_[timestamp].jpg`
   - ✅ File sizes are reasonable (compressed)
   - ✅ Click a file to preview it

#### **C. Check Database:**
1. In Supabase Dashboard: **Table Editor** → **published_listings**
2. Find your new listing (sort by created_at DESC)
3. **Check columns:**
   - `cover_photo`: Should have Supabase Storage URL
   - `photos`: Array of Supabase Storage URLs
   - `videos`: Array of video URLs (if added)

**Example URLs should look like:**
```
https://dkrctrkqhunttrnkqzsu.supabase.co/storage/v1/object/public/property-images/listing_123_abc_1234567890.jpg
```

---

## 📊 What to Look For

### **✅ Success Indicators:**

1. **Upload Success:**
   - No errors during submission
   - Success message displayed
   - Listing appears in your listings

2. **Cloud Storage:**
   - Photos stored in Supabase Storage (not local device)
   - URLs start with `https://...supabase.co/storage/...`
   - Files visible in Supabase Dashboard

3. **Performance:**
   - Photos load quickly when viewing listing
   - No broken images
   - Smooth image gallery navigation

4. **Data Persistence:**
   - Listing persists after closing app
   - Photos still load after restart
   - Other users can see the listing (if tested)

---

### **❌ Issues to Watch For:**

| Issue | Possible Cause | Solution |
|-------|----------------|----------|
| Photos don't upload | Policy issue | Add INSERT policy |
| Broken images | Invalid URLs | Check storage permissions |
| Slow upload | Large files | Check file size limits |
| Upload fails silently | Network error | Check console logs |
| Photos disappear | Not saved to DB | Check database insertion |

---

## 🐛 Troubleshooting

### **Issue: Upload Gets Stuck**
```
Symptoms: Loading indicator never stops
Solution: 
1. Check internet connection
2. Check file size (should be < 5MB per image)
3. Check console logs for errors
```

### **Issue: "Upload Failed" Error**
```
Symptoms: Error message after clicking submit
Solution:
1. Check if user is authenticated
2. Verify storage policies in Supabase
3. Check file format (JPEG, PNG, WebP)
```

### **Issue: Photos Show Locally but Not After Refresh**
```
Symptoms: Photos visible immediately but gone after restart
Solution:
1. Cloud upload may have failed
2. Check Supabase Storage for files
3. Check database for proper URLs
```

---

## 🎥 Monitoring the Test

### **View Console Logs:**

**On Web:**
1. Open browser DevTools (F12)
2. Go to Console tab
3. Watch for upload messages

**On React Native:**
```bash
# Terminal where you ran npm start
# Look for messages like:
✅ Uploading image to cloud storage...
✅ Image uploaded: https://...
✅ Listing created successfully
```

---

## ✅ Test Checklist

After completing the test, mark what worked:

- [ ] Can create new listing
- [ ] Can select cover photo
- [ ] Can add multiple photos (3-5)
- [ ] Can add videos
- [ ] Upload completes successfully
- [ ] Success message appears
- [ ] Listing appears in dashboard
- [ ] Cover photo displays correctly
- [ ] All photos display in gallery
- [ ] Photos load from cloud (Supabase URLs)
- [ ] Can view listing details
- [ ] Photos persist after app restart
- [ ] Files visible in Supabase Storage
- [ ] Database has correct URLs

---

## 📸 Expected Results

### **Before Upload (in form):**
```
Photos: file:///data/user/0/.../image.jpg (local URI)
Status: Stored in component state
```

### **During Upload:**
```
Status: Uploading to cloud...
Progress: 1/5 photos uploaded
```

### **After Upload (in database):**
```
cover_photo: https://dkrctrkqhunttrnkqzsu.supabase.co/storage/v1/object/public/property-images/...
photos: [
  "https://...supabase.co/.../image1.jpg",
  "https://...supabase.co/.../image2.jpg",
  ...
]
```

---

## 🎉 Success Criteria

Your test is SUCCESSFUL if:
1. ✅ Listing created without errors
2. ✅ All photos uploaded to Supabase Storage
3. ✅ Photos display from cloud URLs
4. ✅ Listing persists and loads correctly
5. ✅ No broken images or errors

---

## 📝 Report Results

After testing, document:
- ✅ What worked perfectly
- ⚠️ Any issues encountered
- 🐛 Error messages (if any)
- ⏱️ Upload time
- 📊 File sizes tested

---

## 🚀 Next Steps After Successful Test

1. Test viewing listing as a tenant (different account)
2. Test editing listing photos
3. Test deleting photos
4. Test with different file sizes
5. Test with poor internet connection
6. Test on different devices (Android/iOS)

---

**Ready to test? Start your app and follow the steps above!** 🎯
