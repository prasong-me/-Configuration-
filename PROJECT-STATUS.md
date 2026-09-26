# Configuration Platform · Project Status

อัปเดต: 2026-09-26

เอกสารนี้เป็นสถานะกลางของงานที่ตกลงและตรวจสอบจากแชทกับ repository เพื่อไม่ให้สถานะใน repo คลาดเคลื่อนจากสิ่งที่ทำจริง

## 1. หลักการของระบบ

Configuration เป็น compatibility/configuration composition layer สำหรับสร้างและแปลงการตั้งค่าไปยัง Target หลายรูปแบบ ไม่ใช่ VPN engine, proxy engine หรือระบบนำเข้าโปรไฟล์ของแอปเป้าหมาย

- Core ต้องไม่ผูกกับ Apple หรือ Target ใด Target หนึ่ง
- รูปแบบและข้อจำกัดเฉพาะ Target อยู่ใน target manifest, adapter และ exporter
- ต้องรักษาข้อมูลความสามารถเฉพาะของ provider/Target ไว้ ไม่ลดข้อมูลทิ้งโดยไม่มีเหตุผล
- ถ้า Target ไม่สามารถแทนความหมายบางอย่างได้ ต้องรายงานข้อจำกัดแทนการสร้างรูปแบบปลอม
- ห้ามอ้างว่า Target ใช้งานจริงได้เพียงเพราะมี exporter ต้องมีหลักฐานจากการทดสอบจริง
- ห้าม commit private key, password, token, certificate หรือข้อมูลส่วนบุคคล

## 2. DNS data model

DNS profile คือชุดที่ผู้ใช้ตั้งชื่อเอง ไม่ใช่ DNS 1 / DNS 2 / DNS 3

แต่ละ profile เก็บอย่างน้อย: id, name, provider, protocol, servers, endpoint, role/capability, enabled, order และ rules เมื่อมี

คู่ DNS ของ provider เดียวกัน เช่น Cloudflare 1.1.1.1 + 1.0.0.1 ถือเป็น profile เดียว

Core รองรับจำนวน dnsProfiles[] ได้มากกว่า 3 และไม่ได้ล็อกจำนวนไว้ที่ 3 การใช้ 1–3 ชุดเป็นเพียงแนวทางสำหรับผู้ใช้ทั่วไป ไม่ใช่ข้อจำกัดของ data model

UI ปัจจุบันตั้งต้นด้วย 3 ชุด:

1. Privacy DNS · Cloudflare 1.1.1.1 · 1.1.1.1, 1.0.0.1
2. Security DNS · Quad9 Secure · 9.9.9.9, 149.112.112.112
3. Backup DNS · Google Public DNS · 8.8.8.8, 8.8.4.4

ค่าตั้งต้นเหล่านี้เป็น preset ไม่ใช่การบังคับให้ทุก configuration ต้องมี 3 ชุด

## 3. DNS provider catalog

Catalog มี preset ของ Google Public DNS, Cloudflare, Quad9 และผู้ให้บริการสาธารณะรายอื่น ๆ รวมถึง DoH/DoT เมื่อมีข้อมูล endpoint จริง

Provider preset ต้องเติมค่าจริงจาก catalog และไม่สร้าง endpoint หรือ IP สมมติ

Protocol และ role/capability แยกกัน: Protocol คือ transport เช่น DoH/HTTPS, DoT/TLS และ plain DNS; role คือ resolver, security/threat, privacy, tracker filtering, custom rules ฯลฯ

## 4. DNS pipeline

DNS profile หลายชุดไม่เท่ากับ DNS pipeline

Pipeline ใช้เมื่อจำเป็นต้องมี processing semantics: PASS, RESPOND, BLOCK, FORWARD และ ERROR

PASS ไป stage ถัดไป ส่วนผลที่ handle แล้วจบ pipeline ตาม semantics เว้นแต่ Target adapter จะกำหนดพฤติกรรมอื่นไว้อย่างมีเอกสาร

Remote resolver A → B → C ไม่ควรถูกตีความว่าเป็น filter chain เพียงเพราะเรียงลำดับกัน เพราะ upstream resolver โดยทั่วไปเป็น resolver/failover ไม่ใช่ตัวกรองที่ส่ง query ต่อเมื่อไม่มีสิ่งให้ทำ

Controller/processing layer เป็นผู้กำหนด semantics และเรียก handler ของแต่ละ stage

## 5. Web Entry

Core มี webEntry เป็นความสามารถทั่วไป: name, URL, optional icon และ enabled

Target adapter เป็นผู้แปลงรูปแบบ สำหรับ Apple สามารถแปลงเป็น com.apple.webClip.managed เมื่อ Target รองรับ

Web Entry ไม่ใช่แนวคิดที่ผูกกับ Apple

## 6. Apple

Apple เป็น Target adapter หนึ่ง ไม่ใช่ศูนย์กลางของ Core

สิ่งที่มีอยู่: MobileConfig exporter, Web Clip payload, Wi-Fi payload, VPN payload, Global HTTP Proxy payload และ Declarative DNS exporter/reference พร้อม validation/warnings

Legacy com.apple.dnsSettings.managed ต้องแยกจาก Declarative Management และไม่ควรถือเป็นรูปแบบสมัยใหม่โดยอัตโนมัติ

Apple profile หนึ่ง profile สามารถมีหลาย payload ได้ แต่แต่ละ payload ต้องมีความหมายและ dependency ที่ถูกต้อง

Certificate ไม่ใช่ dependency กลาง ต้องใช้เมื่อ Target/payload นั้นต้องการจริงเท่านั้น

## 7. Wizard/UI

รูปแบบ UX ที่ตกลงกันสำหรับระยะต่อไป: DNS → Wi-Fi → VPN → Proxy → Web App → Review / Export

แต่ละขั้นควรมีปุ่ม ข้ามขั้นตอน และเมื่อข้ามขั้นตอนต้องไม่สร้าง payload หรือ configuration component ของขั้นนั้น

ทุก input ที่มี standard options ควรมี preset ที่ใช้ค่าจริง และมี Custom เมื่อเหมาะสม

สถานะปัจจุบัน: หน้าเว็บยังเป็น flow 3 ส่วน Basic → Destination → Export และยังไม่ได้เปลี่ยนเป็น wizard 6 ขั้น ดังนั้นยังไม่ถือว่า wizard เสร็จ

DNS UI มี profile cards หลายชุดและแก้ชื่อ/provider/protocol/role/server/endpoint/enabled ได้ แต่ยังไม่มี UI เพิ่ม/ลบ profile แบบอิสระ แม้ Core รองรับจำนวนไม่จำกัด

## 8. Target/export behavior

เป้าหมายคือให้ Target adapter เก็บ DNS profiles ไว้และส่งออกตามความสามารถจริงของแต่ละ format

ห้ามลดทุก profile เหลือ profile เดียวโดยไม่แจ้ง ถ้า format ของ Target รองรับได้เพียงบางความหมาย ให้ compatibility report ระบุข้อจำกัด

Target ใน UI/export registry ได้แก่ Apple MobileConfig, Surge, Shadowrocket, Quantumult X, WireGuard, Loon, Stash/Mihomo และ Target อ้างอิงอื่นตาม registry

Evidence ที่บันทึกไว้: Surge 5.x verified จากหลักฐานใน repo; Shadowrocket partial; WireGuard partial; Target อื่น reference/template จนกว่าจะมีหลักฐานจริงเพียงพอ

## 9. DNS benchmark

Browser benchmark แยกจากหน้า Configuration หลัก:
- apps/web/public/dns-benchmark.html
- apps/web/public/userscripts/dns-benchmark.user.js
- apps/web/public/dns-benchmark-README.md

Browser benchmark วัดพฤติกรรมการเปิดเว็บจริง ไม่ใช่ DNS latency โดยตรง เพราะเวลารวม DNS, connection, TLS/QUIC, server response, redirect และ page behavior

ชุดทดสอบที่บันทึกไว้ใช้ 1.1.1.1 และ 1.0.0.1 และจงใจไม่ใช้ DNS ของ router ที่สังเกตได้คือ 94.140.14.15 และ 94.140.14.16

ยังไม่มีข้อสรุปว่า resolver ใดเร็วหรือดีกว่าโดยไม่มี benchmark จริง

## 10. iPhone Shortcut / Pyto

มี tools/pyto/dns_benchmark_builder.py

หน้าที่คือสร้างไฟล์ DNS Benchmark.shortcut แล้วเปิด Share Sheet ให้ผู้ใช้เลือก Shortcuts และยืนยัน import

Pyto ไม่สามารถติดตั้ง Shortcut เข้าฐานข้อมูล Shortcuts ของ iOS แบบเงียบ ๆ และ builder ไม่เปลี่ยน system DNS

รุ่นปัจจุบันเป็น smoke test ของการเรียก DoH ไปยัง Cloudflare, Google Public DNS และ Quad9

ยังไม่ถือเป็น benchmark ฉบับสมบูรณ์ เพราะยังไม่มีการสลับ system DNS จริงจาก Shortcut, workflow หลายรอบ/หลายโดเมนฉบับเต็ม, median/P95/P99, ผลเปรียบเทียบจากอุปกรณ์จริง และการรับประกันว่า binary .shortcut จะ import ได้กับทุก iOS build

## 11. Testing / CI

Commit ae5c808e989d64984158d90df5c6fd5b93120722 ซึ่งเพิ่ม/กู้คืน multi-profile DNS UI มี Verify workflow ผ่านแล้ว

README ถูก sync สถานะเป็น commit 4e286ea8d2ee654c19b6f69f7cfecce3da0819c7

การตรวจครั้งล่าสุดยืนยัน workflow สำเร็จของ commit ae5c808e989d64984158d90df5c6fd5b93120722

หลัง commit README ใหม่ ต้องตรวจ workflow ของ commit ใหม่นี้แยกก่อนอ้างว่า CI ผ่าน

## 12. สิ่งที่ยังต้องทำ

1. เปลี่ยนหน้าเว็บจาก 3-section flow เป็น wizard 6 ขั้น
2. เพิ่ม skip semantics และไม่สร้าง payload ของขั้นที่ข้าม
3. เพิ่มการเพิ่ม/ลบ DNS profile แบบอิสระใน UI
4. ตรวจ exporter ของแต่ละ Target ว่ารักษา DNS profiles ได้ครบตาม semantics จริง
5. เพิ่ม compatibility diagnostics เมื่อ Target แทนหลาย profile หรือ pipeline ได้ไม่ครบ
6. ตรวจ Apple declarative DNS ให้ตรงกับ capability/version ที่ Target รองรับจริง
7. ทำ certificate/signing เฉพาะจุดที่ Target ต้องการ หลัง core/export semantics นิ่ง
8. ขยาย benchmark จาก browser-load benchmark ไปสู่ resolver-level measurement ที่วัดสิ่งที่ต้องการจริง
9. ขยาย Pyto Shortcut จาก smoke test ไปสู่ workflow benchmark ที่พิสูจน์บน iPhone จริง
10. รันและบันทึกผลทดสอบจริงของ Target ก่อนเลื่อน evidence status

## 13. สิ่งที่ไม่ควรทำ

- ไม่ล็อก DNS ไว้ที่ 3 ใน Core
- ไม่ใช้ชื่อ DNS 1/2/3 แทนชื่อชุดของผู้ใช้
- ไม่ถือคู่ DNS ของ provider เดียวกันเป็นสอง stage
- ไม่ตีความ upstream resolver หลายตัวเป็น filter pipeline อัตโนมัติ
- ไม่สร้าง endpoint/IP/credential ที่ไม่มีแหล่งจริง
- ไม่บอกว่า Target ใช้งานจริงได้เพียงเพราะ exporter สร้างไฟล์ได้
- ไม่บังคับ certificate เป็น dependency ทุก configuration
- ไม่เอา benchmark มาปนกับหน้า Configuration หลักโดยไม่จำเป็น

## DNS Controller runtime

Core now contains a dedicated DnsController at packages/core/src/dns-controller.js.

It executes ordered processing stages, stops on BLOCK or RESPOND, continues after PASS, then selects enabled resolver profiles in order. Resolver transport is injected so the Core does not confuse a remote resolver with a filtering stage. The controller records a trace for diagnostics and testing.

The Core controller and its flow tests are implemented. A real network transport/listener and device-level DNS interception remain separate runtime and target tasks and are not marked complete.
