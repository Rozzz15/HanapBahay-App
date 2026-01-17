#!/bin/bash
# Build APK with Cloud Backend
# This script ensures the APK uses the cloud backend and names it Hanapbahay.apk

echo "🔧 Building APK with Cloud Backend..."
echo ""

# Step 1: Ensure .env has cloud backend
echo "1️⃣ Checking .env configuration..."
node scripts/ensure-cloud-backend.js

# Step 1b: Verify constants file has cloud backend as default
echo ""
echo "1️⃣ Verifying constants file..."
if [ -f "constants/index.ts" ]; then
    if grep -q "https://web-production-e66fb.up.railway.app" "constants/index.ts"; then
        echo "   ✅ Constants file has cloud backend URL"
    else
        echo "   ⚠️  WARNING: Constants file may not have cloud backend URL!"
    fi
else
    echo "   ⚠️  WARNING: Constants file not found!"
fi

# Step 2: Build the APK
echo ""
echo "2️⃣ Building release APK..."
echo "   This may take 5-10 minutes..."

cd android
./gradlew assembleRelease

if [ $? -ne 0 ]; then
    echo "   ❌ Build failed!"
    cd ..
    exit 1
fi

cd ..

# Step 3: Find and rename the APK
echo ""
echo "3️⃣ Locating APK file..."

APK_PATH="android/app/build/outputs/apk/release"
TARGET_APK="$APK_PATH/Hanapbahay.apk"

# Remove old Hanapbahay.apk if exists
if [ -f "$TARGET_APK" ]; then
    rm -f "$TARGET_APK"
    echo "   🗑️  Removed old Hanapbahay.apk"
fi

# Find the release APK (usually app-release.apk)
RELEASE_APK=$(find "$APK_PATH" -name "*release*.apk" ! -name "*unaligned*" | head -n 1)

if [ -z "$RELEASE_APK" ]; then
    RELEASE_APK=$(find "$APK_PATH" -name "*.apk" | head -n 1)
fi

if [ -n "$RELEASE_APK" ]; then
    cp "$RELEASE_APK" "$TARGET_APK"
    echo "   ✅ APK renamed to: Hanapbahay.apk"
    echo ""
    echo "📱 APK Location:"
    echo "   $TARGET_APK"
    echo ""
    echo "✅ Build complete! Your APK uses cloud backend:"
    echo "   https://web-production-e66fb.up.railway.app"
else
    echo "   ❌ Could not find release APK"
    exit 1
fi


