# HanapBahay APK Build - Final Guide

## ✅ Pre-Build Checks Completed

### Configuration Status:
- ✅ EAS CLI installed (v16.28.0)
- ✅ Logged in as: rozzz15
- ✅ Expo project configured
- ✅ Supabase credentials configured
- ✅ Critical lint error fixed (duplicate marginTop)
- ✅ App.json properly configured
- ✅ EAS.json build profiles ready
- ✅ Android package: com.hanapbahay.app
- ✅ No critical errors in codebase

### App Information:
- **Name:** HanapBahay
- **Version:** 1.0.0
- **Package:** com.hanapbahay.app
- **Platform:** Android (APK)
- **Build Profile:** Preview (for testing/distribution)

## 🚀 Building the APK

### Command to Run:
```bash
cd C:\Users\Admin\Desktop\hanapbahay
eas build --profile preview --platform android
```

### What Will Happen:
1. ✅ Compress project files
2. ✅ Upload to EAS Build servers
3. ✅ Install dependencies
4. ✅ Build native Android code
5. ✅ Create APK file
6. ✅ Provide download link

### Build Time:
- **Estimated:** 10-20 minutes
- **Status:** Can be monitored at https://expo.dev/accounts/rozzz15/projects/hanapbahay/builds

## 📥 After Build Completes

### Download APK:
1. Build will complete with a download link
2. Download the APK file to your computer
3. Transfer to your Android phone via:
   - USB cable
   - Email attachment
   - Cloud storage (Google Drive, Dropbox)
   - Direct download on phone

### Install APK on Phone:
1. **Enable Unknown Sources:**
   - Go to Settings → Security
   - Enable "Install unknown apps" or "Unknown sources"
   
2. **Install:**
   - Tap the APK file
   - Click "Install"
   - Wait for installation to complete
   - Click "Open" to launch

## 🧪 Testing Checklist After Installation

### Critical Features to Test:
- [ ] App opens successfully
- [ ] Login works (test with owner/tenant/brgy account)
- [ ] Profile editing works
- [ ] Email change works (with confirmation)
- [ ] Property listing creation
- [ ] Photo/video upload
- [ ] Chat functionality
- [ ] Booking process
- [ ] Payment integration (if configured)

### Known Behaviors:
- ✅ Email changes require confirmation email
- ✅ Rate limit on email changes (60 seconds)
- ✅ Supabase Auth properly integrated
- ✅ Chat performance optimized

## 📱 Distribution Options

### Option 1: Direct Install (Testing)
- Share APK file directly with testers
- Install manually on devices
- Good for: Internal testing, beta testers

### Option 2: Google Play Console (Production)
- Upload to Google Play for review
- Publish to Play Store
- Good for: Public release
- **Requires:** Google Play Developer account ($25 one-time fee)

### Option 3: Internal Testing Track
- Upload to Google Play Internal Testing
- Share link with specific testers
- Good for: Closed beta testing

## 🔧 Build Profiles Explained

### Preview (Current):
- **Type:** APK
- **Purpose:** Testing and direct distribution
- **Size:** Larger file size
- **Installation:** Manual (sideload)

### Production:
- **Type:** AAB (Android App Bundle)
- **Purpose:** Google Play Store submission
- **Size:** Optimized
- **Installation:** Through Play Store

## 🎯 Next Steps After APK Build

1. **Download the APK** from build completion link
2. **Install on test devices** 
3. **Test all critical features**
4. **Gather feedback** from testers
5. **Fix any issues** found
6. **Rebuild if needed** with fixes
7. **Deploy to production** when ready

## 📊 Build Monitoring

### Check Build Status:
```bash
eas build:list
```

### View Build Details:
- Web Dashboard: https://expo.dev/accounts/rozzz15/projects/hanapbahay
- Email notifications when build completes

## ⚠️ Troubleshooting

### Build Fails:
- Check build logs in Expo dashboard
- Verify all dependencies are installed
- Ensure .env file is not causing issues
- Check for syntax errors

### APK Won't Install:
- Verify "Unknown sources" is enabled
- Check phone has enough storage
- Try uninstalling old version first

### App Crashes on Launch:
- Check Supabase credentials are correct
- Verify internet connection
- Review crash logs if available

## 🔐 Environment Variables

These are already configured in `app.json`:
- ✅ SUPABASE_URL
- ✅ SUPABASE_ANON_KEY

For production, ensure these are valid production credentials.

## 📝 Version Management

### Current Version: 1.0.0

To update version for future builds:
1. Edit `app.json`:
   - Change `version` field
   - Increment `android.versionCode`
2. Rebuild APK

---

**Ready to build!** Run the command above to start the APK build process.
