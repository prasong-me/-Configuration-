# Network Configuration — Android 12 test app

สถานะ: TEST APP / ไม่ได้เพิ่มเข้าเมนูหลักของ Network Configuration

## Source

ตัวแอปเป็น Android WebView wrapper ของ Web App จริงจาก repository prasong-me/-Configuration-:

- apps/web/index.html
- apps/web/src/main.jsx
- apps/web/src/WizardApp.jsx
- apps/web/vite.config.js

CI จะ build Web App จาก source เดียวกัน (`apps/web`) แล้ว bundle `apps/web/dist` เข้า APK เป็น in-app content ผ่าน WebViewAssetLoader

## Android target

- minSdk: 31 (Android 12)
- targetSdk: 36
- compileSdk: 36
- Java: 17
- AGP: 9.4.0
- Gradle: 9.6.0

## Permissions

มีเฉพาะ INTERNET. ไม่มี storage permission เพราะ Android 10+ ใช้ MediaStore สำหรับบันทึกไฟล์ export ลง Downloads

## Security boundary

- WebView ใช้ `WebViewAssetLoader` และ `https://appassets.androidplatform.net/`
- ปิด file/content access
- URL ภายนอกเปิดด้วย browser ของระบบ
- native bridge ใช้เฉพาะการบันทึก export จาก Web App ที่ bundle จาก Source of Truth

## Build

gradle --no-daemon :app:assembleDebug

APK output:
apps/android/app/build/outputs/apk/debug/app-debug.apk
