# Environment Variables Verification Script
# This script verifies that all required environment variables are properly configured

Write-Host "🔍 Verifying Environment Configuration" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host ""

$allGood = $true

# Check .env file
Write-Host "📄 Checking .env file..." -ForegroundColor Yellow
if (Test-Path .env) {
    Write-Host "  ✅ .env file exists" -ForegroundColor Green
    
    $envContent = Get-Content .env
    $supabaseUrl = $null
    $supabaseKey = $null
    $apiUrl = $null
    
    foreach ($line in $envContent) {
        if ($line -match "^EXPO_PUBLIC_SUPABASE_URL=(.+)$") {
            $supabaseUrl = $matches[1].Trim()
        }
        elseif ($line -match "^EXPO_PUBLIC_SUPABASE_ANON_KEY=(.+)$") {
            $supabaseKey = $matches[1].Trim()
        }
        elseif ($line -match "^EXPO_PUBLIC_API_URL=(.+)$") {
            $apiUrl = $matches[1].Trim()
        }
    }
    
    if ($supabaseUrl -and -not ($supabaseUrl -match "your-project|placeholder")) {
        Write-Host "  ✅ EXPO_PUBLIC_SUPABASE_URL: Configured" -ForegroundColor Green
    } else {
        Write-Host "  ❌ EXPO_PUBLIC_SUPABASE_URL: Missing or placeholder" -ForegroundColor Red
        $allGood = $false
    }
    
    if ($supabaseKey -and -not ($supabaseKey -match "your-anon-key|placeholder")) {
        Write-Host "  ✅ EXPO_PUBLIC_SUPABASE_ANON_KEY: Configured" -ForegroundColor Green
    } else {
        Write-Host "  ❌ EXPO_PUBLIC_SUPABASE_ANON_KEY: Missing or placeholder" -ForegroundColor Red
        $allGood = $false
    }
    
    if ($apiUrl -and -not ($apiUrl -match "your-backend-url|placeholder|localhost")) {
        Write-Host "  ✅ EXPO_PUBLIC_API_URL: Configured" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  EXPO_PUBLIC_API_URL: Missing or placeholder" -ForegroundColor Yellow
        Write-Host "     (Backend may not be deployed yet)" -ForegroundColor Gray
    }
} else {
    Write-Host "  ❌ .env file not found!" -ForegroundColor Red
    Write-Host "     Run: .\scripts\setup-env.ps1" -ForegroundColor Yellow
    $allGood = $false
}

Write-Host ""
Write-Host "📦 Checking eas.json..." -ForegroundColor Yellow
if (Test-Path eas.json) {
    $easContent = Get-Content eas.json -Raw | ConvertFrom-Json
    
    $profiles = @("development", "preview", "production")
    $profileGood = $true
    
    foreach ($profile in $profiles) {
        if ($easContent.build.$profile.env) {
            $env = $easContent.build.$profile.env
            $hasAll = $env.EXPO_PUBLIC_API_URL -and $env.EXPO_PUBLIC_SUPABASE_URL -and $env.EXPO_PUBLIC_SUPABASE_ANON_KEY
            
            if ($hasAll) {
                Write-Host "  ✅ $profile profile: All variables configured" -ForegroundColor Green
            } else {
                Write-Host "  ❌ $profile profile: Missing variables" -ForegroundColor Red
                $profileGood = $false
                $allGood = $false
            }
        } else {
            Write-Host "  ❌ $profile profile: No env section" -ForegroundColor Red
            $profileGood = $false
            $allGood = $false
        }
    }
} else {
    Write-Host "  ❌ eas.json not found!" -ForegroundColor Red
    $allGood = $false
}

Write-Host ""
Write-Host "📋 Summary" -ForegroundColor Cyan
Write-Host "=========" -ForegroundColor Cyan

if ($allGood) {
    Write-Host "✅ Environment setup is complete!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🚀 You're ready to:" -ForegroundColor Cyan
    Write-Host "  • Run locally: npm start" -ForegroundColor Yellow
    Write-Host "  • Build with EAS: eas build --platform android --profile preview" -ForegroundColor Yellow
} else {
    Write-Host "⚠️  Environment setup needs attention" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "🔧 To fix:" -ForegroundColor Cyan
    Write-Host "  • Run: .\scripts\setup-env.ps1" -ForegroundColor Yellow
    Write-Host "  • Or manually update .env and eas.json" -ForegroundColor Yellow
}

Write-Host ""
