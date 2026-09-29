# หลักฐานการตั้งค่าเครือข่ายของ Apple

## ขอบเขต

หลักฐานนี้ครอบคลุมความสามารถด้านเครือข่ายของแพลตฟอร์ม Apple ที่เกี่ยวข้องกับโครงการ ไม่ได้หมายความว่าแอปจาก App Store ทุกแอปจะสามารถรับการตั้งค่าของ Apple ได้ทุกประเภท

## ข้อเท็จจริงที่ตรวจสอบแล้ว

Apple มีเอกสารเกี่ยวกับ DNS แบบเข้ารหัสผ่านประเภทการตั้งค่าแบบ declarative `com.apple.configuration.network.dns-settings` การติดตั้งภายในเครื่องรองรับสำหรับการตั้งค่านี้ โดยขึ้นอยู่กับเงื่อนไขด้านความพร้อมใช้งานของ Apple

Apple มีเอกสารเกี่ยวกับการตั้งค่า VPN plugin ผ่าน `com.apple.configuration.network.vpn.vpn-plugin` โดยรองรับการลงทะเบียนภายในเครื่องบนการตั้งค่า iOS/iPadOS ที่รองรับ

Per-App VPN มีข้อกำหนดเพิ่มเติมด้าน MDM และการจัดการแอป จึงไม่เทียบเท่ากับการสร้างไฟล์โปรไฟล์เพียงอย่างเดียว

Network Extension framework ของ Apple เป็นชุด API ที่รองรับสำหรับแอปพลิเคชัน VPN

## กฎของโครงการ

ความสามารถระดับแพลตฟอร์มเหล่านี้ไม่ได้กลายเป็นความสามารถของ Target ที่เป็นแอปจากบุคคลที่สามโดยอัตโนมัติ Target Adapter ต้องมีหลักฐานแยกต่างหากว่า Target นั้นยอมรับรูปแบบการนำเข้าและการตั้งค่าที่เกี่ยวข้อง

ต้องแยก 3 สถานะออกจากกัน:
- **Platform evidence** — Apple รองรับรูปแบบ/API ตามหลักฐานของแพลตฟอร์ม
- **Repository implementation** — repository มี exporter/runtime boundary ที่สร้างหรือ implement รูปแบบนั้น
- **Target/runtime validation** — มีหลักฐานจาก target หรืออุปกรณ์จริงว่าทำงานตามขอบเขตที่ประกาศ

ดังนั้นข้อความด้านล่างไม่ควรตีความว่าเป็นการยืนยัน physical-device runtime

## สถานะปัจจุบัน

- Apple MobileConfig: repository มี exporter; capability evidence ของ `dns` และ `web.entry` อยู่ในขอบเขตที่ประกาศ
- Apple Network DNS Settings: repository มี reference exporter; capability evidence ของ `dns`, `dns.profiles`, `dns.resolution` อยู่ในขอบเขต syntax/reference
- Apple DNSSettings legacy: repository มี legacy exporter; capability evidence จำกัดอยู่ใน legacy DNS syntax/reference
- Apple DNS Provider Runtime: repository มี runtime/source-generation และ transport integration; capability `dns` อยู่ในขอบเขต implementation/evidence ที่บันทึกไว้ แต่ยังไม่พิสูจน์ entitlement, signing, device runtime หรือ upstream E2E

**ข้อสำคัญ:** สถานะเหล่านี้ไม่ใช่ blanket claim ว่า Apple Target ทุกชนิดหรือทุก payload ใช้งานจริงบนอุปกรณ์ได้ครบทุกความสามารถ
