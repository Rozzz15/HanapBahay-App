# Environment Setup Script for HanapBahay
# This script helps you set up environment variables for both local development and EAS builds

Write-Host "🚀 HanapBahay Environment Setup" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

# Check if .env file exists
if (-not (Test-Path .env)) {
    Write-Host "❌ .env file not found!" -ForegroundColor Red
    Write-Host "Creating .env file from template..." -ForegroundColor Yellow
    
    $envContent = @"
# HanapBahay Environment Variables
# DO NOT commit this file to git!

# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=https://dkrctrkqhunttrnkqzsu.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRrcmN0cmtxaHVudHRybmtxenN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3ODMxOTEsImV4cCI6MjA4MDM1OTE5MX0.W1gn8bU8R2FpXsN96Biqw9Mgnq-3HrYlnnVfceZ74Gs

# Backend API URL
EXPO_PUBLIC_API_URL=https://web-production-e66fb.up.railway.app
"@
    
    $envContent | Out-File -FilePath .env -Encoding utf8
    Write-Host "✅ .env file created!" -ForegroundColor Green
} else {
    Write-Host "✅ .env file exists" -ForegroundColor Green
}

Write-Host ""
Write-Host "📋 Current .env Configuration:" -ForegroundColor Cyan
Write-Host "==============================" -ForegroundColor Cyan
Get-Content .env | ForEach-Object {
    if ($_ -match "^EXPO_PUBLIC_") {
        $key = ($_ -split "=")[0]
        $value = ($_ -split "=")[1]
        if ($value.Length -gt 50) {
            $displayValue = $value.Substring(0, 50) + "..."
        } else {
            $displayValue = $value
        }
        Write-Host "  $key = $displayValue" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "✅ Environment Setup Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Next Steps:" -ForegroundColor Cyan
Write-Host "1. For local development: Restart Expo (npm start)" -ForegroundColor Yellow
Write-Host "2. For EAS builds: Environment variables are already in eas.json" -ForegroundColor Yellow
Write-Host "3. Optional: Set EAS secrets for additional security:" -ForegroundColor Yellow
Write-Host "   Run: .\scripts\setup-expo-env.ps1" -ForegroundColor Gray
Write-Host ""
