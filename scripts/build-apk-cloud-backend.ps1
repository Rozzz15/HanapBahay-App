# Build APK with Cloud Backend
# This script ensures the APK uses the cloud backend and names it Hanapbahay.apk

Write-Host "[BUILD] Building APK with Cloud Backend..." -ForegroundColor Cyan
Write-Host ""

# Step 1: Ensure .env has cloud backend
Write-Host "[1/3] Checking .env configuration..." -ForegroundColor Yellow
node scripts/ensure-cloud-backend.js

# Step 1b: Verify constants file has cloud backend as default
Write-Host ""
Write-Host "[1/3] Verifying constants file..." -ForegroundColor Yellow
$constantsFile = "constants\index.ts"
if (Test-Path $constantsFile) {
    $constantsContent = Get-Content $constantsFile -Raw
    if ($constantsContent -match "https://web-production-e66fb\.up\.railway\.app") {
        Write-Host "   [OK] Constants file has cloud backend URL" -ForegroundColor Green
    } else {
        Write-Host "   [WARNING] Constants file may not have cloud backend URL!" -ForegroundColor Yellow
    }
} else {
    Write-Host "   [WARNING] Constants file not found!" -ForegroundColor Yellow
}

# Step 2: Build the APK
Write-Host ""
Write-Host "[2/3] Building release APK..." -ForegroundColor Yellow
Write-Host "   This may take 5-10 minutes..." -ForegroundColor Gray

$buildOutput = ""
try {
    Push-Location android
    $buildOutput = .\gradlew assembleRelease 2>&1 | Out-String
    Pop-Location
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   [SUCCESS] Build successful!" -ForegroundColor Green
    } else {
        Write-Host "   [ERROR] Build failed!" -ForegroundColor Red
        Write-Host $buildOutput
        exit 1
    }
} catch {
    Write-Host "   [ERROR] Build error: $_" -ForegroundColor Red
    Pop-Location
    exit 1
}

# Step 3: Find and rename the APK
Write-Host ""
Write-Host "[3/3] Locating APK file..." -ForegroundColor Yellow

$apkPath = "android\app\build\outputs\apk\release"
$apkFiles = Get-ChildItem -Path $apkPath -Filter "*.apk" -ErrorAction SilentlyContinue

if ($apkFiles.Count -eq 0) {
    Write-Host "   [ERROR] No APK file found in $apkPath" -ForegroundColor Red
    exit 1
}

# Remove old Hanapbahay.apk if exists
$targetApk = Join-Path $apkPath "Hanapbahay.apk"
if (Test-Path $targetApk) {
    Remove-Item $targetApk -Force
    Write-Host "   [REMOVED] Removed old Hanapbahay.apk" -ForegroundColor Gray
}

# Find the release APK (usually app-release.apk)
$releaseApk = $apkFiles | Where-Object { $_.Name -like "*release*.apk" -and $_.Name -notlike "*unaligned*" } | Select-Object -First 1

if (-not $releaseApk) {
    $releaseApk = $apkFiles | Select-Object -First 1
}

if ($releaseApk) {
    $sourcePath = $releaseApk.FullName
    Copy-Item $sourcePath $targetApk -Force
    Write-Host "   [SUCCESS] APK renamed to: Hanapbahay.apk" -ForegroundColor Green
    Write-Host ""
    Write-Host "[APK] APK Location:" -ForegroundColor Cyan
    Write-Host "   $targetApk" -ForegroundColor White
    Write-Host ""
    Write-Host "[SUCCESS] Build complete! Your APK uses cloud backend:" -ForegroundColor Green
    Write-Host "   https://web-production-e66fb.up.railway.app" -ForegroundColor Cyan
} else {
    Write-Host "   [ERROR] Could not find release APK" -ForegroundColor Red
    exit 1
}


