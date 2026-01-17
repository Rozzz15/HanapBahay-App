# Step-by-Step Backend Deployment Script
# Run this script to deploy your backend to Railway

Write-Host "HanapBahay Backend Deployment" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check Railway CLI
Write-Host "Step 1: Checking Railway CLI..." -ForegroundColor Yellow
$railwayVersion = railway --version 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] Railway CLI installed: $railwayVersion" -ForegroundColor Green
} else {
    Write-Host "[ERROR] Railway CLI not found. Installing..." -ForegroundColor Red
    npm install -g @railway/cli
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERROR] Failed to install Railway CLI" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "Step 2: Checking Railway login..." -ForegroundColor Yellow
$loginStatus = railway whoami 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "[WARN] Not logged in to Railway" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Please login to Railway:" -ForegroundColor Cyan
    Write-Host "  railway login" -ForegroundColor White
    Write-Host ""
    Write-Host "This will open a browser for authentication." -ForegroundColor Gray
    Write-Host "Press Enter after you've logged in..." -ForegroundColor Yellow
    Read-Host
    
    # Verify login
    $loginCheck = railway whoami 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERROR] Still not logged in. Please run 'railway login' manually." -ForegroundColor Red
        exit 1
    }
    Write-Host "[OK] Logged in as: $loginCheck" -ForegroundColor Green
} else {
    Write-Host "[OK] Logged in as: $loginStatus" -ForegroundColor Green
}

Write-Host ""
Write-Host "Step 3: Preparing server directory..." -ForegroundColor Yellow
Push-Location server

# Check if package.json exists
if (-not (Test-Path "package.json")) {
    Write-Host "[ERROR] package.json not found in server directory!" -ForegroundColor Red
    Pop-Location
    exit 1
}
Write-Host "[OK] Server files ready" -ForegroundColor Green

Write-Host ""
Write-Host "Step 4: Initializing Railway project..." -ForegroundColor Yellow
Write-Host "If this is your first time, Railway will ask you to:" -ForegroundColor Gray
Write-Host "  - Create a new project or link to existing" -ForegroundColor Gray
Write-Host "  - Link to GitHub repository" -ForegroundColor Gray
Write-Host ""

# Check if already linked
$projectStatus = railway status 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "No Railway project found. Initializing..." -ForegroundColor Yellow
    railway init
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERROR] Failed to initialize Railway project" -ForegroundColor Red
        Pop-Location
        exit 1
    }
} else {
    Write-Host "[OK] Railway project already linked" -ForegroundColor Green
}

Write-Host ""
Write-Host "Step 5: Setting environment variables..." -ForegroundColor Yellow
Write-Host ""
Write-Host "You need to set these environment variables:" -ForegroundColor Cyan
Write-Host "  - PAYMONGO_SECRET_KEY" -ForegroundColor White
Write-Host "  - PAYMONGO_PUBLIC_KEY" -ForegroundColor White
Write-Host "  - PORT=3000" -ForegroundColor White
Write-Host ""

$hasKeys = Read-Host "Do you have PayMongo API keys ready? (y/N)"
if ($hasKeys -eq "y" -or $hasKeys -eq "Y") {
    Write-Host ""
    Write-Host "Enter your PayMongo Secret Key (starts with sk_test_ or sk_live_):" -ForegroundColor Yellow
    $secretKey = Read-Host
    if ($secretKey) {
        railway variables set PAYMONGO_SECRET_KEY=$secretKey
        Write-Host "[OK] PAYMONGO_SECRET_KEY set" -ForegroundColor Green
    }
    
    Write-Host ""
    Write-Host "Enter your PayMongo Public Key (starts with pk_test_ or pk_live_):" -ForegroundColor Yellow
    $publicKey = Read-Host
    if ($publicKey) {
        railway variables set PAYMONGO_PUBLIC_KEY=$publicKey
        Write-Host "[OK] PAYMONGO_PUBLIC_KEY set" -ForegroundColor Green
    }
    
    Write-Host ""
    railway variables set PORT=3000
    Write-Host "[OK] PORT set to 3000" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "[WARN] Skipping environment variables setup" -ForegroundColor Yellow
    Write-Host "You can set them later in Railway dashboard:" -ForegroundColor Gray
    Write-Host "  - Go to your project → Variables tab" -ForegroundColor Gray
    Write-Host "  - Add PAYMONGO_SECRET_KEY, PAYMONGO_PUBLIC_KEY, PORT=3000" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Get PayMongo keys from: https://dashboard.paymongo.com/settings/api-keys" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "Step 6: Deploying to Railway..." -ForegroundColor Yellow
railway up
if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "[OK] Deployment initiated!" -ForegroundColor Green
} else {
    Write-Host "[ERROR] Deployment failed. Check the error messages above." -ForegroundColor Red
    Pop-Location
    exit 1
}

Write-Host ""
Write-Host "Step 7: Generating domain..." -ForegroundColor Yellow
$domainOutput = railway domain 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] Domain generated!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Your backend URL:" -ForegroundColor Cyan
    Write-Host $domainOutput -ForegroundColor White
    Write-Host ""
} else {
    Write-Host "[WARN] Could not generate domain automatically" -ForegroundColor Yellow
    Write-Host "Generate domain manually in Railway dashboard:" -ForegroundColor Gray
    Write-Host "  Settings → Networking → Generate Domain" -ForegroundColor Gray
}

Pop-Location

Write-Host ""
Write-Host "[DONE] Deployment Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "1. Get your backend URL from Railway dashboard" -ForegroundColor Yellow
Write-Host "2. Test: https://your-url.railway.app/health" -ForegroundColor Yellow
Write-Host "3. Update .env file with the new URL" -ForegroundColor Yellow
Write-Host "4. Update eas.json with the new URL" -ForegroundColor Yellow
Write-Host ""
Write-Host "[OK] Your backend is now live!" -ForegroundColor Green
