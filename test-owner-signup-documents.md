# Owner Document Upload Test Guide

## Test Scenario
Verify that documents uploaded during owner sign-up are properly saved and displayed in barangay application details.

## What Was Fixed

### Issue
1. **SignUpModal** saved documents to AsyncStorage
2. **sign-up.ts** looked for documents in Supabase (wrong location)
3. Documents were never found, resulting in empty array
4. **owner_applications.documents** was set to `null`
5. Barangay officials saw "No Documents Submitted" even when documents were uploaded

### Solution
Modified `api/auth/sign-up.ts` (lines 230-268) to:
1. Load documents from AsyncStorage first (where SignUpModal saves them)
2. Clean up AsyncStorage after retrieving documents
3. Fallback to Supabase for backward compatibility
4. Properly pass documents to owner_applications table

## Test Steps

### Step 1: Owner Sign-Up with Documents
1. Open the app (web or mobile)
2. Go to Sign Up
3. Select "Owner" role
4. Fill in all required fields:
   - Name
   - Email
   - Contact Number
   - House Number
   - Street
   - Barangay (select one: RIZAL, TALOLONG, GOMEZ, MAGSAYSAY, or BURGOS)
5. **Upload documents**:
   - Click "Upload Business Documents"
   - Select a document type (e.g., "Government ID")
   - Upload 1-3 image files
   - Repeat for other document types (Business Permit, Barangay Clearance, etc.)
6. Agree to Terms and Conditions
7. Click "Create Account"
8. **Expected**: Success message saying application submitted for approval

### Step 2: Verify Barangay Application Details
1. Log in as a Barangay official for the same barangay
   - Use credentials from `BRGY_PASSWORDS.txt`
   - Example: `burgos@hanapbahay.com` / `burgos123`
2. Go to "Owner Applications" page
3. Find the newly created application
4. Click to view application details
5. **Verify**: "Business Documents & Requirements" section shows:
   - ✅ All uploaded documents with thumbnails
   - ✅ Document names (Government ID, Business Permit, etc.)
   - ✅ Upload dates
   - ✅ "View" and "Download" buttons for each document

### Step 3: Test "No Documents" Scenario
1. Create another owner account
2. Fill in all fields but **DO NOT** upload any documents
3. Complete sign-up
4. As barangay official, view this application
5. **Verify**: "Business Documents & Requirements" section shows:
   - ⚠️ Red alert box
   - ⚠️ "No Documents Submitted" heading
   - ⚠️ Message: "The applicant has not uploaded any business documents or requirements yet."

## Expected Console Logs

### During Sign-Up (with documents)
```
💾 Saving owner verification documents: [2 documents]
✅ Owner verification documents saved
🔍 Checking for owner verification documents from AsyncStorage...
✅ Found 2 documents in AsyncStorage
🧹 Cleaned up AsyncStorage
📝 Creating owner application for barangay: BURGOS
✅ Owner application created in Supabase
```

### During Barangay View
```
📋 Loading application details...
✅ Application loaded
📄 Documents found: 2
```

## Files Modified

1. **app/(brgy)/owner-applications.tsx**
   - Removed conditional wrapper that hid documents section
   - Added "No Documents Submitted" fallback UI
   - Fixed ternary operator structure

2. **api/auth/sign-up.ts**
   - Modified document loading logic (lines 230-268)
   - Load from AsyncStorage instead of Supabase
   - Clean up AsyncStorage after use
   - Added fallback for backward compatibility

## Troubleshooting

### If documents still don't show:
1. Check browser/app console for errors
2. Verify AsyncStorage is accessible (not in incognito/private mode)
3. Check Supabase owner_applications table:
   ```sql
   SELECT id, name, documents FROM owner_applications 
   WHERE status = 'pending' 
   ORDER BY created_at DESC 
   LIMIT 5;
   ```
4. Verify documents array structure:
   ```json
   [
     {
       "id": "doc_123",
       "name": "Government ID",
       "uri": "file://...",
       "uploadedAt": "2026-01-14T..."
     }
   ]
   ```

### If AsyncStorage fails:
- The code falls back to checking Supabase owner_verifications
- Documents should still work if previously saved there

## Success Criteria
✅ Documents uploaded during sign-up are saved
✅ Documents are stored in database with owner application
✅ Barangay officials can view all uploaded documents
✅ Document thumbnails, names, and dates display correctly
✅ "View" and "Download" buttons work for each document
✅ "No Documents" message shows when no documents uploaded
✅ Application approval/rejection works regardless of documents
