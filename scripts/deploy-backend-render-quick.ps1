# Quick Backend Deployment Script for Render
# This script helps you deploy your backend to Render (free tier)

Write-Host "🚀 HanapBahay Backend Deployment to Render" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "📋 Prerequisites Checklist:" -ForegroundColor Yellow
Write-Host "  [ ] Render account created (https://render.com)" -ForegroundColor Gray
Write-Host "  [ ] GitHub repository connected" -ForegroundColor Gray
Write-Host "  [ ] PayMongo API keys ready" -ForegroundColor Gray
Write-Host ""

$ready = Read-Host "Are you ready to deploy? (y/N)"
if ($ready -ne "y" -and $ready -ne "Y") {
    Write-Host ""
    Write-Host "📝 Setup Steps:" -ForegroundColor Cyan
    Write-Host "1. Sign up at https://render.com (free)" -ForegroundColor Yellow
    Write-Host "2. Connect your GitHub account" -ForegroundColor Yellow
    Write-Host "3. Get PayMongo keys from https://dashboard.paymongo.com" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Then run this script again!" -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "✅ Deployment Configuration:" -ForegroundColor Cyan
Write-Host "============================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Service Name: hanapbahay-backend" -ForegroundColor White
Write-Host "Root Directory: server" -ForegroundColor White
Write-Host "Build Command: npm install" -ForegroundColor White
Write-Host "Start Command: npm start" -ForegroundColor White
Write-Host "Instance Type: Free" -ForegroundColor White
Write-Host ""
Write-Host "Environment Variables Needed:" -ForegroundColor Yellow
Write-Host "  - PAYMONGO_SECRET_KEY" -ForegroundColor Gray
Write-Host "  - PAYMONGO_PUBLIC_KEY" -ForegroundColor Gray
Write-Host "  - PORT=3000" -ForegroundColor Gray
Write-Host ""

Write-Host "🌐 Opening Render Dashboard..." -ForegroundColor Cyan
Start-Process "https://dashboard.render.com"

Write-Host ""
Write-Host "📋 Follow these steps in Render dashboard:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Click 'New +' → 'Web Service'" -ForegroundColor Yellow
Write-Host "2. Connect your GitHub repository" -ForegroundColor Yellow
Write-Host "3. Configure:" -ForegroundColor Yellow
Write-Host "   - Name: hanapbahay-backend" -ForegroundColor Gray
Write-Host "   - Root Directory: server" -ForegroundColor Gray
Write-Host "   - Build Command: npm install" -ForegroundColor Gray
Write-Host "   - Start Command: npm start" -ForegroundColor Gray
Write-Host "   - Instance Type: Free" -ForegroundColor Gray
Write-Host "4. Add Environment Variables:" -ForegroundColor Yellow
Write-Host "   - PAYMONGO_SECRET_KEY" -ForegroundColor Gray
Write-Host "   - PAYMONGO_PUBLIC_KEY" -ForegroundColor Gray
Write-Host "   - PORT=3000" -ForegroundColor Gray
Write-Host "5. Click 'Create Web Service'" -ForegroundColor Yellow
Write-Host "6. Wait for deployment (5-10 minutes)" -ForegroundColor Yellow
Write-Host "7. Copy your service URL" -ForegroundColor Yellow
Write-Host ""

Write-Host "📝 Get PayMongo Keys:" -ForegroundColor Cyan
Write-Host "  https://dashboard.paymongo.com/settings/api-keys" -ForegroundColor Yellow
Write-Host ""

Write-Host "✅ After deployment, update:" -ForegroundColor Cyan
Write-Host "  - .env file with your Render URL" -ForegroundColor Yellow
Write-Host "  - eas.json with your Render URL" -ForegroundColor Yellow
Write-Host ""

Write-Host "📚 Full guide: DEPLOY_BACKEND_RENDER.md" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Enter when deployment is complete..." -ForegroundColor Yellow
Read-Host

Write-Host ""
Write-Host "🎉 Deployment complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Test your backend:" -ForegroundColor Cyan
Write-Host "  https://your-service.onrender.com/health" -ForegroundColor Yellow
Write-Host ""
