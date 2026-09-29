# แผนพัฒนา

## ระยะที่ 0 — พื้นฐาน
- [x] กำหนดทิศทางโครงการ
- [x] กำหนดคำศัพท์หลัก
- [x] วางโครงสร้าง Repository
- [ ] กำหนดขอบเขตส่วนที่เปิดเผยและส่วนที่เป็นส่วนตัวให้เสร็จสมบูรณ์
- [ ] กำหนดแบรนด์ของโครงการให้เสร็จสมบูรณ์

## ระยะที่ 1 — โมเดลนโยบายมาตรฐานกลาง
- [x] กำหนดโครงสร้างนโยบาย
- [ ] กำหนดโครงสร้างโปรไฟล์
- [ ] กำหนดโครงสร้าง Target
- [ ] กำหนดโครงสร้างความสามารถ
- [x] กำหนดโมเดลการวินิจฉัย
- [ ] กำหนดรายการข้อมูลกำกับของชุดผลลัพธ์

## ระยะที่ 2 — เครื่องยนต์ความสามารถ
- [ ] ทะเบียนความสามารถ
- [ ] สถานะ รองรับ / จำกัด / แปลงได้ / สูญเสียข้อมูล / ไม่รองรับ
- [ ] การเจรจาความสามารถ
- [ ] การวินิจฉัยความสามารถ

## ระยะที่ 3 — คอมไพเลอร์
- [x] การทำข้อมูลให้เป็นรูปแบบมาตรฐาน
- [ ] การแมปเชิงความหมาย
- [ ] กระบวนการคอมไพล์
- [ ] ผลลัพธ์ที่กำหนดแน่นอน
- [ ] รายงานการคอมไพล์

## ระยะที่ 4 — Target Adapter
- [x] iOS MobileConfig
- [x] Apple DNS declaration
- [x] Apple Web Clip
- [x] การแจ้งเตือนแบบ context-aware สำหรับความสามารถที่อาจต้องใช้ Extension
- [ ] Surge
- [ ] Mihomo / Clash-compatible
- [ ] WireGuard
- [ ] adapter สำหรับระบบปฏิบัติการและ runtime แบบ native

## ระยะที่ 5 — การนำเข้า
- [ ] ตัวแยกวิเคราะห์ของ Target
- [ ] การแปลงเป็นรูปแบบมาตรฐานกลาง
- [ ] การวินิจฉัยการนำเข้า
- [ ] การทดสอบไป-กลับ

## ระยะที่ 6 — เว็บแอปพลิเคชัน
- [x] ตัวสร้างนโยบาย
- [x] การเลือก Target
- [x] การแสดงความสามารถที่รองรับ
- [x] ตัวอย่างการตั้งค่า
- [x] การส่งออก
- [x] การสร้างชุดผลลัพธ์
- [x] Knowledge Page

## ระยะที่ 7 — ความปลอดภัยและความเป็นส่วนตัว
- [ ] ประมวลผลภายในเครื่องเป็นหลัก
- [ ] การจัดการข้อมูลลับ
- [ ] โมเดลความเป็นส่วนตัว
- [ ] โมเดลภัยคุกคาม
- [ ] ระบบระบุแหล่งข้อมูลจากบุคคลที่สาม

## ระยะที่ 8 — ห้องทดสอบความเข้ากันได้
- [ ] การทดสอบรูปแบบไวยากรณ์
- [ ] การทดสอบโครงสร้างข้อมูล
- [ ] การทดสอบความหมาย
- [ ] ชุดข้อมูลทดสอบความเข้ากันได้กับ Target
- [ ] ชุดทดสอบถดถอย

## ระยะที่ 9 — เผยแพร่สู่สาธารณะ
- [ ] เอกสาร
- [ ] คู่มือการมีส่วนร่วม
- [ ] นโยบายความปลอดภัย
- [ ] ระบบอัตโนมัติสำหรับการเผยแพร่
- [ ] โครงสร้างข้อมูลที่มีเวอร์ชัน

---

# Repository Reconciliation — 2026-09-30

> สถานะ: VERIFIED inventory / RECONCILIATION COMPLETE / FILE AUDIT REQUIRED

## 1. Repository inventory

| Repository | บทบาทหลัก | สิ่งที่นำมาใช้ |
|---|---|---|
| prasong-me/LoopController | iOS/Swift Network Controller | Native Apple / NetworkExtension runtime boundary |
| prasong-me/Network-Configuration | Engineering Core / Contract / Capability / Adapter architecture | Common Model, Target Capability, Adapter boundary, Contract v2.1, diagnostics, conflict, validation |
| prasong-me/-Configuration- | Configuration Platform + Web App + Target exporters + evidence/runtime integration | Web App, wizard, search, exporters, Apple MobileConfig, declarative DNS, runtime source generation |
| prasong-me/rongyok-video-player | Web/PWA video player เน้น iOS/iPadOS/mobile UX | responsive UI, safe-area, 44px controls, fullscreen, local storage, PWA patterns |

## 2. สิ่งที่ต้องดึงจากแต่ละ repository

### LoopController
- ใช้เป็น reference สำหรับ native Apple/network runtime เท่านั้น
- ครอบคลุม Swift project structure, Packet Tunnel foundation, Loopback/DNS/Security Profile และ NetworkExtension boundary
- ห้ามย้าย native runtime implementation เข้ามาเป็น Web Core
- สถานะ: REFERENCE / SEPARATE RUNTIME LAYER

### Network-Configuration
- รักษา Common Configuration Model, Target Capability Model และ Adapter boundary
- รักษา Normalize → Validate → Capability → Compile → Adapter → Serializer → Validator → Test
- รักษา structured diagnostics และ conflict-as-information
- Contract v2.1 เป็น frozen baseline
- UNKNOWN / unsupported ต้อง fail-closed
- Target-specific implementation ห้ามย้อนกลับมากำหนด Core semantics
- สถานะ: ARCHITECTURAL SOURCE / CONTRACT REFERENCE

### -Configuration-
- เป็น PRIMARY IMPLEMENTATION REPOSITORY
- มี React + Vite + Stepperize
- Wizard ปัจจุบัน: Intent → Source → DNS / Policy → Target → Compatibility → Review / Export
- มี Registry + Catalog search, capability diagnostics, target manifest, exporters, Apple MobileConfig, Apple declarative DNS reference, Surge adapter และ Apple runtime work
- มี automated tests, evidence register และ Knowledge/DNS benchmark pages

### rongyok-video-player
- ใช้เป็น UI/UX reference เท่านั้น
- นำหลัก mobile-first, safe-area, viewport-fit, touch target ≥ 44px, responsive grid, fullscreen capability detection, localStorage error handling และ PWA/service worker มาใช้ได้
- ห้ามนำ video player state, proxy extraction หรือ domain-specific storage schema เข้ามาเป็น Configuration domain
- สถานะ: UI/UX REFERENCE ONLY

## 3. Delta: Roadmap เดิม vs repository ที่ตรวจพบ

| หัวข้อ | เดิม | ตรวจพบ | ผลกระทบ |
|---|---|---|---|
| Wizard | เคยระบุ DNS → Wi-Fi → VPN → Proxy → Web App → Review | code/test ปัจจุบันเป็น Intent → Source → DNS/Policy → Target → Compatibility → Review | ต้องแก้เอกสารให้ใช้ flow เดียว |
| DNS profiles | README ระบุ UI ตั้งต้น 3 profiles | WizardApp state ตั้งต้น 1; exporter default มี 3 | conflict ระหว่าง UI กับ exporter/model |
| Surge | roadmap ยัง pending | manifest/exporter ระบุ verified และ evidence 15 real-device tests | ต้องอัปเดต roadmap/docs |
| Mihomo | pending | template exporter + official reference; runtime ยังไม่ verified | ยังไม่ควรเรียก supported |
| WireGuard | pending | partial-tested 1 observation | รักษาสถานะ partial |
| Shadowrocket | pending | partial-tested 1 DNS observation | รักษาสถานะ partial |
| Loon/Stash/Quantumult X | pending | template exporters มีแล้ว แต่ runtime ยังไม่ verified | implemented-template / unverified |
| Apple MobileConfig | marked complete | generator มีจริง แต่ manifest เป็น generated ไม่ใช่ device-verified | แยก implementation กับ validation |
| Apple DNS declaration | marked complete | reference exporter มีจริง | ไม่เท่ากับ physical-device validation |
| Apple runtime | roadmap เดิมไม่ละเอียด | มี Provider Runtime, Flow I/O, DNS wire, NetworkExtension compile/runtime work | ต้องแยกเป็น runtime phase |
| Import/round-trip | pending | ยังไม่พบ parser/round-trip เทียบเท่า exporter | คง pending |
| Evidence | กระจายตาม phase | มี evidence register + target evidence | เพิ่มเป็น release gate ข้าม phase |

## 4. Web construction baseline

Web Shell → Discovery/Search → Intent → Source/Policy → DNS/Policy → Target Selection → Compatibility/Diagnostics → Review → Export/Share

Boundary: UI → Canonical Policy → Core/Capability Engine → Target Manifest → Adapter → Serializer/Artifact → Validator/Diagnostics

UI ต้องไม่กระจาย Target-specific serialization logic ใน component

## 5. Mobile-first UI baseline
- safe-area aware layout
- responsive width และ no horizontal overflow
- interactive control อย่างน้อย 44px
- iOS viewport compatibility
- fullscreen/share ใช้ capability detection
- local state/storage ต้องมี error handling
- PWA behavior แยกจาก configuration semantics

## 6. Native Apple boundary
Web Configuration → Configuration Artifact → Apple Target Adapter → Optional Native Runtime / NetworkExtension → Physical Device

Web exporter ไม่ถือเป็นหลักฐานว่า native runtime ใช้งานจริง

## 7. ข้อผิดพลาด / ข้อมูลตกหล่นที่ตรวจพบ

### E-01 — Wizard documentation drift
เอกสารบางส่วนใช้ flow เก่า แต่ implementation/test ยืนยัน flow 6 ขั้นปัจจุบัน
สถานะ: VERIFIED CONFLICT

### E-02 — DNS profile count mismatch
README ระบุ UI ตั้งต้น 3 profiles แต่ WizardApp ตั้งต้น 1 profile ขณะที่ exporter default มี 3
สถานะ: VERIFIED CONFLICT

### E-03 — Surge documentation drift
target manifest/exporter ระบุ verified + 15 real-device tests แต่ docs/targets/surge.md ยังใช้ถ้อยคำระดับเริ่มออกแบบ serializer
สถานะ: VERIFIED DOCUMENTATION DRIFT
หมายเหตุ: verified มีขอบเขตตาม evidence ไม่ได้หมายความว่า capability ทุก field ถูก verify

### E-04 — Apple status ambiguity
ROADMAP ใช้ [x] กับ Apple features ขณะที่ target manifest ใช้ generated/reference-export และ apple-network ระบุว่ายังไม่มี Apple Target Adapter ที่เป็น SUPPORTED
สถานะ: VERIFIED SEMANTIC AMBIGUITY

### E-05 — duplicate/legacy browser MobileConfig generator
apps/web/src/mobileconfig.js มี Web Clip MobileConfig generator แยกจาก packages/apple-adapter/src/index.js และยังต้องตรวจ usage ก่อนรวม/ลบ
สถานะ: PENDING USAGE AUDIT

### E-06 — exporter != capability verification
การมี exporter/template ไม่ได้แปลว่า capability ถูก verify และไม่เท่ากับ physical runtime validation
สถานะ: VERIFIED ARCHITECTURAL RULE

## 8. ข้อมูลที่ต้องตรวจต่อ
1. ตรวจ usage ของ apps/web/src/mobileconfig.js
2. ทำให้ README/PROJECT-STATUS/ROADMAP ใช้ wizard flow เดียวกัน
3. ทำ DNS preset/catalog ให้ตรงกันระหว่าง UI, core และ exporter
4. ตรวจ target status ทุกตัวกับ test-evidence.js
5. แยก implemented / syntax-tested / real-device-tested / runtime-validated ใน roadmap
6. ตรวจ import/round-trip ว่ามี implementation ซ่อนอยู่หรือไม่
7. ตรวจ Apple runtime docs กับ latest evidence ไม่ให้ปะปนกับ exporter evidence
8. หลังแก้ drift ให้อ่านไฟล์ที่แก้ซ้ำอีกรอบ

## 9. Roadmap ใหม่หลัง reconciliation
### Gate A — Repository/Data Reconciliation
- [x] Inventory repository ทั้งหมด
- [x] อ่าน role ของแต่ละ repository แยกกัน
- [x] ดึง web/UI implementation reference
- [x] ดึง architecture/contract reference
- [x] ดึง native Apple/runtime reference
- [x] ดึง mobile/PWA UI reference
- [x] เปรียบเทียบ roadmap เดิมกับ implementation จริง
- [x] บันทึก conflict และ missing information
- [ ] แก้ documentation drift ทั้งชุด
- [ ] ตรวจซ้ำหลังแก้ drift

### Gate B — Canonical Architecture
- [x] Common Model
- [x] Capability Model
- [x] Adapter boundary
- [x] Diagnostic model
- [x] Fail-closed / UNKNOWN semantics
- [x] Contract v2.1 baseline
- [ ] Reconcile Target Profile contract shape
- [ ] Reconcile profile schema กับ actual Web UI model

### Gate C — Web Application
- [x] React + Vite shell
- [x] Discovery/Search
- [x] Wizard state/navigation
- [x] Canonical policy generation
- [x] Target selection
- [x] Compatibility diagnostics
- [x] Export/download/share
- [x] Knowledge page
- [ ] DNS profile add/remove UI
- [ ] Web UI fields parity กับ canonical policy
- [ ] UI capability states ต้องอธิบาย UNKNOWN/UNSUPPORTED/EXTENSION-BACKED
- [ ] Final mobile-first UI audit

### Gate D — Target Export
- [x] Apple MobileConfig implementation
- [x] Apple declarative DNS reference export
- [x] Apple legacy DNS export boundary
- [x] Surge exporter
- [x] Mihomo template exporter
- [x] WireGuard template exporter
- [x] Shadowrocket template exporter
- [x] Loon template exporter
- [x] Stash template exporter
- [x] Quantumult X template exporter
- [ ] Target capability verification per feature
- [ ] Real-device verification where applicable
- [ ] Import/round-trip testing

### Gate E — Native Apple Runtime
- [x] Provider Runtime contract/IR
- [x] Flow I/O contract/runtime
- [x] DNS wire parser/runtime
- [x] DNS wire encoder/EDNS
- [x] Provider stage execution
- [x] Swift source generation
- [x] macOS compile/CI evidence where recorded
- [ ] Entitlement/signing/provisioning validation
- [ ] Physical device NetworkExtension runtime
- [ ] Upstream DNS transport end-to-end
- [ ] End-to-end DNS policy execution
- [ ] Performance/reliability/battery measurements

### Gate F — Evidence & Release
- [x] Target evidence model
- [x] Evidence register
- [x] Fail-closed diagnostics
- [ ] Complete target compatibility matrix
- [ ] Artifact validation matrix
- [ ] Regression matrix
- [ ] Documentation reconciliation
- [ ] Final source-of-truth snapshot

## 10. Status rule
IMPLEMENTED = มี code
SYNTAX-TESTED = artifact/format ผ่าน automated validation
REAL-DEVICE-TESTED = มี observation จาก target จริง
RUNTIME-VALIDATED = runtime behavior ถูกตรวจสอบ end-to-end
SUPPORTED = claim เฉพาะ capability ที่มี evidence รองรับ

ห้ามใช้ [x] เพียงอย่างเดียวเป็นหลักฐานว่า feature ใช้งานจริงบนอุปกรณ์

## 11. Audit completion rule
Inventory → Read → Compare → Extract differences → Merge baseline → Audit contradictions → Fix documentation → Re-read affected files → Final snapshot

ห้ามข้ามขั้นตอน Re-read affected files หลังการแก้ไข
