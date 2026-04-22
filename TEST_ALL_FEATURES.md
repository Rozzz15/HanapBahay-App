# HanapBahay - Complete Feature Test Plan

## 🧪 Manual Testing Guide - Run Before Deployment

### Test Environment Setup
1. Clear app data/cache
2. Restart the app fresh
3. Have test accounts ready:
   - Test tenant account
   - Test owner account  
   - Test barangay account

---

## 1️⃣ Authentication Flow Tests (15 minutes)

### Tenant Signup ✅
- [ ] Open app → Click "Sign Up"
- [ ] Select "Tenant" role
- [ ] Fill in all required fields
- [ ] Submit form
- [ ] **Expected:** Success toast, redirects to tenant dashboard
- [ ] **Check:** User appears in Supabase `users` table

### Owner Signup ✅
- [ ] Open app → Click "Sign Up"
- [ ] Select "Owner" role
- [ ] Fill in all fields + address
- [ ] Upload at least 2 documents (IDs, permits)
- [ ] Agree to terms
- [ ] Submit form
- [ ] **Expected:** "Account Created! Pending Barangay approval" alert
- [ ] Click "OK" on alert
- [ ] **Expected:** Navigates to login screen (NO WHITE SCREEN!)
- [ ] **Check:** Owner in `users` table with `approved = false`

### Login Flow ✅
- [ ] Login with tenant account
- [ ] **Expected:** Redirects to tenant dashboard/home
- [ ] Logout
- [ ] Login with approved owner account
- [ ] **Expected:** Redirects to owner dashboard
- [ ] Logout
- [ ] Login with barangay account
- [ ] **Expected:** Redirects to barangay dashboard

### Password Reset ✅
- [ ] Click "Forgot Password"
- [ ] Enter email
- [ ] **Expected:** Reset email sent (check Supabase logs)

---

## 2️⃣ Tenant Features Tests (30 minutes)

### Browse Properties ✅
- [ ] Login as tenant
- [ ] View property list on home screen
- [ ] **Expected:** Properties display with photos, titles, prices
- [ ] Scroll through listings
- [ ] **Expected:** Smooth scrolling, images load

### Search & Filter ✅
- [ ] Use search bar to search property
- [ ] **Expected:** Results filter in real-time
- [ ] Open filter modal
- [ ] Set price range, bedrooms, barangay
- [ ] Apply filters
- [ ] **Expected:** Only matching properties shown

### View Property Details ✅
- [ ] Click on a property
- [ ] **Expected:** Detail page opens quickly (< 1s)
- [ ] **Check:**
  - [ ] All photos load
  - [ ] Property details visible
  - [ ] Owner info shown
  - [ ] "Book Now" button visible

### Favorite Properties ✅
- [ ] On property detail page, click heart icon
- [ ] **Expected:** Added to favorites
- [ ] Go to Favorites tab
- [ ] **Expected:** Property appears in favorites list
- [ ] Click heart again to unfavorite
- [ ] **Expected:** Removed from favorites

### Book Property ✅
- [ ] On property detail page, click "Book Now"
- [ ] Select dates
- [ ] Enter number of occupants
- [ ] Submit booking
- [ ] **Expected:** Booking created successfully
- [ ] Go to Bookings tab
- [ ] **Expected:** New booking appears with "Pending" status

### Chat with Owner ✅
- [ ] On property detail page, click "Message Owner"
- [ ] **Expected:** Chat opens in < 1 second (NO 7+ SECOND DELAY!)
- [ ] **Expected:** No white screen
- [ ] Type and send message
- [ ] **Expected:** Message appears immediately
- [ ] Receive reply from owner (test with 2 devices)
- [ ] **Expected:** Reply appears in real-time

### Submit Complaint ✅
- [ ] Go to "Submit Complaint" tab
- [ ] Fill complaint form
- [ ] Submit
- [ ] **Expected:** Complaint submitted successfully
- [ ] Go to "Track Complaints"
- [ ] **Expected:** Complaint appears with status

---

## 3️⃣ Owner Features Tests (45 minutes)

### Create Listing ✅
- [ ] Login as approved owner
- [ ] Go to "Create Listing" or "+" button
- [ ] Fill in property details:
  - [ ] Title, description
  - [ ] Address, barangay
  - [ ] Price, bedrooms, bathrooms
  - [ ] Amenities
- [ ] Upload 3+ photos
- [ ] **Expected:** Photos upload successfully (check progress)
- [ ] Upload 1 video (optional)
- [ ] Submit listing
- [ ] **Expected:** "Listing created successfully"
- [ ] Go to "My Listings"
- [ ] **Expected:** New listing appears

### Edit Listing ✅
- [ ] Go to "My Listings"
- [ ] Click on a listing
- [ ] Click "Edit"
- [ ] Change price
- [ ] Add/remove photo
- [ ] Save changes
- [ ] **Expected:** "Listing updated successfully"
- [ ] Verify changes appear

### View Booking Requests ✅
- [ ] Go to "Bookings" tab
- [ ] **Expected:** List of pending booking requests
- [ ] Click on a booking
- [ ] View tenant details

### Approve/Reject Booking ✅
- [ ] Click "Approve" on a booking
- [ ] **Expected:** Booking status changes to "Approved"
- [ ] **Expected:** Tenant sees approved status
- [ ] For another booking, click "Reject"
- [ ] **Expected:** Booking status changes to "Rejected"

### Chat with Tenant ✅
- [ ] Go to "Messages" tab
- [ ] **Expected:** Conversation list loads in < 1 second
- [ ] Click on a conversation
- [ ] **Expected:** Chat opens in < 1 second (NO DELAY!)
- [ ] Send message to tenant
- [ ] **Expected:** Message sends immediately

### Payment Confirmation ✅
- [ ] When tenant pays, receive notification
- [ ] Go to booking details
- [ ] Verify payment details
- [ ] Confirm payment received
- [ ] **Expected:** Booking status updates to "Paid"

### View Tenants ✅
- [ ] Go to "Tenants" tab
- [ ] **Expected:** List of current tenants
- [ ] View tenant details

### Revenue Analytics ✅
- [ ] Go to "Dashboard"
- [ ] **Expected:** Charts showing:
  - [ ] Revenue over time
  - [ ] Occupancy rates
  - [ ] Booking statistics

---

## 4️⃣ Barangay Features Tests (30 minutes)

### Login as Barangay Official ✅
- [ ] Login with barangay credentials
- [ ] **Expected:** Redirects to barangay dashboard

### Review Owner Applications ✅
- [ ] Go to "Owner Applications" tab
- [ ] **Expected:** List of pending owner applications
- [ ] Click on an application
- [ ] View owner details and documents
- [ ] Download and check documents
- [ ] Click "Approve"
- [ ] **Expected:** Owner status changes to approved
- [ ] **Expected:** Owner can now login and create listings

### Reject Owner Application ✅
- [ ] Click on another application
- [ ] Click "Reject"
- [ ] Enter rejection reason
- [ ] Submit
- [ ] **Expected:** Owner status changes to rejected
- [ ] **Expected:** Owner notified

### View Properties ✅
- [ ] Go to "Properties" tab
- [ ] **Expected:** List of all properties in barangay
- [ ] Filter by status (available, occupied)
- [ ] View property details

### Monitor Complaints ✅
- [ ] Go to "Complaints" tab
- [ ] **Expected:** List of tenant complaints
- [ ] Click on a complaint
- [ ] View complaint details
- [ ] Update complaint status
- [ ] Add response/resolution

### View Analytics ✅
- [ ] Go to "Reports" or "Analytics"
- [ ] **Expected:** Dashboard showing:
  - [ ] Total properties
  - [ ] Active owners
  - [ ] Registered tenants
  - [ ] Complaints this month
  - [ ] Occupancy trends

### Resident Management ✅
- [ ] Go to "Residents" tab
- [ ] **Expected:** List of tenants in barangay
- [ ] Search for specific tenant
- [ ] View tenant details

---

## 5️⃣ Payment Integration Tests (15 minutes)

### GCash Payment ✅
- [ ] As tenant, book a property
- [ ] Select "Pay with GCash"
- [ ] Complete payment flow
- [ ] **Expected:** Redirects to GCash app/page
- [ ] Complete payment
- [ ] **Expected:** Returns to app with success message

### PayMaya Payment ✅
- [ ] Book another property
- [ ] Select "Pay with PayMaya"
- [ ] Complete payment flow
- [ ] **Expected:** Payment processes successfully

### Payment Receipt ✅
- [ ] After payment, view booking details
- [ ] **Expected:** Payment receipt available
- [ ] Download/view receipt

---

## 6️⃣ Performance Tests (10 minutes)

### Chat Performance ✅
- [ ] Open conversation list
- [ ] **Expected:** Loads in < 500ms
- [ ] **Check console:** `[TENANT-MESSAGES] Loaded X conversations in XXXms`
- [ ] Click on conversation
- [ ] **Expected:** Opens in < 500ms
- [ ] **Check console:** `[TENANT-NEW] Total loaded in XXXms`
- [ ] Should be 300-800ms, NOT 7+ seconds!

### Image Loading ✅
- [ ] Browse properties with images
- [ ] **Expected:** Images load progressively
- [ ] No long delays or frozen screens

### Navigation Speed ✅
- [ ] Navigate between tabs
- [ ] **Expected:** Instant transitions (< 200ms)
- [ ] Open/close modals
- [ ] **Expected:** Smooth animations

### Offline Handling ✅
- [ ] Turn off WiFi/data
- [ ] Try to browse properties
- [ ] **Expected:** Shows "No internet" message
- [ ] Turn internet back on
- [ ] **Expected:** App reconnects automatically

---

## 7️⃣ Edge Cases & Error Handling (15 minutes)

### Invalid Input ✅
- [ ] Try signup with invalid email
- [ ] **Expected:** Shows validation error
- [ ] Try booking with past dates
- [ ] **Expected:** Shows error message

### Network Errors ✅
- [ ] Simulate poor connection
- [ ] Try loading data
- [ ] **Expected:** Shows loading state, retries, or error message

### Upload Failures ✅
- [ ] Try uploading very large image (> 10MB)
- [ ] **Expected:** Shows file size error

### Duplicate Actions ✅
- [ ] Double-click submit button
- [ ] **Expected:** Only one action triggered (button disabled)

---

## 8️⃣ Security Tests (10 minutes)

### Unauthorized Access ✅
- [ ] Logout
- [ ] Try to access owner dashboard directly
- [ ] **Expected:** Redirected to login
- [ ] Login as tenant
- [ ] Try to access barangay routes
- [ ] **Expected:** Access denied or redirect

### Data Privacy ✅
- [ ] Login as tenant
- [ ] Try to view other tenant's bookings
- [ ] **Expected:** Only see own bookings
- [ ] Login as owner
- [ ] Try to edit other owner's listings
- [ ] **Expected:** Not possible

---

## ✅ Test Results Summary

**Test Date:** _______________  
**Tested By:** _______________  
**Device:** _______________  

### Critical Issues (Must Fix Before Deploy)
- [ ] None found ✅

### Minor Issues (Can Fix Later)
- [ ] None found ✅

### Performance Metrics
- Conversation list load time: _______ ms (Target: < 500ms)
- Chat room open time: _______ ms (Target: < 1s)
- Property detail load time: _______ ms (Target: < 2s)

### Overall Status
- [ ] ✅ Ready for Production
- [ ] ⚠️ Minor fixes needed
- [ ] ❌ Major issues found

---

## 📝 Notes & Observations

(Add any issues, concerns, or observations here)

_______________________________________________
_______________________________________________
_______________________________________________
_______________________________________________

