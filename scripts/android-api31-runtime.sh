#!/usr/bin/env bash
set -euo pipefail

PACKAGE="com.prasongme.configuration"
ACTIVITY="${PACKAGE}/.MainActivity"
EXPECTED_URL="https://appassets.androidplatform.net/assets/web/index.html"
EVIDENCE="api31-runtime-evidence.txt"
UI_XML="ui.xml"

capture_evidence() {
  {
    echo "sdk=$(adb shell getprop ro.build.version.sdk 2>/dev/null | tr -d '\r' || true)"
    echo "package_pid=$(adb shell pidof "$PACKAGE" 2>/dev/null | tr -d '\r' || true)"
    echo "activity="
    adb shell dumpsys activity top 2>&1 || true
    echo "window="
    adb shell dumpsys window windows 2>&1 || true
    echo "webview="
    adb shell dumpsys webviewupdate 2>&1 || true
    echo "ui_webview="
    adb shell cat /sdcard/window.xml 2>&1 || true
    echo "logcat="
    adb shell logcat -d -t 800 2>&1 || true
  } > "$EVIDENCE"
  adb shell cat /sdcard/window.xml > "$UI_XML" 2>/dev/null || : > "$UI_XML"
}

trap capture_evidence EXIT

adb shell getprop ro.build.version.sdk | grep -Fx "31"
adb logcat -c
adb install -r artifacts/app-debug.apk
adb shell am force-stop "$PACKAGE"
adb shell am start -n "$ACTIVITY"

ready=0
for i in $(seq 1 30); do
  adb shell uiautomator dump /sdcard/window.xml >/dev/null 2>&1 || true
  if adb shell cat /sdcard/window.xml 2>/dev/null | grep -F "Configuration Platform" >/dev/null; then
    ready=1
    break
  fi
  sleep 1
done

test "$ready" -eq 1
test -n "$(adb shell pidof "$PACKAGE")"
adb shell dumpsys activity top | grep -F "$ACTIVITY"
adb shell dumpsys window windows | grep -F "$ACTIVITY"
adb shell dumpsys webviewupdate
adb shell cat /sdcard/window.xml | grep -F "android.webkit.WebView"
adb shell cat /sdcard/window.xml | grep -F "Configuration Platform"
! adb shell cat /sdcard/window.xml | grep -F "Webpage not available" >/dev/null
! adb shell cat /sdcard/window.xml | grep -F "ERR_INVALID_RESPONSE" >/dev/null
adb shell logcat -d -t 800 | grep -F "IRIS_WEBAPP_PAGE_FINISHED url=$EXPECTED_URL"
