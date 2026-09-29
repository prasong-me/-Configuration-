# หลักฐาน Target ของ Surge

## Target

Surge 5 / รูปแบบโปรไฟล์ Surge

## หลักฐานทางการ

คู่มือทางการของ Surge ระบุว่าโปรไฟล์ใช้รูปแบบคล้าย INI โดยมี section เช่น `[General]`, `[Proxy]`, `[Proxy Group]`, `[Rule]`, `[Host]`, `[URL Rewrite]`, `[MITM]`, `[WireGuard <name>]` และ section อื่น ๆ

แหล่งข้อมูล: https://manual.nssurge.com/profile/format.html

Surge มีเอกสารเกี่ยวกับการติดตั้งผ่าน URL scheme `surge:///install-config?url=...`

แหล่งข้อมูล: https://manual.nssurge.com/tools/url-scheme.html

Surge มีเอกสารเกี่ยวกับ HTTP API ซึ่งใช้ API key สำหรับการควบคุมผ่านโปรแกรม

แหล่งข้อมูล: https://manual.nssurge.com/tools/http-api.html

Surge มีเอกสาร syntax สำหรับ WireGuard policy แยกต่างหาก และระบุอย่างชัดเจนว่าสิ่งนี้สร้าง outbound policy ระดับแอป ไม่ใช่การติดตั้ง WireGuard แบบครอบคลุมทั้งระบบ

แหล่งข้อมูล: https://manual.nssurge.com/policies/wireguard.html

## สถานะของโครงการ

สถานะปัจจุบันของ repository ระบุ Surge 5.x เป็น verified ภายในขอบเขต evidence ที่บันทึกไว้: มี real-device tests 15 รายการและ profile-generation test ผ่าน

สถานะนี้ไม่หมายความว่า capability ทุก field ของ Surge ถูกยืนยันแล้ว โดยเฉพาะ field ที่ manifest ยังเป็น UNKNOWN หรือ UNSUPPORTED

Adapter ต้องรักษา fail-closed behavior สำหรับ field ที่อยู่นอกขอบเขต evidence และไม่สร้างพฤติกรรมที่ไม่มี specification

## ขอบเขตความปลอดภัยที่ทราบ

ฟีเจอร์ MITM ของ Surge ต้องใช้ trusted CA และสามารถถอดรหัสได้เฉพาะ host ที่ประกาศไว้ในการตั้งค่า ข้อมูล private CA ต้องไม่ commit ลง repository นี้

แหล่งข้อมูล: https://manual.nssurge.com/http/mitm.html
