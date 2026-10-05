# IRIS Technical Knowledge Base — Android/Web/CI
## Snapshot: 2026-10-05

### Scope
Android API 31 runtime validation for the native WebView shell that packages the existing Vite/React web application, plus CI evidence collection.

### Current authoritative state
- Android branch: `feat/android-app-v1`
- Latest implementation correction: asset-loader URL aligned to the actual packaged path `assets/web/index.html`.
- PR: #31, open/draft, base `main` at `0ed434c95d250802067dd2d6c73b6578efc9d63c`.
- Run #64 / `37253429644` is the latest validation after the evidence-shell correction.
- Run #64 build job: PASS.
- Run #64 runtime job: FAILURE, but evidence artifact upload: PASS.
- Run #64 runtime reached API 31 boot, APK install, MainActivity start, WebView creation and evidence capture.
- Run #64 failure point: the WebView page itself returned `net::ERR_INVALID_RESPONSE`.
- Root cause identified by current-source reconciliation: the CI packages the web bundle at `apps/android/app/src/main/assets/web/`, while the first WebViewAssetLoader implementation loaded `/assets/index.html`; the corresponding packaged asset path is `/assets/web/index.html`.
- This correction is implemented in MainActivity and requires a new full runtime run.

### Architecture
- Existing web app remains the implementation source of configuration behavior.
- Android is a native shell around the packaged web bundle.
- Web bundle is built first, copied to `apps/android/app/src/main/assets/web/`, then packaged into APK.
- Android applicationId: `com.prasongme.configuration`
- minSdk 31, targetSdk 35, compileSdk 35.
- AGP 8.7.3, Kotlin plugin 2.0.21, Gradle runner 8.9, JVM 17.
- Stable AndroidX WebKit dependency: `androidx.webkit:webkit:1.17.1`.

### Current source facts
MainActivity now:
- uses `WebViewAssetLoader`;
- maps `/assets/` to the Android asset root;
- loads `https://appassets.androidplatform.net/assets/web/index.html` because the packaged bundle is under `assets/web/`;
- disables broad file/content access;
- disables file-to-file and universal file URL access;
- keeps the AndroidExport JS bridge for ACTION_SEND/ACTION_CREATE_DOCUMENT;
- records deterministic `IRIS_WEBAPP_ASSET_SERVED` and `IRIS_WEBAPP_PAGE_FINISHED` log markers.

### Authoritative external principles

#### Android local WebView content
Android Developers recommends `WebViewAssetLoader` with an HTTP(S) app-assets origin for local app assets and explicitly recommends against `file://` URLs and enabling file-URL universal access. The documented pattern uses `AssetsPathHandler` behind `/assets/` and loads a matching asset URL.
Source: Android Developers, “Load in-app content”, accessed 2026-10-05.

Applicability:
- Directly applicable because this app packages a Vite bundle into Android assets.

Implementation impact:
- Asset URL must match the actual packaged asset path exactly.
- The handler prefix and packaged directory are part of one dependency chain:
  CI copy destination → APK asset path → AssetLoader path handler → WebView URL.
- A mismatch is a runtime load failure even when build/package/install are all successful.

#### AndroidX WebKit version
Android Developers lists `androidx.webkit:webkit:1.17.1` as the stable release as of 2026-09-23.
Applicability:
- Project minSdk 31 is above the library minimum.

#### Android Emulator CI
ReactiveCircus `android-emulator-runner@v2` documents KVM setup and API/target/architecture/profile configuration.
Current evidence:
- KVM setup passed.
- API 31 boot passed.
- APK installation passed.

#### GitHub Actions artifact paths
Official `actions/upload-artifact` supports multiple paths through a YAML multiline scalar using `path: |`.
Current workflow uses this documented form.
Evidence upload is now run with `always()` and `if-no-files-found: error`, so incomplete evidence cannot silently become a successful evidence step.

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

Run #64 proves:
- BUILD PASS
- APK artifact PASS
- API 31 boot PASS
- INSTALL PASS
- MainActivity START PASS
- WebView object PRESENT
- EVIDENCE CAPTURE PASS
- WebView content LOAD PASS = NO
- RUNTIME PASS = NO
- FINAL VERIFIED = NO

### Error event — current work
**OPE-ANDROID-20261005-001 — Asset path mismatch**
- Intended: replace insecure `file://` loading with `WebViewAssetLoader`.
- Actual: loader mapped `/assets/` to the Android asset root, but the CI package placed the web bundle under `assets/web/`; MainActivity loaded `/assets/index.html`.
- Error point: runtime page load.
- Observed evidence: UIAutomator reported `Webpage not available` and `net::ERR_INVALID_RESPONSE`; WebView itself and the app process were alive.
- Root cause: failure to reconcile the loader URL against the current packaging destination before implementation.
- Impact: build/package/install/start passed, but web application content did not load.
- Correction: load `https://appassets.androidplatform.net/assets/web/index.html`.
- Verification: pending new runtime run.
- Prevention: before changing asset-loading architecture, verify the complete path chain: source output → copy command → packaged APK asset tree → loader mapping → load URL.

### Previous operational error
The first attempt to make runtime evidence failure-safe used a shell function/trap and failed under the runner's shell invocation. It was replaced with simple POSIX-compatible sequential commands. This is now verified because Run #64 successfully generated and uploaded the evidence artifact.

### Required verification after current correction
- Web build succeeds.
- Android APK builds.
- API 31 emulator boots.
- APK installs.
- MainActivity starts.
- `/assets/web/index.html` is served by WebViewAssetLoader.
- Page-load marker is present.
- UI evidence is captured.
- Runtime evidence artifact is uploaded.
- Workflow reaches terminal SUCCESS.
- Relevant regression checks remain green.
- No protected Apple/DNS boundary is changed.
