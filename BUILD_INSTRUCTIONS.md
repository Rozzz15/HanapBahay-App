# HanapBahay - Build Instructions for APK & IPA

## Prerequisites

### 1. Install Required Tools

```powershell
# Install Node.js (if not already installed)
# Download from: https://nodejs.org/

# Install Expo CLI globally
npm install -g expo-cli

# Install EAS CLI globally
npm install -g eas-cli

# Verify installations
expo --version
eas --version
```

### 2. Create Expo Account
- Go to https://expo.dev/signup
- Create a free account
- Remember your credentials

### 3. Login to Expo

```powershell
cd Desktop/hanapbahay
eas login
# Enter your Expo credentials
```

## 🤖 Building Android APK

### Option 1: Preview APK (For Testing - No Google Play Store)

This creates an APK you can directly install on Android devices.

```powershell
cd Desktop/hanapbahay

# Build preview APK
eas build --profile preview --platform android

# Wait for build to complete (10-20 minutes)
# You'll get a download link when done
```

**Download & Install:**
1. Open the link in your browser
2. Download the APK file
3. Transfer to Android device
4. Enable "Install from Unknown Sources"
5. Install the APK

### Option 2: Production Build (For Google Play Store)

```powershell
cd Desktop/hanapbahay

# Build production AAB
eas build --profile production --platform android

# This creates an AAB file for Google Play Store upload
```

## 🍎 Building iOS IPA

**⚠️ Requirements:**
- Apple Developer Account ($99/year)
- Mac computer (for app store submission)

### Option 1: Development Build (For Testing)

```powershell
cd Desktop/hanapbahay

# Configure iOS credentials
eas credentials

# Build for development
eas build --profile preview --platform ios

# Wait for build to complete
```

**Install on iOS Device:**
1. Download IPA from Expo dashboard
2. Use TestFlight or install directly
3. Requires device UDID registered

### Option 2: Production Build (For App Store)

```powershell
cd Desktop/hanapbahay

# Build for App Store
eas build --profile production --platform ios
```

## 🚀 Quick Start - Build Both Platforms

```powershell
cd Desktop/hanapbahay

# Build Android APK + iOS IPA simultaneously
eas build --profile preview --platform all

# Or for production
eas build --profile production --platform all
```

## 📦 What Happens During Build

1. **Upload Project** - Code is uploaded to Expo servers
2. **Install Dependencies** - npm packages are installed
3. **Compile Native Code** - Android/iOS native code is compiled
4. **Bundle Assets** - Images, fonts, etc. are bundled
5. **Sign App** - App is signed with certificates
6. **Build Complete** - Download link provided

**Build Time:** 10-30 minutes per platform

## 💾 Downloading Your Builds

### Via Command Line
```powershell
# List all builds
eas build:list

# Download specific build
eas build:download --id <BUILD_ID>
```

### Via Web Dashboard
1. Go to https://expo.dev/accounts/rozzz15/projects/hanapbahay/builds
2. Click on completed build
3. Click "Download" button

## 🔧 Troubleshooting Common Issues

### Issue: "Not logged in"
```powershell
eas login
# Or
eas logout
eas login
```

### Issue: "No valid credentials found"
```powershell
eas credentials
# Follow prompts to set up credentials
```

### Issue: Build fails with "Out of memory"
- This is rare but can happen
- Retry the build: `eas build --profile preview --platform android`

### Issue: Android build works but iOS fails
- iOS requires Apple Developer Account
- Must configure signing certificates
- May need to add device UDIDs

## 📱 Installing APK on Android

### Method 1: Direct Install
1. Download APK to device
2. Tap the APK file
3. Enable "Install Unknown Apps" if prompted
4. Tap "Install"

### Method 2: ADB Install (via USB)
```powershell
# Enable USB debugging on Android device
# Connect device via USB

# Install via ADB
adb install path/to/hanapbahay.apk
```

## 🍎 Installing IPA on iOS

### Method 1: TestFlight (Recommended)
1. Submit to App Store Connect
2. Add internal testers
3. Testers install via TestFlight app

### Method 2: Direct Install (Development)
1. Register device UDID with Apple
2. Build with device included
3. Install via Xcode or third-party tools

## 🎯 Production Deployment

### Android (Google Play Store)
1. Build AAB: `eas build --profile production --platform android`
2. Go to Google Play Console
3. Create app listing
4. Upload AAB file
5. Fill in store listing
6. Submit for review

### iOS (App Store)
1. Build IPA: `eas build --profile production --platform ios`
2. Upload to App Store Connect
3. Create app listing
4. Submit for review
5. Wait for Apple approval (1-3 days)

## 📊 Monitoring Builds

### Check Build Status
```powershell
# View current builds
eas build:list

# View specific build details
eas build:view <BUILD_ID>

# Cancel a running build
eas build:cancel <BUILD_ID>
```

### Build Dashboard
- Web: https://expo.dev/accounts/rozzz15/projects/hanapbahay/builds
- Shows all builds, status, logs, and download links

## ⚙️ Advanced Configuration

### Custom Build Configuration

Edit `eas.json` for custom builds:

```json
{
  "build": {
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk",
        "gradleCommand": ":app:assembleRelease"
      }
    },
    "production": {
      "android": {
        "buildType": "app-bundle"
      }
    }
  }
}
```

### Environment Variables for Builds

Create `.env.production`:
```
EXPO_PUBLIC_SUPABASE_URL=your_production_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_production_key
```

Load in build:
```json
{
  "build": {
    "production": {
      "env": {
        "EXPO_PUBLIC_SUPABASE_URL": "$EXPO_PUBLIC_SUPABASE_URL"
      }
    }
  }
}
```

## 🎉 Summary - Quick Commands

```powershell
# Setup (one time)
npm install -g eas-cli
eas login

# Build Android APK (testing)
cd Desktop/hanapbahay
eas build --profile preview --platform android

# Build iOS IPA (testing - requires Apple account)
eas build --profile preview --platform ios

# Build both
eas build --profile preview --platform all

# Check builds
eas build:list

# Download when ready
eas build:download --id <BUILD_ID>
```

## 📞 Need Help?

- Expo Documentation: https://docs.expo.dev/build/setup/
- Expo Discord: https://chat.expo.dev/
- EAS Build Docs: https://docs.expo.dev/build/introduction/

---

**Ready to build?** Start with Android APK using preview profile!
