# QR Reader - Build Guide

## Quick Start (EAS Cloud Build)

### 1. Create Expo account
Go to https://expo.dev/signup and create a free account.

### 2. Login
```bash
cd QRReader
eas login --browser
```

### 3. Build IPA
```bash
eas build --platform ios --profile preview
```

EAS will build on their macOS cloud servers and give you a download link.

---

## Using your own Certificate + Provisioning Profile

The `credentials.json` file is already configured with your cert paths.
The bundle ID `com.google.ios.youtube.RW4Q5ZGHM2` matches your provisioning profile.

For EAS to use your local credentials:
```bash
eas build --platform ios --profile preview --non-interactive
```

When prompted about credentials, choose **"Use local credentials (credentials.json)"**.

---

## GitHub Actions (Alternative)

If you prefer GitHub Actions:

1. Push this project to GitHub
2. Go to Settings → Secrets and add:
   - `EXPO_TOKEN` — from https://expo.dev/accounts/[user]/settings/access-tokens
   - `IOS_CERT_P12_BASE64` — base64 of your cert.p12:
     ```
     certutil -encode "D:\iPhone\2025-02-16\cert.p12" cert_b64.txt
     ```
   - `IOS_CERT_PASSWORD` — `1234`
   - `IOS_PROVISION_PROFILE_BASE64` — base64 of your .mobileprovision
   - `KEYCHAIN_PASSWORD` — any password (e.g. `temp1234`)
3. Push to main branch → IPA is built automatically

---

## Certificate Info

- **Developer**: Ondrej Levy
- **Team ID**: RW4Q5ZGHM2
- **Bundle ID**: `com.google.ios.youtube.RW4Q5ZGHM2`
- **Profile UUID**: `21f42260-62dd-4dd7-8363-3fbb9373c832`
- **Expires**: 2027-02-18
- **Devices registered**: 8 devices

---

## App Features

- QR code scanning via camera (live scanner with animated scan line)
- Dark/Light mode (follows system)
- History of scanned codes (grouped by day, swipe to delete)
- Smart QR parsing: URLs, emails, phone, SMS, WiFi, vCard, geo, calendar
- Multi-language: Czech, English, Slovak, German, Polish (auto-detects device language)
- Haptic feedback
- Copy & Share results
- Settings screen
