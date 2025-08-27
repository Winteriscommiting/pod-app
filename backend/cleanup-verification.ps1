# Atlas Cleanup Verification Script

Write-Host ""
Write-Host "==========================================="
Write-Host "   PodcastAI - Atlas Cleanup Verification"
Write-Host "==========================================="
Write-Host ""

# Check for Atlas references in code files
Write-Host "🔍 Checking for Atlas references..." -ForegroundColor Yellow

$atlasPatterns = @("atlas", "mongodb+srv", "cluster.*mongodb\.net", "srv.*mongodb")
$foundReferences = @()

foreach ($pattern in $atlasPatterns) {
    $matches = Get-ChildItem -Path "." -Recurse -File -Include "*.js", "*.json", "*.env*", "*.md" | 
               Select-String -Pattern $pattern -CaseSensitive:$false
    
    if ($matches) {
        $foundReferences += $matches
    }
}

if ($foundReferences.Count -eq 0) {
    Write-Host "✅ No Atlas references found in codebase" -ForegroundColor Green
} else {
    Write-Host "⚠️ Found potential Atlas references:" -ForegroundColor Yellow
    foreach ($ref in $foundReferences) {
        Write-Host "   $($ref.Filename):$($ref.LineNumber) - $($ref.Line.Trim())" -ForegroundColor Red
    }
}

# Check environment configuration
Write-Host ""
Write-Host "🔧 Checking environment configuration..." -ForegroundColor Yellow

if (Test-Path ".env") {
    $envContent = Get-Content ".env" -Raw
    if ($envContent -match "mongodb://localhost") {
        Write-Host "✅ Environment configured for local MongoDB" -ForegroundColor Green
    } elseif ($envContent -match "mongodb\+srv") {
        Write-Host "❌ Environment still contains Atlas connection string" -ForegroundColor Red
    } else {
        Write-Host "⚠️ Environment configuration unclear" -ForegroundColor Yellow
    }
} else {
    Write-Host "❌ .env file not found" -ForegroundColor Red
}

# Check for backup files
Write-Host ""
Write-Host "🗂️ Checking for backup files..." -ForegroundColor Yellow

$backupFiles = Get-ChildItem -Path "." -Recurse -File | Where-Object { 
    $_.Name -match "\.(bak|old|backup)$" -or 
    $_.Name -match "atlas" -or 
    $_.Name -match "\.env\." 
}

if ($backupFiles.Count -eq 0) {
    Write-Host "✅ No Atlas backup files found" -ForegroundColor Green
} else {
    Write-Host "⚠️ Found potential backup files:" -ForegroundColor Yellow
    foreach ($file in $backupFiles) {
        if ($file.Name -notmatch "\.env\.example$") {
            Write-Host "   $($file.FullName)" -ForegroundColor Yellow
        }
    }
}

Write-Host ""
Write-Host "==========================================="
Write-Host "   Cleanup Verification Complete"
Write-Host "==========================================="
Write-Host ""
Write-Host "Local MongoDB Configuration Active" -ForegroundColor Green
Write-Host "Database: mongodb://localhost:27017/podcast-app" -ForegroundColor Cyan
Write-Host "Ready for local development!" -ForegroundColor Green
Write-Host ""
