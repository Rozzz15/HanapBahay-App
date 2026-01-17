# Quick Backend Deployment Script for Railway
# This script helps you deploy your backend to Railway quickly

Write-Host "🚀 HanapBahay Backend Deployment to Railway" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Railway CLI is installed
Write-Host "Checking for Railway CLI..." -ForegroundColor Yellow
$railwayInstalled = $false
try {
    $railwayVersion = railway --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Railway CLI found: $railwayVersion" -ForegroundColor Green
        $railwayInstalled = $true
    }
} catch {
    Write-Host "⚠️  Railway CLI not found" -ForegroundColor Yellow
}

if (-not $railwayInstalled) {
    Write-Host ""
    Write-Host "📦 Installing Railway CLI..." -ForegroundColor Yellow
    Write-Host "Run this command to install Railway CLI:" -ForegroundColor Yellow
    Write-Host "  npm install -g @railway/cli" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Or visit: https://docs.railway.app/develop/cli" -ForegroundColor Yellow
    Write-Host ""
    
    $install = Read-Host "Do you want to install Railway CLI now? (y/N)"
    if ($install -eq "y" -or $install -eq "Y") {
        npm install -g @railway/cli
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Railway CLI installed!" -ForegroundColor Green
            $railwayInstalled = $true
        } else {
            Write-Host "❌ Failed to install Railway CLI" -ForegroundColor Red
            exit 1
        }
    } else {
        Write-Host ""
        Write-Host "📋 Manual Deployment Steps:" -ForegroundColor Cyan
        Write-Host "1. Go to https://railway.app" -ForegroundColor Yellow
        Write-Host "2. Sign up/Login with GitHub" -ForegroundColor Yellow
        Write-Host "3. Click 'New Project' → 'Deploy from GitHub repo'" -ForegroundColor Yellow
        Write-Host "4. Select your hanapbahay repository" -ForegroundColor Yellow
        Write-Host "5. In Settings → Root Directory: Set to 'server'" -ForegroundColor Yellow
        Write-Host "6. In Variables tab, add:" -ForegroundColor Yellow
        Write-Host "   - PAYMONGO_SECRET_KEY" -ForegroundColor Gray
        Write-Host "   - PAYMONGO_PUBLIC_KEY" -ForegroundColor Gray
        Write-Host "   - PORT=3000" -ForegroundColor Gray
        Write-Host "7. Generate domain in Settings → Networking" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "See scripts/deploy-backend-railway.md for detailed instructions" -ForegroundColor Cyan
        exit 0
    }
}

# Check if logged in
Write-Host ""
Write-Host "Checking Railway login status..." -ForegroundColor Yellow
$loginStatus = railway whoami 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Not logged in to Railway" -ForegroundColor Red
    Write-Host ""
    Write-Host "Logging in..." -ForegroundColor Yellow
    railway login
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to login" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "✅ Logged in: $loginStatus" -ForegroundColor Green
}

Write-Host ""
Write-Host "📋 Deployment Checklist:" -ForegroundColor Cyan
Write-Host "========================" -ForegroundColor Cyan
Write-Host ""

# Check if server directory exists
if (-not (Test-Path "server")) {
    Write-Host "❌ server/ directory not found!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ server/ directory exists" -ForegroundColor Green

# Check if package.json exists
if (-not (Test-Path "server/package.json")) {
    Write-Host "❌ server/package.json not found!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ server/package.json exists" -ForegroundColor Green

# Check if server.js exists
if (-not (Test-Path "server/server.js")) {
    Write-Host "❌ server/server.js not found!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ server/server.js exists" -ForegroundColor Green

Write-Host ""
Write-Host "🔧 Environment Variables:" -ForegroundColor Cyan
Write-Host "========================" -ForegroundColor Cyan
Write-Host ""
Write-Host "You'll need to set these in Railway dashboard:" -ForegroundColor Yellow
Write-Host "  - PAYMONGO_SECRET_KEY (from https://dashboard.paymongo.com)" -ForegroundColor Gray
Write-Host "  - PAYMONGO_PUBLIC_KEY (from https://dashboard.paymongo.com)" -ForegroundColor Gray
Write-Host "  - PORT=3000 (optional, Railway auto-assigns)" -ForegroundColor Gray
Write-Host ""

$hasKeys = Read-Host "Do you have PayMongo API keys ready? (y/N)"
if ($hasKeys -ne "y" -and $hasKeys -ne "Y") {
    Write-Host ""
    Write-Host "📝 Get PayMongo Keys:" -ForegroundColor Cyan
    Write-Host "1. Go to https://dashboard.paymongo.com" -ForegroundColor Yellow
    Write-Host "2. Sign up or log in" -ForegroundColor Yellow
    Write-Host "3. Navigate to Settings → API Keys" -ForegroundColor Yellow
    Write-Host "4. Copy your Secret Key and Public Key" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Press Enter when you have the keys..." -ForegroundColor Yellow
    Read-Host
}

Write-Host ""
Write-Host "🚀 Deploying to Railway..." -ForegroundColor Cyan
Write-Host ""

# Navigate to server directory
Push-Location server

# Check if Railway project exists
Write-Host "Checking for existing Railway project..." -ForegroundColor Yellow
$projectStatus = railway status 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "No existing Railway project found." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Creating new Railway project..." -ForegroundColor Yellow
    Write-Host "Follow the prompts to:" -ForegroundColor Yellow
    Write-Host "  1. Create a new project" -ForegroundColor Gray
    Write-Host "  2. Link to your GitHub repository" -ForegroundColor Gray
    Write-Host ""
    
    railway init
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to initialize Railway project" -ForegroundColor Red
        Pop-Location
        exit 1
    }
}

# Deploy
Write-Host ""
Write-Host "Deploying..." -ForegroundColor Yellow
railway up
if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Deployment initiated!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Next Steps:" -ForegroundColor Cyan
    Write-Host "1. Go to Railway dashboard: https://railway.app" -ForegroundColor Yellow
    Write-Host "2. Open your project → Service → Variables tab" -ForegroundColor Yellow
    Write-Host "3. Add environment variables:" -ForegroundColor Yellow
    Write-Host "   - PAYMONGO_SECRET_KEY" -ForegroundColor Gray
    Write-Host "   - PAYMONGO_PUBLIC_KEY" -ForegroundColor Gray
    Write-Host "   - PORT=3000" -ForegroundColor Gray
    Write-Host "4. Go to Settings → Networking → Generate Domain" -ForegroundColor Yellow
    Write-Host "5. Copy the generated URL" -ForegroundColor Yellow
    Write-Host "6. Update your frontend .env file with the new URL" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "🌐 Check deployment status:" -ForegroundColor Cyan
    Write-Host "   railway status" -ForegroundColor Gray
    Write-Host ""
    Write-Host "📊 View logs:" -ForegroundColor Cyan
    Write-Host "   railway logs" -ForegroundColor Gray
} else {
    Write-Host "❌ Deployment failed" -ForegroundColor Red
    Write-Host "Check the error messages above" -ForegroundColor Yellow
}

Pop-Location

Write-Host ""
Write-Host "✅ Script complete!" -ForegroundColor Green
