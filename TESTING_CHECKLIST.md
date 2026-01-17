# 🧪 Testing Checklist for Media Upload Fixes

## ✅ Pre-Testing Setup

- [ ] Ensure you have an **Owner account** (approved by barangay)
- [ ] Have test images ready (cover photo + 2-3 property photos)
- [ ] Optional: Have a test video ready
- [ ] Have a **Tenant account** for viewing listings

---

## 📋 Test 1: Owner - Create New Listing

### Steps:
1. **Login as Owner**
   - [ ] Open app and login with owner credentials
   - [ ] Navigate to Owner Dashboard

2. **Start Creating Listing**
   - [ ] Click "Create Listing" or "Add Property"
   - [ ] Fill in Step 1 (Basic Info):
     - Property Type: House/Apartment/Room
     - Rental Type: Long-term/Short-term
     - Monthly Rent: Any amount
     - Address & Barangay
     - Rooms & Bathrooms

3. **Add Media (Step 2)**
   - [ ] **Upload Cover Photo**
     - Click "Add Cover Photo"
     - Select an image from gallery/camera
     - ✅ Verify: Image preview shows correctly
   
   - [ ] **Upload Property Photos**
     - Click "Add Photos"
     - Select 2-3 images
     - ✅ Verify: All images show in preview
   
   - [ ] Optional: Upload a video
     - ✅ Verify: Video thumbnail shows

4. **Complete Listing (Steps 3-4)**
   - [ ] Fill in amenities (WiFi, Parking, etc.)
   - [ ] Fill in house rules
   - [ ] Add owner contact info
   - [ ] Submit listing

5. **Verify Success**
   - [ ] ✅ Success message appears
   - [ ] Console logs show: `📤 Uploading media to cloud storage...`
   - [ ] Console logs show: `✅ Media uploaded successfully`
   - [ ] Console logs show: `✅ Listing saved and verified successfully`

---

## 📋 Test 2: Owner - View in "My Listings"

### Steps:
1. **Navigate to My Listings**
   - [ ] From Owner Dashboard, go to "My Listings"
   - [ ] Or navigate directly to `/(owner)/listings`

2. **Verify Listing Display**
   - [ ] ✅ Your new listing appears in the list
   - [ ] ✅ **Cover photo is visible** (not "No Photo")
   - [ ] ✅ Property details are correct (title, address, rent)
   - [ ] ✅ Status shows as "Published"

3. **Check Console Logs**
   - [ ] Look for: `📸 Using database media for listing`
   - [ ] Look for: `hasCoverPhoto: true`
   - [ ] No errors about missing images

---

## 📋 Test 3: Tenant - View in Main Dashboard

### Steps:
1. **Login as Tenant** (or logout and view as guest)
   - [ ] Navigate to Tenant Dashboard (`/(tabs)/index`)

2. **Verify Listing Appears**
   - [ ] ✅ Your new listing appears in "Featured Properties" or main list
   - [ ] ✅ **Cover photo displays correctly**
   - [ ] ✅ Property details are accurate
   - [ ] ✅ No placeholder "🏠 Featured Property" image

3. **Check Console Logs**
   - [ ] Look for: `📋 Found published listings: X` (count > 0)
   - [ ] Look for: `✅ ACCEPTED: Listing [id] will show`
   - [ ] Look for: `Has Cover Photo: ✅ YES`

4. **Click on Listing**
   - [ ] Click the listing card
   - [ ] Navigate to listing details page
   - [ ] ✅ Cover photo displays
   - [ ] ✅ All property photos display in gallery
   - [ ] ✅ Video displays (if uploaded)

---

## 📋 Test 4: Data Integrity Check

### Steps:
1. **Check Database Fields**
   - [ ] Open browser console or check logs
   - [ ] Look for database state logs
   - [ ] Verify: `cover_photo` field has URL (starts with `https://`)
   - [ ] Verify: `photos` array has URLs
   - [ ] Verify: URLs point to Supabase storage (not `file://`)

2. **Console Commands** (if accessible):
   ```javascript
   // Check listing data
   const listings = await db.list('published_listings');
   console.log(listings[0].coverPhoto); // Should show URL
   console.log(listings[0].photos); // Should show array of URLs
   ```

---

## 📋 Test 5: Search and Filter

### Steps:
1. **Search for Listing**
   - [ ] Use search bar in tenant dashboard
   - [ ] Search by property type, location, or price
   - [ ] ✅ Your listing appears in results with cover photo

2. **Apply Filters**
   - [ ] Click filter button
   - [ ] Filter by barangay
   - [ ] ✅ Listing appears when matching filters

---

## 📋 Test 6: Edge Cases

### Steps:
1. **Create Listing Without Cover Photo**
   - [ ] Create a new listing
   - [ ] Skip cover photo (only add property photos)
   - [ ] Submit
   - [ ] ✅ First property photo becomes cover (or shows placeholder)

2. **Create Listing With Only Cover Photo**
   - [ ] Create a new listing
   - [ ] Add only cover photo (no property photos)
   - [ ] Submit
   - [ ] ✅ Cover photo displays correctly

3. **Edit Existing Listing**
   - [ ] Go to My Listings
   - [ ] Edit a listing
   - [ ] Change cover photo
   - [ ] Save
   - [ ] ✅ New cover photo appears

---

## 🐛 Common Issues to Watch For

### Issue: "No Photo" Placeholder Shows
**Cause:** Cover photo not uploading or field not reading correctly
**Check:**
- Console logs for upload errors
- Database field has URL (not local `file://` path)
- Using `db.list()` not direct Supabase call

### Issue: Listing Doesn't Appear in Dashboard
**Cause:** Status not "published" or filtering issue
**Check:**
- Listing status is exactly "published" (lowercase)
- Barangay field is filled
- User ID matches owner

### Issue: Images Show Briefly Then Disappear
**Cause:** Using local URIs instead of cloud URLs
**Check:**
- `savePropertyMedia` is being called
- URLs start with `https://` not `file://`

---

## ✅ Success Criteria

All tests pass if:
- [x] ✅ Cover photo uploads to Supabase storage
- [x] ✅ Cover photo appears in Owner/My Listings
- [x] ✅ Listing appears in Tenant Dashboard
- [x] ✅ Cover photo displays in Tenant Dashboard
- [x] ✅ All property photos display in listing details
- [x] ✅ No console errors about missing images
- [x] ✅ Database fields use cloud URLs (not local paths)

---

## 📝 Notes

**Console Logs to Monitor:**
- `📤 Uploading media to cloud storage...`
- `✅ Media uploaded successfully`
- `📸 Using database media for listing`
- `Has Cover Photo: ✅ YES`
- `✅ Image loaded for listing`

**Console Errors to Avoid:**
- `❌ Image load error`
- `⚠️ No media found`
- `undefined` for coverPhoto field

---

## 🚀 Next Steps After Testing

If all tests pass:
1. ✅ Commit the changes
2. ✅ Build production APK
3. ✅ Deploy to production

If tests fail:
1. Note which test failed
2. Check console logs for errors
3. Review the specific fix for that area
4. Report issues for debugging
