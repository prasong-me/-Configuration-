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

หลักฐานมีเพียงพอสำหรับเริ่มออกแบบ Surge serializer แต่ยังไม่เพียงพอที่จะทำเครื่องหมายว่าทุกฟีเจอร์รองรับ

Adapter รุ่นแรกต้องเริ่มจาก subset ขนาดเล็กที่มี fixture รองรับ และต้องปฏิเสธ field ที่อยู่นอกขอบเขตดังกล่าว

## ขอบเขตความปลอดภัยที่ทราบ

ฟีเจอร์ MITM ของ Surge ต้องใช้ trusted CA และสามารถถอดรหัสได้เฉพาะ host ที่ประกาศไว้ในการตั้งค่า ข้อมูล private CA ต้องไม่ commit ลง repository นี้

แหล่งข้อมูล: https://manual.nssurge.com/http/mitm.html
