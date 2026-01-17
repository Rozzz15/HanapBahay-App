# File Size Validation - Complete ✅

## Overview
Added comprehensive file size validation for settlement document uploads to prevent oversized files, improve upload performance, and provide better user experience.

## Features Implemented

### ✅ 1. File Size Limits
**Individual File Limit:** 10 MB per file
**Total Upload Limit:** 50 MB per upload session
**Supported Types:** Images (JPG, PNG, etc.) and PDFs

### ✅ 2. Validation Process
- **Pre-upload validation** - Checks before uploading
- **Individual file check** - Each file validated separately
- **Total size check** - Combined size of all files validated
- **User-friendly errors** - Clear messages with actionable advice

### ✅ 3. File Size Display
- **Human-readable format** (KB, MB, GB)
- **Per-file size** in confirmation dialog
- **Total size** shown before upload
- **Oversized files** listed with their sizes

### ✅ 4. Enhanced Upload Confirmation
- **File list preview** before upload
- **Size information** for each file
- **Total size display** at bottom
- **Cancel/Upload options** for user control

## Technical Implementation

### Helper Function: Format File Size
```typescript
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};
```

**Examples:**
- `formatFileSize(0)` → "0 Bytes"
- `formatFileSize(1024)` → "1 KB"
- `formatFileSize(1536)` → "1.5 KB"
- `formatFileSize(1048576)` → "1 MB"
- `formatFileSize(10485760)` → "10 MB"

### Validation Constants
```typescript
const MAX_FILE_SIZE = 10 * 1024 * 1024;      // 10 MB per file
const MAX_TOTAL_SIZE = 50 * 1024 * 1024;     // 50 MB total
```

### Validation Logic
```typescript
// Check each file individually
const oversizedFiles: string[] = [];
let totalSize = 0;
const validAssets = [];

for (const asset of result.assets) {
  const fileSize = asset.size || 0;
  totalSize += fileSize;
  
  if (fileSize > MAX_FILE_SIZE) {
    oversizedFiles.push(`${asset.name} (${formatFileSize(fileSize)})`);
  } else {
    validAssets.push(asset);
  }
}

// Reject oversized files
if (oversizedFiles.length > 0) {
  Alert.alert('Files Too Large', /* error message */);
  return;
}

// Reject if total size exceeds limit
if (totalSize > MAX_TOTAL_SIZE) {
  Alert.alert('Total Size Too Large', /* error message */);
  return;
}
```

## User Flows

### Flow 1: Successful Upload (Files Within Limits)
```
1. User clicks "Upload Documents"
2. Selects 3 files:
   - document1.pdf (2.5 MB)
   - photo1.jpg (3.1 MB)
   - photo2.jpg (1.8 MB)
3. System validates:
   ✅ All files < 10 MB
   ✅ Total (7.4 MB) < 50 MB
4. Confirmation dialog shows:
   ┌──────────────────────────────────┐
   │ Upload Documents                 │
   │                                  │
   │ 3 document(s) selected:          │
   │                                  │
   │ 1. document1.pdf (2.5 MB)        │
   │ 2. photo1.jpg (3.1 MB)           │
   │ 3. photo2.jpg (1.8 MB)           │
   │                                  │
   │ Total: 7.4 MB                    │
   │                                  │
   │ Proceed with upload?             │
   │                                  │
   │  [Cancel]        [Upload]        │
   └──────────────────────────────────┘
5. User taps "Upload"
6. Documents upload successfully
7. Success message appears
```

### Flow 2: Individual File Too Large
```
1. User clicks "Upload Documents"
2. Selects 2 files:
   - large_document.pdf (15 MB) ❌
   - photo.jpg (2 MB) ✅
3. System validates:
   ❌ large_document.pdf > 10 MB
4. Error dialog shows:
   ┌──────────────────────────────────┐
   │ Files Too Large                  │
   │                                  │
   │ The following files exceed the   │
   │ 10 MB limit:                     │
   │                                  │
   │ large_document.pdf (15 MB)       │
   │                                  │
   │ Please compress or resize these  │
   │ files and try again.             │
   │                                  │
   │            [OK]                  │
   └──────────────────────────────────┘
5. User taps OK
6. Upload cancelled
7. User compresses file and tries again
```

### Flow 3: Total Size Too Large
```
1. User clicks "Upload Documents"
2. Selects 6 files:
   - doc1.pdf (9 MB)
   - doc2.pdf (9 MB)
   - doc3.pdf (9 MB)
   - doc4.pdf (9 MB)
   - doc5.pdf (9 MB)
   - doc6.pdf (9 MB)
3. System validates:
   ✅ All files < 10 MB individually
   ❌ Total (54 MB) > 50 MB
4. Error dialog shows:
   ┌──────────────────────────────────┐
   │ Total Size Too Large             │
   │                                  │
   │ Total size: 54 MB                │
   │ Maximum allowed: 50 MB           │
   │                                  │
   │ Please select fewer files or     │
   │ compress them.                   │
   │                                  │
   │            [OK]                  │
   └──────────────────────────────────┘
5. User taps OK
6. Upload cancelled
7. User selects fewer files
```

### Flow 4: Mixed Valid and Invalid Files
```
1. User selects 4 files:
   - doc1.pdf (8 MB) ✅
   - huge_file.pdf (20 MB) ❌
   - photo1.jpg (3 MB) ✅
   - massive.pdf (50 MB) ❌
2. System validates:
   ❌ 2 files exceed limit
3. Error dialog shows:
   ┌──────────────────────────────────┐
   │ Files Too Large                  │
   │                                  │
   │ The following files exceed the   │
   │ 10 MB limit:                     │
   │                                  │
   │ huge_file.pdf (20 MB)            │
   │ massive.pdf (50 MB)              │
   │                                  │
   │ Please compress or resize these  │
   │ files and try again.             │
   │                                  │
   │            [OK]                  │
   └──────────────────────────────────┘
4. Upload cancelled (all files rejected)
5. User removes oversized files
```

## Error Messages

### Individual File Too Large
```
Title: Files Too Large

Message:
The following files exceed the 10 MB limit:

[filename1] ([size])
[filename2] ([size])

Please compress or resize these files and try again.

Button: [OK]
```

### Total Size Too Large
```
Title: Total Size Too Large

Message:
Total size: [actual size]
Maximum allowed: 50 MB

Please select fewer files or compress them.

Button: [OK]
```

### Upload Confirmation
```
Title: Upload Documents

Message:
[N] document(s) selected:

1. [filename1] ([size])
2. [filename2] ([size])
3. [filename3] ([size])

Total: [total size]

Proceed with upload?

Buttons: [Cancel] [Upload]
```

## Benefits

### For Barangay Officials
✅ Prevents upload failures due to large files
✅ Faster uploads with size restrictions
✅ Better control over storage usage
✅ Clear feedback before uploading
✅ Professional document management

### For the System
✅ Prevents server overload
✅ Optimizes storage space
✅ Reduces bandwidth usage
✅ Improves performance
✅ Better error handling

### For Users
✅ Know file sizes before uploading
✅ Clear error messages with solutions
✅ No wasted time on failed uploads
✅ Better upload experience
✅ Transparency in file handling

## File Size Recommendations

### PDFs
- **Recommended:** < 5 MB
- **Maximum:** 10 MB
- **Compression:** Use PDF compression tools
- **Tip:** Reduce image quality in PDF for smaller size

### Images
- **Recommended:** < 2 MB
- **Maximum:** 10 MB
- **Compression:** JPEG quality 80-85%
- **Resolution:** 1920x1080 usually sufficient

### Multiple Files
- **Recommended:** 2-5 files per upload
- **Maximum:** Limited by 50 MB total
- **Tip:** Upload in batches if many files

## File Compression Tips

### For PDFs
1. **Online Tools:**
   - SmallPDF
   - iLovePDF
   - PDF Compressor
2. **Adobe Acrobat:** "Reduce File Size" option
3. **Preview (Mac):** Export with "Reduce File Size" filter
4. **Print to PDF:** Often creates smaller files

### For Images
1. **Online Tools:**
   - TinyPNG
   - Compressor.io
   - ImageOptim
2. **Photo Apps:** Export with lower quality (80-85%)
3. **Resize:** Reduce resolution if too large
4. **Format:** Convert PNG to JPEG for photos

## Technical Details

### Validation Timing
- **Pre-upload:** Validates before API call
- **Client-side:** No server resources used
- **Immediate:** User gets instant feedback
- **Efficient:** No bandwidth wasted

### File Size Detection
```typescript
const fileSize = asset.size || 0;
```
- Uses `size` property from DocumentPicker
- Fallback to 0 if size unavailable
- Size in bytes for precise calculations

### Memory Considerations
- **Validation only:** Doesn't load file content
- **Metadata only:** Uses file size property
- **Efficient:** No memory overhead
- **Fast:** Instant validation

## Files Modified

### `app/(brgy)/complaints.tsx`
**Added:**
- ✅ `formatFileSize()` helper function
- ✅ File size validation logic
- ✅ Oversized file detection
- ✅ Total size validation
- ✅ Enhanced upload confirmation
- ✅ Detailed error messages

## Constants Reference

```typescript
// File size limits
const MAX_FILE_SIZE = 10 * 1024 * 1024;      // 10 MB
const MAX_TOTAL_SIZE = 50 * 1024 * 1024;     // 50 MB

// File size units
const k = 1024;                               // Kilobyte
const sizes = ['Bytes', 'KB', 'MB', 'GB'];    // Size labels
```

## Testing Checklist

### Size Validation
- [x] Upload file < 10 MB → Success
- [x] Upload file = 10 MB → Success
- [x] Upload file > 10 MB → Rejected with message
- [x] Upload multiple files < 50 MB total → Success
- [x] Upload multiple files > 50 MB total → Rejected with message

### Error Messages
- [x] Individual file too large → Shows filename and size
- [x] Multiple files too large → Lists all oversized files
- [x] Total size too large → Shows actual and max size
- [x] All messages have clear instructions

### User Experience
- [x] File sizes displayed in readable format
- [x] Confirmation shows all file details
- [x] Cancel option available
- [x] Upload only proceeds after confirmation
- [x] Success message after upload

### Edge Cases
- [x] File size = 0 → Shows "0 Bytes"
- [x] File without size property → Treated as 0
- [x] All files rejected → Clear error message
- [x] Mix of valid/invalid → Only invalid listed

## Security Considerations

### Client-Side Validation
✅ Prevents large uploads before server
✅ Reduces server load and bandwidth
✅ Protects against accidental large uploads
⚠️ Server should also validate (defense in depth)

### Recommendations
1. Add server-side validation as backup
2. Set storage quotas per user
3. Monitor total storage usage
4. Implement file scanning for safety

## Future Enhancements (Optional)

1. **Dynamic Limits:** Adjust based on user role or plan
2. **Progress Bar:** Show upload progress for large files
3. **Background Upload:** Upload while user continues working
4. **Compression:** Auto-compress files before upload
5. **Batch Upload:** Upload multiple batches automatically
6. **Storage Quota:** Show user's remaining storage
7. **File Preview:** Thumbnail preview before upload
8. **Retry Logic:** Auto-retry failed uploads
9. **Resume Upload:** Resume interrupted uploads
10. **Cloud Integration:** Direct upload to cloud storage

## Performance Impact

### Before Validation
- ⏱️ User uploads 50 MB file
- 📤 Takes 2-3 minutes
- ❌ Server rejects (too large)
- 😞 User frustrated

### After Validation
- ⚡ Instant validation (< 1 second)
- 🚫 Rejected before upload
- 💡 Clear guidance provided
- 😊 User knows what to do

## Best Practices Implemented

1. ✅ **Early Validation:** Check before network call
2. ✅ **Clear Messages:** Tell user what's wrong and how to fix
3. ✅ **Show Sizes:** Transparency builds trust
4. ✅ **Confirm Before Upload:** Let user review
5. ✅ **Graceful Errors:** Never crash, always inform
6. ✅ **Helpful Guidance:** Suggest compression tools
7. ✅ **Consistent Formatting:** Same size format everywhere

---

**Status:** ✅ **COMPLETE AND FULLY FUNCTIONAL**
**Date:** 2026-01-16
**Impact:** High - Improves upload reliability and user experience
**Performance:** Instant validation with zero overhead
**User Experience:** Clear feedback with actionable guidance
