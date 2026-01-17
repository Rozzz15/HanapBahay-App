# 📱 Build APK for Your Phone - Guide

## 🎯 Current Status: Building...

Your APK is currently being built by Expo Application Services (EAS)!

---

## ⏳ What's Happening Now

The build process typically takes **10-20 minutes** and includes:

1. ✅ Compressing your project files
2. ⏳ Uploading to EAS Build servers
3. ⏳ Installing dependencies
4. ⏳ Building native Android code
5. ⏳ Creating APK file
6. ⏳ Running final checks
7. ⏳ Making APK available for download

**Current Step:** Compressing project files

---

## 📊 Build Configuration

**Profile:** Preview (APK build)  
**Platform:** Android  
**Build Type:** APK (installable directly)  
**Environment Variables:**
- ✅ EXPO_PUBLIC_API_URL: https://v-production-6704.up.railway.app
- ✅ EXPO_PUBLIC_SUPABASE_URL: https://dkrctrkqhunttrnkqzsu.supabase.co
- ✅ EXPO_PUBLIC_SUPABASE_ANON_KEY: Configured

---

## 🔍 Monitor Build Progress

### Option 1: In Terminal
The current terminal window will show live progress updates.

### Option 2: Web Dashboard
Visit: https://expo.dev/accounts/pogi123456/projects/hanapbahay/builds

You can:
- ✅ View build logs in real-time
- ✅ See build progress
- ✅ Download APK when complete

---

## 📥 After Build Completes

### You'll Get:

1. **Download Link** in the terminal
2. **QR Code** to scan with your phone
3. **Direct download URL**

### To Install on Your Phone:

**Method 1: QR Code (Easiest)**
1. Open camera app on your Android phone
2. Scan the QR code shown in terminal
3. Tap the notification to download APK
4. Allow installation from unknown sources (if prompted)
5. Install the app

**Method 2: Direct Download**
1. Copy the download URL from terminal
2. Open URL on your phone's browser
3. Download the APK file
4. Open Downloads and tap the APK
5. Install

**Method 3: Transfer via USB**
1. Download APK to your computer
2. Connect phone via USB
3. Copy APK to phone's Download folder
4. Use file manager on phone to find and install

---

## 🔐 Enable Unknown Sources

If your phone blocks the installation:

1. Go to **Settings** → **Security**
2. Enable **"Install unknown apps"** or **"Unknown sources"**
3. For your browser or file manager
4. Try installing again

---

## ⚠️ Build Commands Reference

**Preview Build (APK - for testing):**
```powershell
npx eas build --platform android --profile preview
```

**Production Build (AAB - for Play Store):**
```powershell
npx eas build --platform android --profile production
```

**iOS Build:**
```powershell
npx eas build --platform ios --profile production
```

---

## 🛠️ If Build Fails

**Common Issues:**

1. **Network Error**
   - Check internet connection
   - Try again: Same command as above

2. **Credentials Error**
   - Run: `eas login`
   - Re-run build command

3. **Build Failed**
   - Check build logs at expo.dev
   - Look for error messages
   - Fix errors in code
   - Re-run build

**Get Help:**
- Build logs: https://expo.dev
- Expo forums: https://forums.expo.dev
- Expo Discord: https://discord.gg/expo

---

## 📊 Build Status Commands

**Check build status:**
```powershell
eas build:list --platform android
```

**View specific build:**
```powershell
eas build:view [BUILD_ID]
```

**Download APK manually:**
```powershell
eas build:download --output=hanapbahay.apk
```

---

## ✅ After Installation

Once installed on your phone:

1. **Open the app**
2. **Test login/signup**
3. **Check all features:**
   - Property listings
   - Search functionality
   - Booking system
   - Payment (use test cards)
   - Messaging
   - Profile

4. **Test PayMongo payments:**
   - Use test card: `4123450131001381`
   - CVV: Any 3 digits
   - Expiry: Any future date

---

## 🎯 Expected APK Size

**Approximate size:** 60-100 MB

**Build time:** 10-20 minutes (depends on EAS server load)

---

## 📱 App Details

**App Name:** HanapBahay  
**Package:** com.hanapbahay.app  
**Version:** 1.0.0  
**Backend:** https://v-production-6704.up.railway.app  
**Database:** Supabase (Singapore)  
**Payments:** PayMongo (TEST mode)

---

## 🎉 Success Indicators

When build completes, you'll see:

```
✔ Build finished
  APK: https://expo.dev/artifacts/eas/[YOUR_APK_ID].apk
```

Plus a QR code for easy download!

---

## 📞 Quick Support

**Build taking too long?**
- Normal: 10-20 minutes
- Busy times: Up to 30 minutes
- Check: https://status.expo.dev

**Build failed?**
- Check logs at expo.dev
- Review error messages
- Fix code issues
- Rebuild

---

**Started:** 2026-01-13 00:14:17 +08:00  
**Expected Completion:** ~00:30:00 +08:00  
**Status:** In Progress...

🚀 **Your APK will be ready soon!**
