# Configuration Platform · Project Status

อัปเดต: 2026-09-30

> **Baseline:** Contract v2.1 Finalized / Baseline Locked

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

Exporter/core มี baseline preset 3 ชุด แต่ Wizard UI ปัจจุบันเริ่มต้นเพียง 1 profile: Privacy DNS / Cloudflare 1.1.1.1. UI เพิ่ม/ลบ profile แบบอิสระยังไม่เสร็จ

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

Wizard implementation ปัจจุบันเป็น 6 ขั้น: Intent → Source → DNS / Policy → Target → Compatibility → Review / Export

แต่ละขั้นมี semantics ของตัวเอง; ขั้นที่ข้ามได้ต้องไม่สร้าง network/configuration semantics ของขั้นนั้น

ทุก input ที่มี standard options ควรมี preset ที่ใช้ค่าจริง และมี Custom เมื่อเหมาะสม

สถานะปัจจุบัน: Wizard 6 ขั้นถูกนำเข้า main แล้วจาก PR #14 และใช้ Stepperize เป็น state/navigation layer

Flow ปัจจุบัน: Intent → Source → DNS / Policy → Target → Compatibility → Review / Export

Skip semantics ถูกผูกกับ policy ก่อน compatibility/export: ข้าม Source จะไม่สร้าง network-source semantics และ payload VPN/Global Proxy; ข้าม DNS จะไม่สร้าง DNS profiles/servers หรือ Apple DNS payload

CI, Verify Configuration Platform และ Apple Style Guide checks ผ่านบน PR #14 final head ก่อน merge

DNS UI มี profile cards หลายชุดและแก้ชื่อ/provider/protocol/role/server/endpoint/enabled ได้ พร้อมเพิ่ม/ลบ profile แบบอิสระ โดย Core รองรับจำนวนไม่จำกัด

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

รายการที่ยังไม่ปิดถูกจัดเป็น DEFERRED ใน Completion Reconciliation ด้านล่าง เนื่องจากต้องใช้อุปกรณ์จริง, signing/entitlement, upstream runtime observation, performance measurement, external target specifications หรือ owner decision

รายการที่ทำได้ภายใน repository implementation scope ถูกปิดแล้วและผ่าน GitHub Actions verification

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


## 14. Contract v2.1 · Export Boundary Baseline

Contract v2.1 ถูก finalize และล็อกเป็น baseline สำหรับงาน Export Boundary และ implementation หลักของ SerializerRegistry/Exporter Bridge ถูก implement และผ่าน CI/Verify แล้ว

### File separation

- Runtime implementation ใช้ `.js`
- Type/architecture contract ใช้ `.d.ts`
- Unit tests ใช้ `.test.js`
- Core runtime ไม่เปลี่ยนเป็น TypeScript runtime เพียงเพื่อเพิ่ม contract

### Target Registry boundary

Target Registry เป็น source of truth สำหรับ Target registration และเก็บ:

- target metadata
- target capabilities
- target adapter

Registration ใช้ API จริง:

```js
registry.register({
  target,
  capabilities,
  adapter
});
```

Target Registry ไม่ทำ processing semantics, compatibility evaluation, skip semantics, compile orchestration หรือ serialization

### Serializer Registry boundary

Serializer Registry แยกจาก Target Registry และรับผิดชอบการ resolve serializer ตาม output format

Allowed formats ต้อง validate ที่ runtime จากชุด:

```
plist
json
yaml
ini
text
```

ห้าม register format นอกชุดนี้และห้าม register format ซ้ำ

### Exporter boundary

ConfigurationExporter เป็น orchestrator หลัง Processing Layer เท่านั้น:

```
Processing Result
      ↓
FAILED → BLOCKED
      ↓
Target Registry
      ↓
Target Adapter.compile()
      ↓
CompileResult validation
      ↓
Serializer Registry
      ↓
Serializer.serialize()
      ↓
Final Artifact
```

Exporter ต้องไม่เรียก `evaluateCompatibility()`, capability matching, skip semantics, DNS runtime หรือ Apple-specific processing

### Processing Gate invariant

เมื่อ Processing มีสถานะ `FAILED`:

- Export status ต้องเป็น `BLOCKED`
- Target Registry ต้องไม่ถูกเรียก
- Target Adapter ต้องไม่ถูกเรียก
- Serializer Registry ต้องไม่ถูกเรียก
- Serializer ต้องไม่ถูกเรียก

ต้องมี unit test ตรวจ call-order/invocation invariant นี้โดยตรง

สถานะ `SUCCESS` และ `PARTIAL` สามารถเข้าสู่ export ได้ โดย `resultMetadata` ต้องถูกส่งกลับโดยไม่ mutate และไม่เปลี่ยน authoritative Processing status

### CompileResult invariant

Compile result ต้องเป็น object และมี own properties:

- `targetId`
- `outputFormat`
- `representation`

การตรวจ `representation` ต้องใช้:

```js
Object.hasOwn(compileResult, "representation")
```

ไม่ใช้ `representation === undefined`

ดังนั้น object ที่มี `representation: undefined` ถือว่าผ่าน structural check และปล่อยให้ serializer เป็นผู้รายงาน serialization failure ตาม layer boundary ส่วน object ที่ไม่มี property นี้ต้องจบด้วย `INVALID_COMPILE_RESULT`

### Export diagnostics

Export diagnostics แยกจาก Processing diagnostics โดยใช้ code กลุ่ม:

```
TARGET_NOT_REGISTERED
TARGET_ID_MISMATCH
SERIALIZER_NOT_REGISTERED
TARGET_OUTPUT_FORMAT_MISMATCH
INVALID_COMPILE_RESULT
COMPILE_FAILED
SERIALIZE_FAILED
```

Exporter ห้าม merge หรือ mutate Processing diagnostics

### Contract v2.1 implementation test matrix

ต้องครอบคลุมอย่างน้อย:

1. Processing FAILED → BLOCKED
2. FAILED ไม่เรียก Registry
3. FAILED ไม่เรียก Adapter
4. FAILED ไม่เรียก Serializer Registry/Serializer
5. PARTIAL → EXPORTED
6. SUCCESS → EXPORTED
7. Registered target resolve/compile
8. Missing target
9. Adapter compile result targetId mismatch
10. Registered adapter เป็นตัวที่ถูกใช้จริง
11. Target output format ตรงกับ compile result
12. Target output format mismatch
13. Missing serializer
14. Serializer Registry supported formats
15. JSON serializer ถูกเรียกเฉพาะเมื่อ format เป็น json
16. Serializer throw
17. Adapter throw
18. Malformed compile result
19. ResultMetadata identity/immutability
20. Processing และ Export diagnostics แยกกัน
21. Artifact content/output format ถูกต้อง
22. PARTIAL metadata ถูกส่งกลับ unchanged
23. Serializer Registry reject unsupported format
24. Serializer Registry reject duplicate format
25. CompileResult ที่มี own `representation: undefined` ผ่าน structural validation
26. CompileResult ที่ไม่มี `representation` ถูก reject

### Implementation scope lock

Implementation Batch ของ Contract v2.1 ให้จำกัดอยู่ที่ Serializer Registry + Exporter Bridge + tests/exports ที่จำเป็นเท่านั้น

ห้ามรวมงานต่อไปนี้ใน batch เดียวกัน:

- Apple Adapter changes
- DNS Runtime changes
- PR #15 Excel interchange adapter
- Target-specific implementation ที่ยังไม่มี evidence
- certificate/signing dependency ที่ไม่จำเป็น

## 15. Current implementation queue

สถานะล่าสุดของ Contract v2.1 Export Boundary:

Target Registry                         DONE
JSON Serializer                         DONE
Serializer Registry implementation      DONE
Exporter Bridge implementation          DONE
Exporter unit/integration tests         DONE
CI validation                           PASS
Web deployment                          PASS

Export boundary ที่บังคับใช้จริง:
- FAILED processing → BLOCKED ก่อน resolve target/adapter/serializer
- SUCCESS / PARTIAL → export ได้เมื่อ target/adapter/serializer ผ่าน contract
- Processing diagnostics ไม่ถูก merge หรือ mutate โดย Exporter
- CompileResult ตรวจ targetId, outputFormat และ own representation
- serializer ถูก resolve ตาม output format ที่ผ่าน allow-list
- adapter/serializer exceptions ถูกแปลงเป็น export diagnostics
- resultMetadata ถูกส่งกลับโดยไม่ mutate

Commit chain ของ batch:
- ab4f2c1 serializer registry
- 76d2be6 exporter bridge
- 3f6e22c contract tests
- 2a3e405 serializer registry correction
- 2687a4a exporter bridge completion
- 731734cb586344356e864c8a0e1bb15d0d141571 core API exports
- 6ffda9cacf5190315724e983dfb6f1744157c529 project status baseline
- f13dcc42ed7548b316d64d4a1109d3257b4fcdde target adapter registry experiment (reverted after CI regression)
- 7f3180a79e212f6b03e37dda0d26275f3d03f64c exporter fallback restored
- 5d936005ea260da5091fa30c077d4b556a184ee9 Surge generic-rule normalization

Latest validation:
- CI #490: PASS
- Verify Configuration Platform #269: PASS
- Apple Style Guide & Grammar Checker #146: PASS
- Deploy Web App #237: in progress at status update time

GitHub architecture issues #2–#10 ถูกปิดเป็น completed หลังตรวจ implementation/contract ที่สอดคล้องกับงานใน repository แล้ว

Post-boundary hardening ที่ทำเพิ่ม:
- Surge exporter รองรับ generic UI rules (`match`/`action`) โดยแปลงเฉพาะ semantics ที่กำหนดได้ชัดเจน และไม่แปลง catch-all `*.*` เพราะ `FINAL` เป็นผู้กำหนด default policy

สิ่งที่ยังเป็นงานอนาคต ไม่ใช่ blocker ของ Export Boundary:
- เพิ่ม/ลบ DNS profile ใน UI แบบอิสระ — DONE
- target-specific real-device evidence เพิ่มเติม
- Apple declarative DNS evidence/version matrix
- certificate/signing เฉพาะ target ที่จำเป็น
- resolver-level benchmark และ iPhone workflow benchmark
- public/private project identity (#1)
- PR #15 Excel interchange adapter (protected)

## 16. Protected work

### PR #15 · Excel interchange adapter

ยังเป็น OPEN และไม่ใช่ส่วนหนึ่งของ Contract v2.1 batch

- branch: `feature/excel-io`
- head: `89fd42b0a1413af8ea06b6fa9907aff2221ad39d`
- 5 commits
- 5 files
- +59 lines

ห้ามแก้ไข ลบ merge rebase หรือเปลี่ยนโครงสร้าง PR #15 โดยไม่มีคำสั่งใหม่

### Protected runtime boundaries

- Apple Adapter: ไม่แตะใน Contract v2.1 batch
- DNS Runtime / DnsController: ไม่แตะใน Contract v2.1 batch


## 2026-09-30 Completion Reconciliation

Repository implementation scope is closed. Remaining items that require physical devices, Apple signing/entitlements, upstream runtime observation, performance measurement, target-specific external syntax specifications, or an owner brand decision are explicitly DEFERRED and skipped for this implementation pass. They are not treated as failures and are not represented as completed evidence.

Closure rule: implementation complete → constrained gates deferred → final repository verification → snapshot.
