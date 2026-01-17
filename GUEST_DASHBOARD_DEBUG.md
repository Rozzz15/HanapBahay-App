# 🔍 Guest Dashboard Debug Guide

## 📋 Issue
Guest dashboard shows "Loaded 0 available listings" even though listings exist in the database.

## 🎯 Two Dashboards in the App

### **1. Guest Dashboard** (`app/listing-dashboard.tsx`)
- **Route:** `/listing-dashboard`
- **Access:** Get Started → Features → "Browse as Guest"
- **Purpose:** Public browsing without login
- **Filter:** `availabilityStatus === 'available' && status === 'published'`

### **2. Tenant Dashboard** (`app/(tabs)/index.tsx`)
- **Route:** `/(tabs)` (Home tab)
- **Access:** Get Started → Features → Login → Dashboard
- **Purpose:** Authenticated user browsing
- **Filter:** `status === 'published'`

## 🐛 Guest Dashboard Filter Issue

The guest dashboard has **stricter filtering** than the tenant dashboard:

```typescript
// Guest Dashboard Filter (listing-dashboard.tsx line 126)
if (listing.availabilityStatus === 'available' && listing.status === 'published') {
  // Show listing
}
```

**Requirements:**
1. ✅ `status` must be exactly `'published'` (lowercase)
2. ✅ `availabilityStatus` must be exactly `'available'`
3. ✅ Not all rooms fully occupied

## 🔧 Debug Logs Added

I've added comprehensive debug logging to `listing-dashboard.tsx`:

**Console Output You'll See:**
```
🔄 Loading published listings for guest dashboard...
📊 Raw listings from database: X
📊 After type filter: X
🔍 First listing debug: {
  id: "...",
  status: "published",
  availabilityStatus: "available",
  propertyType: "House",
  hasAllFields: true
}
🔍 Checking listing [id]: {
  status: "published",
  availabilityStatus: "available",
  statusMatch: true,
  availabilityMatch: true,
  bothMatch: true
}
✅ Loaded X available listings
```

## 🧪 Testing Steps

### **Test 1: Check Database Fields**
1. Create a listing as owner
2. Check console logs after creation
3. Look for:
   ```
   ✅ Listing saved: {
     status: "published",
     availabilityStatus: "available"
   }
   ```

### **Test 2: Test Guest Dashboard**
1. Navigate to Get Started screen
2. Click "Get Started"
3. On Features screen, click "Browse as Guest" or skip
4. **Watch console logs:**
   ```
   📊 Raw listings from database: X (should be > 0)
   📊 After type filter: X
   🔍 Checking listing [id]:
     - statusMatch: true/false
     - availabilityMatch: true/false
     - bothMatch: true/false
   ✅ Loaded X available listings (should match bothMatch=true count)
   ```

### **Test 3: Compare with Tenant Dashboard**
1. Login as tenant
2. Check Home tab
3. **Expected:** More listings show (only needs `status === 'published'`)

## 🎯 Common Issues & Solutions

### Issue 1: `status !== 'published'`
**Symptom:** `statusMatch: false`
**Cause:** Status might be "Published" (capital P) or "draft"
**Solution:** Ensure `status` is exactly `"published"` (lowercase) when creating listing

### Issue 2: `availabilityStatus !== 'available'`
**Symptom:** `availabilityMatch: false`
**Cause:** Field might be undefined, null, or different value
**Solution:** Check `create-listing.tsx` sets `availabilityStatus: 'available'` (line 82, 591)

### Issue 3: Field Name Mismatch (snake_case vs camelCase)
**Symptom:** `hasAllFields: false`
**Cause:** Database has `availability_status` but code checks `availabilityStatus`
**Solution:** Using `db.list()` which auto-converts (already implemented)

### Issue 4: All Rooms Occupied
**Symptom:** Listing passes filters but still not shown
**Cause:** `areAllRoomsFullyOccupied()` returns true
**Solution:** Ensure listing has available capacity

## 🔍 Quick Diagnostic Commands

**Check listings in database:**
```sql
SELECT id, status, availability_status, property_type 
FROM published_listings;
```

**Expected output:**
```
id: "listing_xxx"
status: "published"  ← Must be lowercase
availability_status: "available"  ← In database (snake_case)
```

**In app console:**
```javascript
// Check if db.list() converts properly
const listings = await db.list('published_listings');
console.log(listings[0].availabilityStatus); // Should be defined
console.log(listings[0].status); // Should be "published"
```

## ✅ Verification Checklist

After creating a listing as owner:

- [ ] Console shows: `status: "published"` (lowercase)
- [ ] Console shows: `availabilityStatus: "available"`
- [ ] Database has: `availability_status = 'available'`
- [ ] Guest dashboard logs show: `statusMatch: true`
- [ ] Guest dashboard logs show: `availabilityMatch: true`
- [ ] Guest dashboard logs show: `bothMatch: true`
- [ ] Guest dashboard displays the listing

## 📊 Expected Behavior

**Guest Dashboard:**
- Shows listings with `availabilityStatus === 'available'`
- Hides fully occupied listings
- Public access (no login required)

**Tenant Dashboard:**
- Shows all listings with `status === 'published'`
- Shows occupied listings (user might want to join waitlist)
- Requires login

## 🚀 Next Steps

1. **Test guest dashboard** with debug logs
2. **Check console output** for filter results
3. **Verify field values** match expectations
4. **Report findings** with console logs

---

**Run the app and check the console logs to see exactly why listings are being filtered out!**
