# Android Application Compatibility Evidence — API 31+

Status: PARTIAL / RESEARCH BASELINE — runtime not yet verified
Scope: `apps/android` in `-Configuration-`
Minimum supported OS: Android 12 / API 31

## 1. Support interpretation

The project requirement “Android 12 and later” means minimum API 31 plus version-by-version compatibility evidence for subsequent supported Android releases. Android 12 is not the only target version.

## 2. Current implementation configuration

- Minimum SDK: API 31
- Compile SDK: 35
- Target SDK: 35
- Java: 17
- Kotlin: 2.0.21
- Runtime host: Android WebView
- Android wrapper: existing `apps/web` bundle packaged into Android assets

## 3. Evidence model

For every supported API version, record separately:

- Platform/API changes
- Permission changes
- Manifest/component rules
- WebView behavior
- Storage behavior
- Network behavior
- Background execution restrictions
- Notification behavior
- Security/signing requirements
- Build/toolchain compatibility
- Known limitations
- Runtime test result
- Evidence IDs / source references

A newer compileSdk/targetSdk does not prove runtime compatibility with every older or newer Android release.

## 4. Existing Android 12 evidence

Verified baseline retained from the original research:

1. Android 12 = API 31; Android 12L = API 32.
2. Android 12 SDK Platform 31 is the Android 12 development/test platform.
3. Apps targeting Android 12+ must explicitly set `android:exported` for components with intent filters; the launcher activity sets `android:exported="true"`.
4. Android 12 changes WebView SameSite/cookie behavior for apps targeting API 31+.
5. Android 12 changes several platform behaviors including splash-screen handling, notification behavior, foreground-service launch restrictions, PendingIntent mutability, and Bluetooth permissions. Only features actually used by the application are implementation-relevant.

## 5. Compatibility matrix state

| API | Android release | Evidence state | Runtime state |
|---|---|---|---|
| 31 | Android 12 | PARTIAL / VERIFIED DOCUMENTATION | NOT VERIFIED |
| 32 | Android 12L | MISSING VERSION-SPECIFIC RECORD | NOT VERIFIED |
| 33+ | Later Android releases | MISSING VERSION-SPECIFIC RECORDS | NOT VERIFIED |

The matrix must be expanded with verified version records before the Android Target Evidence Completion gate is closed.

## 6. Validation boundary

CI APK build = build/packaging evidence only.

Android 12 device/emulator launch, WebView asset loading, configuration/export flow, back navigation, download/share behavior and any platform-specific runtime behavior require runtime evidence before being marked verified.

## 7. Sources retained from the original record

- https://developer.android.com/about/versions/12
- https://developer.android.com/about/versions/12/behavior-changes-12
- https://developer.android.com/about/versions/12/setup-sdk
- https://developer.android.com/about/versions/12/reference/compat-framework-changes
- https://developer.android.com/about/versions/12/behavior-changes-all

New version records must be added as separate evidence entries; do not overwrite the historical Android 12 evidence.
