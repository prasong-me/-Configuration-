# Apple Adapter

ตัวแปลงสำหรับ Apple Configuration

รองรับการสร้าง:
- iOS Configuration Profile / MobileConfig สำหรับ payload ที่ติดตั้งได้โดยตรง
- Declarative DNS declaration สำหรับระบบจัดการอุปกรณ์รุ่นใหม่

## Signing

Adapter จะสร้าง MobileConfig แบบ unsigned เป็นค่าเริ่มต้น เพราะ private signing key ต้องไม่ถูกฝังหรือส่งขึ้นเว็บแอป

เมื่อ deployment ต้องใช้ signed profile ให้ใช้ CLI ที่ repository เตรียมไว้:

```text
npm run sign:mobileconfig -- --input unsigned.mobileconfig --output signed.mobileconfig --cert signer.pem --key signer-key.pem
```

รองรับ certificate chain ด้วย `--chain chain.pem`

สำหรับ private key ที่มีรหัสผ่าน ให้ส่งผ่าน environment variable:

```text
MOBILECONFIG_KEY_PASSWORD='...' npm run sign:mobileconfig -- --input unsigned.mobileconfig --output signed.mobileconfig --cert signer.pem --key signer-key.pem --password-env MOBILECONFIG_KEY_PASSWORD
```

ตัว signer ใช้ OpenSSL CMS/DER + SHA-256 และตรวจสอบ CMS ที่สร้างขึ้นอีกครั้งก่อนรายงานว่าสำเร็จ โดยไม่เก็บ private key หรือ password ลง repository

Extension หรือ Network Extension ของผู้ให้บริการไม่ได้ถูกสร้างโดย adapter นี้ หาก configuration ต้องอาศัยส่วนประกอบดังกล่าว ระบบจะสร้างผลลัพธ์พร้อมคำเตือนตามข้อมูลที่ผู้ใช้เลือก
