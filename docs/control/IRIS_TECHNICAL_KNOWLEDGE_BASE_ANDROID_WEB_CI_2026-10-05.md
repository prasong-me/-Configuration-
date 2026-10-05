# IRIS Technical Knowledge Base — Android/Web/CI
## Snapshot: 2026-10-05

### Scope
Android API 31 runtime validation for the native WebView shell that packages the existing Vite/React web application, plus CI evidence collection.

### Current authoritative state
- Android branch: `feat/android-app-v1`
- Branch HEAD: `31b97a460cf2ad206cafefad01b9c6ef067a2575`
- PR: #31, open/draft, base `main` at `0ed434c95d250802067dd2d6c73b6578efc9d63c`
- Latest Android run: #53 / `37252392469`, HEAD matches branch, completed FAILURE.
- Run #53 build job: PASS.
- Run #53 runtime job: FAILURE.
- Run #53 emulator boot/install/activity/UI WebView checks reached success before the final runtime script failed.
- Run #53 failure point: shell syntax error in the runtime evidence-generation block; evidence upload was skipped.
- Previous Run #52 failure was on the runtime job; historical record showed the runtime execution path had reached the evidence-recording stage before failure. Current Run #53 supersedes that interpretation for the current HEAD.

### Architecture
- Existing web app remains the implementation source of configuration behavior.
- Android is a native shell around the packaged web bundle.
- Web bundle is built first, copied to `apps/android/app/src/main/assets/web/`, then packaged into APK.
- Android applicationId: `com.prasongme.configuration`
- minSdk 31, targetSdk 35, compileSdk 35.
- AGP 8.7.3, Kotlin plugin 2.0.21, Gradle runner 8.9, JVM 17.

### Current source facts
MainActivity currently:
- enables JavaScript and DOM storage;
- currently uses `file:///android_asset/web/index.html`;
- currently allows file and content access;
- exposes `AndroidExport` JavaScript bridge for ACTION_SEND and ACTION_CREATE_DOCUMENT;
- uses WebViewClient/WebChromeClient;
- supports API 31/32 back handling and API 33+ OnBackInvokedDispatcher;
- destroys WebView and removes the JS interface in onDestroy.

The web source:
- is Vite/React;
- current blocked-domain parsing is `blockedDomains.split(/[\\\\s,]+/)` in repository source as read on 2026-10-05;
- DNS textarea uses `p.servers.join("\\n")` and parses with `split(/[,\\s]+/)`;
- Android bridge is detected through `window.AndroidExport`.

### Authoritative external principles

#### Android local WebView content
Android Developers recommends `WebViewAssetLoader` with `https://appassets.androidplatform.net/assets/index.html` for local app assets. The documentation explicitly recommends against `file://` URLs and recommends keeping `setAllowFileAccessFromFileURLs(false)` and `setAllowUniversalAccessFromFileURLs(false)` disabled/false for security. Source: Android Developers, “Load in-app content”, accessed 2026-10-05.

Applicability:
- Directly applicable because the app packages a Vite-generated HTML/JS/CSS bundle under Android assets.
- This is not merely a style preference: it affects origin behavior, web APIs, and file-based attack surface.

Implementation impact:
- Add stable `androidx.webkit:webkit` dependency.
- Use `WebViewAssetLoader` + custom `WebViewClient.shouldInterceptRequest`.
- Load `https://appassets.androidplatform.net/assets/index.html`.
- Disable broad file/content access unless a concrete requirement proves otherwise.

#### AndroidX WebKit version
Android Developers lists `androidx.webkit:webkit:1.17.1` as the stable release as of 2026-09-23.
Applicability:
- Project minSdk 31 is above the library's minimum supported SDK.
Implementation impact:
- Pin the stable version rather than using an alpha release.

#### Android Emulator CI
ReactiveCircus `android-emulator-runner@v2` documents KVM setup on Ubuntu runners using udev rules and supports API level, target, architecture, profile, CPU, RAM, heap, and emulator options.
Applicability:
- Current workflow already uses the documented KVM setup and API 31/google_apis/x86_64 configuration.
Current evidence:
- KVM setup passed in Run #53.
- Emulator boot completed and API 31 was verified.
- Runtime failure was after boot, not an emulator boot failure.

#### GitHub Actions artifact paths
Official `actions/upload-artifact` documentation supports multiple paths using a YAML multiline scalar:
```yaml
path: |
  path/to/first
  path/to/second
```
The current workflow's `path:` followed by two indented scalar lines without `|` is therefore not the documented multi-path form.
Implementation impact:
- Change evidence upload to `path: |`.
- Prefer `if: always()` for evidence upload when evidence files are intentionally produced before a later command can fail, while ensuring missing-file behavior is explicit.
- Evidence upload must never be used to turn an execution failure into PASS.

### Evidence model
Separate:
BUILD PASS
PACKAGE PASS
INSTALL PASS
START PASS
UI LOAD PASS
FUNCTION PASS
EVIDENCE PASS
REGRESSION PASS
FINAL VERIFIED

Run #53 currently proves:
- BUILD PASS
- PACKAGE/ARTIFACT availability sufficient for runtime
- API 31 emulator boot PASS
- APK install PASS
- Activity start PASS
- WebView UI node present PASS
- WebView provider available PASS
- Runtime script/evidence generation FAIL
- EVIDENCE PASS = NO
- FINAL VERIFIED = NO

### Current technical gap
1. Runtime evidence shell block is malformed and must be corrected.
2. Current MainActivity uses `file://`, contrary to current Android guidance; this is a substantive architecture/security gap, not just a test formatting issue.
3. Runtime evidence should verify that the packaged web document actually loads, not only that a WebView object exists.
4. The current WebView runtime check should produce deterministic, inspectable evidence for page-load state.
5. After changing WebView loading, the full build → install → start → page-load → evidence → regression chain must be rerun.

### Required verification after changes
- Web build succeeds.
- Android APK builds.
- API 31 emulator boots.
- APK installs.
- MainActivity starts.
- WebViewAssetLoader serves the packaged index.
- Page-load marker/evidence confirms the web document loaded.
- UI evidence is captured.
- WebView provider state is captured.
- Logcat is captured.
- Runtime evidence artifact is uploaded.
- Workflow is terminal SUCCESS.
- No unrelated protected boundary is changed.
