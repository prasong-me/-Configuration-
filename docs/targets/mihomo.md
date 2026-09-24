# หลักฐาน Target ของ Mihomo

## หลักฐานทางการ

Mihomo มีเอกสารอ้างอิงการตั้งค่าที่ครอบคลุม inbounds, routing rules, outbounds, DNS, proxy groups และส่วนการตั้งค่าอื่น ๆ

แหล่งข้อมูล: https://wiki.metacubex.one/en/config/

Mihomo ระบุ TUN เป็นวิธีรับทราฟฟิกของระบบและรองรับการกำหนดเส้นทางอัตโนมัติ การดัก DNS และการกำหนดเส้นทางแยกตามแอป

แหล่งข้อมูล: https://wiki.metacubex.one/en/config/inbound/

Mihomo เตือนว่าการ bind กับ `0.0.0.0` จะเปิด listener บนทุกอินเทอร์เฟซเครือข่าย

แหล่งข้อมูล: https://wiki.metacubex.one/en/config/inbound/

## สถานะของโครงการ

ยังไม่มี Mihomo serializer ที่ทำเครื่องหมายว่าสมบูรณ์ การพัฒนาต้องใช้ fixture เป็นหลักและต้องผูกกับเวอร์ชันของเอกสารอ้างอิงการตั้งค่า Mihomo
