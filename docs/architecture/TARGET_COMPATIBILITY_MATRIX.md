# Target Compatibility Matrix — Repository Baseline 2026-09-30

สถานะนี้แยก implementation, syntax/evidence, real-device evidence และ runtime validation ออกจากกัน

| Target | Export implementation | Repository status | Evidence | Capability claim |
|---|---|---|---|---|
| Surge 5.x | Yes | verified | 15 real-device tests + profile generation | เฉพาะ capabilities ที่ manifest ระบุ SUPPORTED |
| Mihomo / Clash-compatible | Yes, template | template-export | official reference only | UNKNOWN จนกว่าจะมี target evidence |
| WireGuard | Yes, standard template | partial-tested | 1 real-device observation | ไม่ใช่ full compatibility |
| Shadowrocket | Yes, template | partial-tested | 1 DNS/runtime observation | ไม่ใช่ full compatibility |
| Loon | Yes, template | template-export | reference | UNKNOWN จนกว่าจะมี target evidence |
| Stash | Yes, template | template-export | official/reference | UNKNOWN จนกว่าจะมี target evidence |
| Quantumult X | Yes, template | template-export | reference | UNKNOWN จนกว่าจะมี target evidence |
| Apple MobileConfig | Yes | generated | exporter/runtime evidence แยกกัน | DNS/Web Entry ตาม manifest; extension-backed features ต้องมี provider/runtime ตามข้อจำกัด |
| Apple Network DNS Settings | Yes | reference-export | official format reference | DNS / DNS profiles / DNS resolution ตาม manifest |
| Apple DNSSettings legacy | Yes | legacy-export | official format reference | legacy DNS compatibility only |
| Apple DNS Provider Runtime | Yes, source generation | generated-source | compile/runtime evidence ต้องแยก | DNS runtime ตาม admitted Provider Runtime IR; ไม่ใช่หลักฐาน MobileConfig/DDM support |

## Release rule

1. Exporter exists ไม่เท่ากับ Supported.
2. Syntax-tested ไม่เท่ากับ Real-device-tested.
3. Real-device-tested ไม่เท่ากับ Runtime-validated.
4. Capability ที่เป็น UNKNOWN ต้องไม่ถูกแปลงเป็น SUPPORTED โดย fallback.
5. เมื่อ capability ไม่รองรับ target ต้อง fail-closed ด้วย diagnostic ที่ตรวจสอบได้.
6. Evidence ของ target ต้องอ้างอิงขอบเขตที่ทดสอบจริง ไม่ขยายเป็น claim ทุก feature.

## Web UI rule

Target card แสดงสถานะจาก Target Registry โดยตรง ส่วน compatibility panel แสดง capability state จาก compatibilityReport() ไม่ใช้ชื่อสถานะของ exporter แทน capability state.