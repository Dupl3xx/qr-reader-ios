# PowerShell script to prepare base64-encoded secrets for GitHub Actions
# Run this on your Windows machine to encode your certificates

Write-Host "=== GitHub Actions Secret Preparation ===" -ForegroundColor Cyan
Write-Host ""

$certPath = "D:\iPhone\2025-02-16\cert.p12"
$profilePath = "D:\iPhone\2026\20260218.mobileprovision"

# Encode certificate
if (Test-Path $certPath) {
    $certBytes = [System.IO.File]::ReadAllBytes($certPath)
    $certBase64 = [Convert]::ToBase64String($certBytes)
    $certBase64 | Set-Content -Path ".\cert_base64.txt" -NoNewline
    Write-Host "✓ Certificate encoded to cert_base64.txt" -ForegroundColor Green
} else {
    Write-Host "✗ Certificate not found at: $certPath" -ForegroundColor Red
}

# Encode provisioning profile
if (Test-Path $profilePath) {
    $profileBytes = [System.IO.File]::ReadAllBytes($profilePath)
    $profileBase64 = [Convert]::ToBase64String($profileBytes)
    $profileBase64 | Set-Content -Path ".\profile_base64.txt" -NoNewline
    Write-Host "✓ Profile encoded to profile_base64.txt" -ForegroundColor Green
} else {
    Write-Host "✗ Profile not found at: $profilePath" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== Add these secrets to your GitHub repository ===" -ForegroundColor Cyan
Write-Host "Go to: https://github.com/YOUR_USERNAME/YOUR_REPO/settings/secrets/actions"
Write-Host ""
Write-Host "Secret name: IOS_CERT_P12_BASE64" -ForegroundColor Yellow
Write-Host "Value: contents of cert_base64.txt"
Write-Host ""
Write-Host "Secret name: IOS_CERT_PASSWORD" -ForegroundColor Yellow
Write-Host "Value: 1234"
Write-Host ""
Write-Host "Secret name: IOS_PROVISION_PROFILE_BASE64" -ForegroundColor Yellow
Write-Host "Value: contents of profile_base64.txt"
Write-Host ""
Write-Host "Secret name: KEYCHAIN_PASSWORD" -ForegroundColor Yellow
Write-Host "Value: any random password (e.g. 'TempBuild2024!')"
Write-Host ""
Write-Host "=== Push to GitHub and the build will start automatically ===" -ForegroundColor Green
