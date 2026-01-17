# 🔧 Supabase Setup - Step by Step Guide

## ⚡ Quick Setup (5 minutes total)

---

## Step 1: Create the Bucket (2 minutes)

### In Supabase Dashboard:

1. **Navigate to Storage**
   ```
   Left sidebar → Click "Storage" icon
   ```

2. **Create New Bucket**
   ```
   Click green "New bucket" button (top right)
   ```

3. **Configure Bucket**
   ```
   Bucket name: owner-documents
   
   ☑️ Public bucket (MUST BE CHECKED!)
   
   File size limit: 50 MB (default is fine)
   
   Allowed MIME types: Leave empty (allows all)
   ```

4. **Create**
   ```
   Click "Create bucket" button
   ```

✅ **You should now see "owner-documents" in your buckets list**

---

## Step 2: Set Up Policies (1 minute)

### In Supabase Dashboard:

1. **Navigate to SQL Editor**
   ```
   Left sidebar → Click "SQL Editor" icon
   ```

2. **Create New Query**
   ```
   Click "New query" button
   ```

3. **Copy and Paste**
   ```
   Open: Desktop/hanapbahay/setup-owner-documents-bucket.sql
   Copy ALL contents
   Paste into SQL Editor
   ```

4. **Run**
   ```
   Click "Run" button (or press Ctrl+Enter)
   ```

✅ **You should see: "Success. No rows returned"**
   
✅ **And notice: "✅ Storage policies created successfully for owner-documents bucket!"**

---

## Step 3: Verify Setup (1 minute)

### Option A: Run Verification Script

```bash
cd Desktop/hanapbahay
node verify-supabase-setup.js
```

**Expected Output:**
```
✅ owner-documents bucket exists
✅ Upload test successful
✅ Public URL generated
✅ Download test successful
✅ Test file cleaned up
✅ ALL CHECKS PASSED!
```

### Option B: Manual Verification

1. **Check Bucket Exists**
   ```
   Dashboard → Storage → See "owner-documents" listed
   ```

2. **Check It's Public**
   ```
   Click on "owner-documents"
   Settings icon → Verify "Public bucket" is ON
   ```

3. **Check Policies**
   ```
   Dashboard → Storage → owner-documents
   Click "Policies" tab
   Should see 4 policies listed
   ```

---

## ✅ Checklist

Before proceeding, confirm:

- [ ] Bucket "owner-documents" exists
- [ ] Bucket is marked as "Public"
- [ ] SQL script ran without errors
- [ ] Verification script passed (or manual verification done)

---

## 🎉 You're Done!

Your Supabase Storage is now ready for owner documents!

**Next Step**: Test the application
- Sign up as owner with documents
- Documents will upload to your new bucket
- View them in the barangay portal

---

## 🆘 Troubleshooting

### Error: "relation storage.policies does not exist"

**Cause**: Old SQL script tried to query system table

**Fix**: Already fixed! Just re-run the updated `setup-owner-documents-bucket.sql`

---

### Error: "bucket not found" when uploading

**Cause**: Bucket wasn't created or wrong name

**Fix**: 
1. Go to Storage in Supabase Dashboard
2. Confirm bucket named exactly: `owner-documents` (lowercase, with hyphen)
3. If missing, create it following Step 1

---

### Documents upload but don't show in app

**Cause**: Bucket not marked as "Public"

**Fix**:
1. Storage → owner-documents
2. Click settings icon (gear)
3. Toggle "Public bucket" to ON
4. Save

---

### "Permission denied" errors

**Cause**: Policies not set up correctly

**Fix**:
1. Re-run `setup-owner-documents-bucket.sql`
2. Or manually add policies:
   - Go to Storage → owner-documents → Policies tab
   - Add policies as shown in the SQL file

---

## 📊 What Each Policy Does

| Policy Name | Purpose |
|------------|---------|
| Users can upload owner documents | Allows authenticated users to upload files |
| Public can view owner documents | Allows anyone to view/download files (needed for barangay officials) |
| Users can update their own documents | Allows users to replace their files |
| Users can delete their own documents | Allows users to remove their files |

---

## 🔐 Security Notes

- **Public bucket** = Anyone with the URL can view files (this is intended!)
- **Why public?** = Barangay officials need to view applicant documents
- **Files are organized** by user ID in folders
- **URLs are complex** = Hard to guess, provides some security
- **Policies limit actions** = Only authenticated users can upload/delete

---

## 📞 Need Help?

If you're stuck:

1. **Check the bucket name** - Must be exactly `owner-documents`
2. **Check it's public** - "Public bucket" toggle must be ON
3. **Run the verification script** - `node verify-supabase-setup.js`
4. **Check console logs** - When testing upload, look for error messages
5. **Review policies** - Make sure all 4 policies exist

---

## ✅ Ready to Test!

Once all checks pass, you can:
1. Sign up as owner with documents
2. See uploads in Supabase Storage
3. View documents in barangay portal

**Happy testing!** 🚀
