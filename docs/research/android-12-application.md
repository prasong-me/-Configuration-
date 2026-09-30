# Android 12 Application Research Record

Status: TEST / RESEARCHED  
Scope: `apps/android` in `-Configuration-`  
Baseline: Android 12 = API level 31

## Verified findings

1. Android 12 corresponds to API level 31. Android 12L is API level 32.
2. To develop and test Android 12 APIs, the Android 12 SDK Platform 31 can be installed from Android Studio SDK Manager.
3. Apps targeting Android 12+ must explicitly set `android:exported` for components with intent filters. The current launcher activity already sets `android:exported="true"`.
4. Android 12 changes WebView third-party cookie/SameSite behavior for apps targeting API 31+. WebView flows involving login or cross-site content must therefore be tested on Android 12.
5. Android 12 introduces/changes several platform behaviors including splash-screen handling, notification behavior, foreground-service launch restrictions, PendingIntent mutability, and Bluetooth permissions. The current app shell does not use those features yet.
6. The current Android shell uses a WebView to host the existing web application. This keeps the configuration Core/Target/Exporter implementation in the web layer instead of duplicating it in Kotlin.
7. The Android build currently targets SDK 35. Supporting Android 12 does not require target SDK 31; an app can target a newer SDK while retaining Android 12 as its minimum supported version. For this test branch, `minSdk = 31` makes Android 12 the explicit minimum runtime baseline.

## Engineering decision for this test branch

- Minimum Android version: API 31 (Android 12).
- Compile SDK: 35.
- Target SDK: 35.
- Java/Kotlin toolchain: Java 17 / Kotlin 2.0.21.
- Runtime host: Android WebView.
- Validation boundary: repository build is not equivalent to real-device validation.

## Required validation

- Build debug APK in GitHub Actions.
- Install and launch on a physical Android 12/API 31 device or API 31 emulator.
- Verify the bundled WebView UI loads all production assets.
- Verify configuration/export flows.
- Verify Android back navigation.
- Verify download/share behavior separately; the current WebView shell does not yet prove browser `navigator.share` or blob-download compatibility.
- If authentication or cross-site content is added later, test Android 12 WebView SameSite cookie behavior.

## Sources

- Android 12 overview: https://developer.android.com/about/versions/12
- Android 12 behavior changes: https://developer.android.com/about/versions/12/behavior-changes-12
- Android 12 SDK setup: https://developer.android.com/about/versions/12/setup-sdk
- Android 12 compatibility framework changes: https://developer.android.com/about/versions/12/reference/compat-framework-changes
- Android 12 all-app behavior changes: https://developer.android.com/about/versions/12/behavior-changes-all
