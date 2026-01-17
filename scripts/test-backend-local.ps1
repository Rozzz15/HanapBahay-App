# Test Backend Server Locally Before Deployment
# This script helps you verify your backend works before deploying

Write-Host "🧪 Testing Backend Server Locally" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

# Check if server directory exists
if (-not (Test-Path "server")) {
    Write-Host "❌ server/ directory not found!" -ForegroundColor Red
    Write-Host "Run this script from the project root directory" -ForegroundColor Yellow
    exit 1
}

# Check if dependencies are installed
if (-not (Test-Path "server/node_modules")) {
    Write-Host "⚠️  Dependencies not installed" -ForegroundColor Yellow
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    Push-Location server
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
        Pop-Location
        exit 1
    }
    Pop-Location
    Write-Host "✅ Dependencies installed" -ForegroundColor Green
}

# Check if .env file exists
if (-not (Test-Path "server/.env")) {
    Write-Host "⚠️  server/.env file not found" -ForegroundColor Yellow
    Write-Host "Creating .env file from template..." -ForegroundColor Yellow
    
    $envContent = @"
# PayMongo API Keys
# Get these from: https://dashboard.paymongo.com/settings/api-keys
PAYMONGO_SECRET_KEY=sk_test_your_secret_key_here
PAYMONGO_PUBLIC_KEY=pk_test_your_public_key_here

# Server Configuration
PORT=3000
"@
    
    $envContent | Out-File -FilePath "server/.env" -Encoding utf8
    Write-Host "✅ Created server/.env file" -ForegroundColor Green
    Write-Host "⚠️  Please update server/.env with your PayMongo keys!" -ForegroundColor Yellow
    Write-Host ""
}

Write-Host ""
Write-Host "🚀 Starting backend server..." -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

# Start the server in background
Push-Location server
$serverProcess = Start-Process -FilePath "node" -ArgumentList "server.js" -PassThru -NoNewWindow

# Wait a bit for server to start
Start-Sleep -Seconds 3

# Test health endpoint
Write-Host ""
Write-Host "🧪 Testing health endpoint..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/health" -UseBasicParsing -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Health endpoint working!" -ForegroundColor Green
        Write-Host "Response:" -ForegroundColor Gray
        $response.Content | ConvertFrom-Json | ConvertTo-Json
    }
} catch {
    Write-Host "❌ Health endpoint failed" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "📋 Server Status:" -ForegroundColor Cyan
Write-Host "  URL: http://localhost:3000" -ForegroundColor Gray
Write-Host "  Health: http://localhost:3000/health" -ForegroundColor Gray
Write-Host "  PayMongo: http://localhost:3000/api/paymongo" -ForegroundColor Gray
Write-Host ""
Write-Host "✅ Backend server is running!" -ForegroundColor Green
Write-Host "✅ Ready for deployment!" -ForegroundColor Green
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow

# Wait for user to stop
try {
    Wait-Process -Id $serverProcess.Id
} catch {
    # User stopped the server
}

Pop-Location
