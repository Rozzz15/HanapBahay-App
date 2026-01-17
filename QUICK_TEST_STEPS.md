# ⚡ Quick Test Steps - Create Listing with Photos

## 🎯 5-Minute Test

### 1. Start App
```bash
cd Desktop/hanapbahay
npm start
```
Press `a` for Android or `i` for iOS

### 2. Login as Owner
- Use any owner account
- Or create new owner account

### 3. Create New Listing
- Click **"Create Listing"** / **"Add Property"**
- Fill basic info:
  - Title: "Test House"
  - Price: ₱10,000
  - Barangay: Any
  
### 4. Add Photos (KEY TEST!)
- Click **"Select Cover Photo"** → Pick 1 photo
- Click **"Add Photos"** → Pick 3-5 photos
- Verify thumbnails appear

### 5. Submit
- Click **"Create Listing"** / **"Publish"**
- Wait for success message

### 6. Verify
- Go to "My Listings"
- Open the listing
- **Check:** Photos load from cloud (fast loading)

### 7. Check Supabase
- Go to: https://app.supabase.com
- Storage → property-images
- **Look for:** New files with your listing

---

## ✅ Success = 
- Photos upload without errors
- Photos display in listing
- Files appear in Supabase Storage

## ❌ Issues?
- Check console for errors
- Verify internet connection
- See detailed guide: `TEST_CREATE_LISTING_WITH_PHOTOS.md`
