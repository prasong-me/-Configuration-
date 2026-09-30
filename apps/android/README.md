# Configuration Android

Android wrapper for the existing mobile-first Configuration web application.

## Architecture

The Android shell owns the native lifecycle and WebView host. The existing apps/web application remains the UI and configuration/export implementation, so the canonical Core/Target/Exporter boundaries are not duplicated in Android.

Build flow:

1. Build apps/web.
2. Copy its dist/ output into apps/android/app/src/main/assets/web/.
3. Build the Android APK.

The app is local-first after packaging: the UI bundle is loaded from Android assets and does not require a hosted web server to start.

## Validation boundary

IMPLEMENTED = Android project and packaging path.
SYNTAX-TESTED = GitHub Actions Android build succeeds.
REAL-DEVICE-TESTED = requires an Android device; not claimed by repository build alone.

Download/share behavior is inherited from the web application and must be verified on an Android device before being marked runtime-validated.
