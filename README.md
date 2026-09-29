# แพลตฟอร์มสร้างการตั้งค่า

เครื่องมือสร้างการตั้งค่าสำหรับแอปพลิเคชันด้านเครือข่ายและความเป็นส่วนตัว โดยรองรับ Target หลายรูปแบบ

## สถานะงานล่าสุด

ดูสถานะละเอียดและรายการงานที่ยังไม่เสร็จใน [PROJECT-STATUS.md](./PROJECT-STATUS.md)

- Core รองรับ `dnsProfiles[]` หลายชุด โดยไม่ล็อกจำนวนใน data model
- แต่ละ DNS profile มีชื่อของตัวเอง, provider, protocol, คู่/ชุด server, endpoint, role, enabled และ order
- คู่ DNS ของ provider เดียวกันถือเป็น profile เดียว ไม่ใช่ DNS คนละ stage
- มี DNS pipeline แยกต่างหากสำหรับ processing semantics แบบ PASS / RESPOND / BLOCK / FORWARD / ERROR
- Core/exporter มี preset DNS 3 ชุดเป็น baseline และ UI Wizard ปัจจุบันเริ่มต้น 3 profile พร้อมเพิ่ม/ลบ/enable/disable profile ได้
- Target exporters ต้องตรวจสอบแยกตาม format ว่าสามารถแทนหลาย DNS profiles ได้ครบเพียงใด
- Generic `webEntry` อยู่ใน core และให้ Target adapter เป็นผู้แปลง
- Apple มี MobileConfig และ declarative DNS; legacy DNS payload ไม่ถือเป็นรูปแบบสมัยใหม่โดยอัตโนมัติ
- Wizard ปัจจุบันมี 6 ขั้น: Intent → Source → DNS / Policy → Target → Compatibility → Review / Export; flow นี้เป็น implementation ปัจจุบันและใช้เป็น source สำหรับเอกสาร UI
- Certificates/signing ไม่ใช่ dependency กลางและจะทำเฉพาะเมื่อ Target ต้องใช้
- Target จะถูกระบุว่า verified จากหลักฐานการทดสอบจริง ไม่ใช่จาก exporter เพียงอย่างเดียว

## สถาปัตยกรรม

แพลตฟอร์มนี้เป็นตัวกลางสำหรับสร้างการตั้งค่า ไม่ได้ทำหน้าที่เป็น VPN, เครื่องยนต์พร็อกซี หรือกลไกนำเข้าโปรไฟล์ของแอปเป้าหมาย

ลำดับการทำงานคือ:

1. เลือกแอปพลิเคชันเป้าหมาย
2. สร้างหรือแก้ไขโปรไฟล์
3. กำหนด DNS, พร็อกซี, การกำหนดเส้นทาง และนโยบายการบล็อก
4. ตรวจสอบการตั้งค่า
5. สร้างการตั้งค่าในรูปแบบเฉพาะของแอปเป้าหมาย
6. ส่งผลลัพธ์ให้แอปเป้าหมายผ่านช่องทางที่รองรับ เช่น iOS Share/Open In หรือ app link ที่มีเอกสารระบุไว้
7. แอปเป้าหมายเป็นผู้รับผิดชอบการนำเข้าและการทำงานของการตั้งค่า

## หลักฐานการทดสอบ

การตั้งค่าของ Target ต้องมีหลักฐานจากการทดสอบจริงก่อนจึงจะนำเสนอว่าได้รับการยืนยัน หรือส่งออกในฐานะ Target ที่ได้รับการยืนยันได้

เอกสารทางการใช้ยืนยันข้อมูลรูปแบบและข้อมูลอ้างอิง แต่ไม่ใช่หลักฐานว่าทำงานร่วมกับระบบจริงได้

ผลที่บันทึกไว้:
- Surge 5.x: verified ภายในขอบเขต evidence ที่บันทึกไว้ใน repository (15 real-device tests + profile generation)
- Shadowrocket: partial
- WireGuard: partial
- Mihomo/Loon/Stash/Quantumult X: template/reference; WireGuard/Shadowrocket: partial-tested; Apple MobileConfig/declarative DNS: generated/reference-export; ห้ามอ้าง supported เกิน evidence ที่มี

เมื่อได้รับผลการทดสอบใหม่ ให้เพิ่มผลที่สังเกตได้จริงลงในบันทึกหลักฐานของ Target ก่อนปรับสถานะ

## โค้ดเฉพาะ Target

Web core ต้องไม่ผูกกับ Target รูปแบบและพฤติกรรมเฉพาะ Target ต้องอยู่ในคำจำกัดความ, adapter หรือสคริปต์ของ Target

ห้ามกระจายเงื่อนไขเฉพาะ Target ไปทั่ว UI หลัก

## ความปลอดภัย

ห้าม commit private key, password, token, certificate หรือข้อมูลการตั้งค่าส่วนบุคคล

แหล่งข้อมูลระยะไกลต้องถือเป็นข้อมูล ห้ามเรียกใช้ JavaScript จากระยะไกลโดยพลการ

## การทดสอบ

ใช้ `npm test` สำหรับการทดสอบ core

ใช้ `npm --prefix apps/web install && npm --prefix apps/web run build` สำหรับการ build เว็บ

## DNS Processing Model

The core keeps DNS provider identity, protocol, capability/role, order, and target adapter concerns separate.

A DNS pipeline is represented as ordered stages. A stage may return PASS, RESPOND, BLOCK, FORWARD, or ERROR. PASS continues processing to the next stage; handled results terminate the current pipeline unless a target-specific adapter defines another documented behavior.

Remote resolvers are not treated as a serial filter chain merely because they appear in sequence. The controller must own the processing semantics and invoke provider-specific handlers deliberately.

Protocol and role remain independent. DoH, DoT, DoQ, DNSCrypt, and plain DNS describe transport; resolver, threat filtering, tracker filtering, custom rules, and other capabilities describe behavior.

## Generic Web Entry

The core policy can carry an optional webEntry object containing a name, URL, and optional icon. Target adapters decide how to represent it. For Apple this can map to a Web Clip payload when that capability is supported. It is not an Apple-only core concept.
