# แพลตฟอร์มสร้างการตั้งค่า

เครื่องมือสร้างการตั้งค่าสำหรับแอปพลิเคชันด้านเครือข่ายและความเป็นส่วนตัว โดยรองรับ Target หลายรูปแบบ

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

เอกสารทางการเพียงอย่างเดียวใช้ยืนยันข้อมูลรูปแบบและข้อมูลอ้างอิงได้ แต่ไม่ใช่หลักฐานว่าทำงานร่วมกับระบบจริงได้

Repository จึงเก็บผลการทดสอบแยกจากคำจำกัดความของ Target ผลที่สังเกตได้เพียงบางส่วนต้องระบุว่าเป็น partial และห้ามเลื่อนสถานะเป็น verified โดยไม่มีหลักฐานเพียงพอ

ผลที่บันทึกไว้ในปัจจุบัน:

- Surge 5.x: verified, ทดสอบบนอุปกรณ์จริง 15 รายการ และมีการทดสอบการสร้างโปรไฟล์
- Shadowrocket: partial, มีการสังเกตการทำงานของ DNS/runtime บนอุปกรณ์จริง
- WireGuard: partial, มีการสังเกตอินเทอร์เฟซ VPN และการกำหนดเส้นทางบนอุปกรณ์จริง
- Target อื่น ๆ: อยู่ในระดับ reference/template จนกว่าจะมีการบันทึกผลการทดสอบจริง

เมื่อได้รับผลการทดสอบใหม่ ให้เพิ่มผลที่สังเกตได้จริงลงในบันทึกหลักฐานของ Target ก่อน แล้วจึงปรับสถานะเมื่อหลักฐานรองรับสถานะนั้น

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

Example model:

    Client
      |
      v
    DNS Processing Layer
      +-- Stage A
      +-- Stage B
      +-- Stage C
      |
      v
    Final Resolver / target-specific transport
      |
      v
    Client

Protocol and role remain independent. DoH, DoT, DoQ, DNSCrypt, and plain DNS describe transport; resolver, threat filtering, tracker filtering, custom rules, and other capabilities describe behavior.

## Generic Web Entry

The core policy can carry an optional webEntry object containing a name, URL, and optional icon. Target adapters decide how to represent it. For Apple this can map to a Web Clip payload when that capability is supported. It is not an Apple-only core concept.
