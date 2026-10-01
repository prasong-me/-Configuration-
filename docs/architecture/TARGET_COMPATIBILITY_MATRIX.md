# Target Compatibility Matrix — Repository Baseline 2026-10-02

สถานะนี้แยก implementation, syntax/evidence, real-device evidence และ runtime validation ออกจากกัน

| Target | Export implementation | Repository status | Evidence | Capability claim |
|---|---|---|---|---|
| Surge 5.x | Yes | verified | repository/runtime evidence | เฉพาะ capabilities ที่ manifest ระบุ SUPPORTED |
| Mihomo / Clash-compatible | Yes, template | template-export | official reference + repository evidence | UNKNOWN จนกว่าจะมี target evidence |
| WireGuard | Yes, standard template | partial-tested | official protocol + 1 real-device observation | ไม่ใช่ full compatibility |
| Shadowrocket | Yes, template | partial-tested | official App Store capability evidence + 1 DNS/runtime observation | ไม่ใช่ full compatibility |
| Loon | Yes, template | template-export | official App Store identity evidence; syntax still pending | UNKNOWN จนกว่าจะมี target-specific syntax/capability evidence |
| Stash | Yes, template | template-export | official App Store capability evidence | UNKNOWN จนกว่าจะมี target-specific mapping/runtime evidence |
| Quantumult X | Yes, template | template-export | official App Store capability evidence | UNKNOWN จนกว่าจะมี target-specific mapping/runtime evidence |
| Apple MobileConfig | Yes | generated | official format reference + exporter/runtime evidence separated | DNS/Web Entry ตาม manifest; extension-backed features ต้องมี provider/runtime ตามข้อจำกัด |
| Apple Network DNS Settings | Yes | reference-export | official format reference | DNS / DNS profiles / DNS resolution ตาม manifest |
| Apple DNSSettings legacy | Yes | legacy-export | official format reference | legacy DNS compatibility only |
| Apple DNS Provider Runtime | Yes, source generation | generated-source | compile/runtime evidence ต้องแยก | DNS runtime ตาม admitted Provider Runtime IR; ไม่ใช่หลักฐาน MobileConfig/DDM support |

## Evidence records

- Loon official identity: `docs/evidence/LOON_OFFICIAL_IDENTITY_2026-10-02.md`
- Stash official capabilities: `docs/evidence/STASH_OFFICIAL_CAPABILITY_2026-10-02.md`
- Quantumult X official capabilities: `docs/evidence/QUANTUMULT_X_OFFICIAL_CAPABILITY_2026-10-02.md`
- Shadowrocket official capabilities: `docs/evidence/SHADOWROCKET_OFFICIAL_CAPABILITY_2026-10-02.md`

## Release rule

1. Exporter exists ไม่เท่ากับ Supported.
2. Syntax-tested ไม่เท่ากับ Real-device-tested.
3. Real-device-tested ไม่เท่ากับ Runtime-validated.
4. Capability ที่เป็น UNKNOWN ต้องไม่ถูกแปลงเป็น SUPPORTED โดย fallback.
5. เมื่อ capability ไม่รองรับ target ต้อง fail-closed ด้วย diagnostic ที่ตรวจสอบได้.
6. Evidence ของ target ต้องอ้างอิงขอบเขตที่ทดสอบจริง ไม่ขยายเป็น claim ทุก feature.

## Web UI rule

Target card แสดงสถานะจาก Target Registry โดยตรง ส่วน compatibility panel แสดง capability state จาก compatibilityReport() ไม่ใช้ชื่อสถานะของ exporter แทน capability state.
