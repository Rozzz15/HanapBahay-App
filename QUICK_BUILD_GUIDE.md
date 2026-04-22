# 🚀 Quick Build Guide - HanapBahay App

## ⚡ Fast Track to APK/IPA (5 Steps)

### Step 1: Install EAS CLI (One-time setup)

Open PowerShell as Administrator and run:

```powershell
npm install -g eas-cli
```

Wait for installation to complete (~1 minute).

Verify installation:
```powershell
eas --version
```

Should show version number (e.g., `13.2.0`).

---

### Step 2: Login to Expo

```powershell
cd Desktop/hanapbahay
eas login
```

**If you don't have an Expo account:**
1. Go to https://expo.dev/signup
2. Create free account
3. Then run `eas login` again

---

### Step 3: Build Android APK

```powershell
cd Desktop/hanapbahay
eas build --profile preview --platform android
```

**What happens:**
1. Uploads your code to Expo servers (2-3 minutes)
2. Builds the APK (10-20 minutes)
3. Gives you a download link

**Console output:**
```
✔ Build finished successfully
Build artifact: https://expo.dev/artifacts/...
APK: https://expo.dev/artifacts/...apk
```

---

### Step 4: Download APK

**Option A: Click the link in console**
- Copy the APK link from console
- Paste in browser
- Download the APK file

**Option B: Use Expo website**
1. Go to https://expo.dev/
2. Login
3. Go to Projects → hanapbahay → Builds
4. Click on latest build
5. Download APK

---

### Step 5: Install on Android

**Transfer APK to Android device:**
1. Via USB cable: Copy APK to phone
2. Via cloud: Upload to Google Drive, download on phone
3. Via email: Email APK to yourself

**Install APK:**
1. Open APK file on Android
2. Tap "Install"
3. If prompted, enable "Install from Unknown Sources"
4. Wait for installation
5. Open app!

---

## 🍎 Build iOS IPA (Requires Apple Developer Account)

**Prerequisites:**
- Apple Developer Account ($99/year)
- Mac computer (recommended)

```powershell
cd Desktop/hanapbahay
eas build --profile preview --platform ios
```

**Note:** iOS builds require more setup (certificates, provisioning profiles).
Follow the interactive prompts from EAS CLI.

---

## 🎯 Build Both Platforms

```powershell
cd Desktop/hanapbahay
eas build --profile preview --platform all
```

This builds Android APK and iOS IPA simultaneously.

---

## 📱 Alternative: Build via Expo Website

1. Go to https://expo.dev/
2. Login
3. Go to Projects → hanapbahay
4. Click "Builds" tab
5. Click "Create a build"
6. Select platform (Android/iOS)
7. Select profile (preview)
8. Click "Build"

---

## 🔧 Troubleshooting

### Error: "Command not found: eas"
**Solution:** Install EAS CLI:
```powershell
npm install -g eas-cli
```

### Error: "Not logged in"
**Solution:**
```powershell
eas logout
eas login
```

### Error: "No valid credentials"
**Solution:** Let EAS generate credentials:
```powershell
eas credentials
# Select "Android" → "Generate new credentials"
```

### Build stuck or failed?
**Solution:** Try again:
```powershell
eas build --profile preview --platform android --clear-cache
```

---

## ⏱️ Build Time Expectations

| Platform | Profile | Time | Output |
|----------|---------|------|--------|
| Android | Preview | 10-20 min | APK file (ready to install) |
| Android | Production | 15-25 min | AAB file (for Play Store) |
| iOS | Preview | 15-30 min | IPA file |
| iOS | Production | 20-35 min | IPA file (for App Store) |

---

## 📊 Monitor Build Progress

### In Console
```powershell
# Check build status
eas build:list

# View specific build
eas build:view <BUILD_ID>

# Cancel build
eas build:cancel
```

### In Browser
Go to: https://expo.dev/accounts/rozzz15/projects/hanapbahay/builds

---

## 🎉 Success Checklist

After building:
- [ ] Downloaded APK/IPA file
- [ ] Installed on device
- [ ] App launches successfully
- [ ] Can login with test account
- [ ] Basic features work (browse, chat, etc.)

---

## 🚀 Ready to Deploy to Stores?

### Google Play Store (Android)
1. Build production: `eas build --profile production --platform android`
2. Creates AAB file (not APK)
3. Go to Google Play Console
4. Upload AAB
5. Fill store listing
6. Submit for review

### Apple App Store (iOS)
1. Build production: `eas build --profile production --platform ios`
2. Upload to App Store Connect
3. Fill store listing
4. Submit for review
5. Wait for Apple approval (1-3 days)

---

## 💡 Pro Tips

1. **First build takes longer** (~20-30 min) - subsequent builds are faster
2. **Use preview profile for testing** - creates APK you can install directly
3. **Use production profile for stores** - creates optimized AAB/IPA
4. **Keep EAS CLI updated**: `npm install -g eas-cli@latest`
5. **Monitor builds on website** - easier to track multiple builds

---

## 📞 Need Help?

- **Expo Documentation**: https://docs.expo.dev/build/setup/
- **Build Issues**: https://docs.expo.dev/build-reference/troubleshooting/
- **Expo Discord**: https://chat.expo.dev/

---

**Ready to build? Run this command:**

```powershell
cd Desktop/hanapbahay
eas build --profile preview --platform android
```

🎉 Your APK will be ready in 10-20 minutes!
