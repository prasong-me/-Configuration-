# Configuration Platform — Project Summary & Detailed Roadmap

Repository: `prasong-me/-Configuration-`

อัปเดตเอกสาร: 2026-09-27

เอกสารนี้เป็น working specification สำหรับใช้ตรวจความตรงกันระหว่าง Core, Target exporters, UI, validation, CI และหลักฐานการทดสอบจริง

## 1. หลักการสำคัญ

สถาปัตยกรรมหลัก:

```
UI
 ↓
Core Configuration State
 ↓
Target Normalization
 ↓
Target Adapter / Exporter
 ↓
Payload / Artifact
 ↓
Serializer
 ↓
Validation + Compatibility Report
 ↓
Target Acceptance / Runtime Evidence
```

Core เป็น source of truth และต้องไม่ผูกกับ Apple หรือ Target ใด Target หนึ่ง

ต้องแยกสถานะ:

- Implemented = มีโค้ด
- Structurally tested = ผ่านการตรวจรูปแบบ
- Target accepted = อุปกรณ์/Target รับไฟล์
- Runtime tested = พฤติกรรมทำงานจริง
- Verified = มี evidence ที่ทำซ้ำได้และเก็บใน repository

การสร้างไฟล์สำเร็จไม่ถือเป็นหลักฐานว่า Target ทำงานจริง

## 2. รูปแบบจัดเก็บใน GitHub

โครงสร้างเป้าหมาย:

```text
/
├── apps/
│   └── web/
├── packages/
│   ├── core/
│   ├── apple-adapter/
│   └── targets/
├── scripts/
│   ├── validation/
│   ├── benchmark/
│   └── exporter/
├── tests/
│   ├── unit/
│   ├── integration/
│   └── fixtures/
├── evidence/
│   ├── apple/
│   ├── dns/
│   ├── vpn/
│   ├── proxy/
│   └── targets/
├── artifacts/
│   ├── generated/
│   └── reports/
├── docs/
│   ├── architecture/
│   ├── compatibility/
│   ├── protocols/
│   └── roadmap/
├── .github/
│   └── workflows/
├── README.md
└── PROJECT-STATUS.md
```

หมายเหตุ: รายการนี้เป็น target organization; รายการไฟล์จริงของ repository ต้องตรวจจาก tree ปัจจุบันก่อนย้ายไฟล์ใด ๆ

กฎการเก็บ:

- Source → apps/packages/scripts
- Tests → tests
- Fixtures → tests/fixtures
- Generated artifacts/report → artifacts
- Device/target evidence → evidence
- เอกสาร → docs
- GitHub Actions → .github/workflows
- ห้าม commit secret, private key, password, token, certificate ส่วนตัว หรือ credential

## 3. Core Configuration Model

Core ต้องเก็บความหมายของ configuration ไม่ใช่รูปแบบ XML/JSON ของ Target

DNS profile เป็น object อิสระ เช่น:

```js
{
  id,
  name,
  provider,
  protocol,
  addressMode,
  ipv4Servers,
  ipv6Servers,
  servers,
  endpoint,
  serverName,
  domains,
  enabled,
  order
}
```

จำนวน `dnsProfiles[]` ต้องไม่ถูกล็อกไว้ที่ 3

คู่ resolver ของ provider เดียวกัน เช่น 1.1.1.1 + 1.0.0.1 ถือเป็น profile เดียว ไม่ใช่สอง stage

## 4. DNS protocol และการส่งออก

แยก transport ออกจาก role/capability

Transport ตัวอย่าง:

- Plain DNS
- DoH / HTTPS
- DoT / TLS
- DoQ
- DNSCrypt เมื่อ Target รองรับ

Role/capability ตัวอย่าง:

- resolver
- privacy
- threat/security filtering
- tracker filtering
- custom rules

### IP mode

IP resolver ใช้ address fields ของ Target ที่รองรับ IP

### Hostname / DoH mode

DoH ต้องใช้ field ที่มีความหมายเป็น URL/HTTPS และ server name ตาม schema ของ Target

ห้ามนำ hostname ไปใส่ใน field ที่ Target กำหนดให้เป็น IP address เพียงเพื่อให้ exporter ผ่าน test

## 5. DNS profiles ไม่เท่ากับ DNS pipeline

การมี resolver หลายชุดไม่ได้แปลว่า:

```
DNS A → DNS B → DNS C → Internet
```

เสมอไป

ต้องแยก:

1. Resolver set
2. Fallback
3. Sequential processing pipeline

Core มี DNS processing semantics แยกต่างหาก:

- PASS
- RESPOND
- BLOCK
- FORWARD
- ERROR

Remote resolver ไม่ควรถูกตีความเป็น filter stage เพียงเพราะถูกเรียงลำดับ

## 6. Blocklists

Blocklists เป็น policy layer แยกจาก resolver profiles:

```text
DNS Profiles
 ├── Resolver profiles
 └── transport/capability

Blocklists
 ├── Ads
 ├── Tracking
 ├── Malware
 └── Custom
```

รายการจากภายนอกต้องใช้ source จริง ไม่สร้าง URL สมมติ

ควรบันทึก:

- source
- URL
- version/date
- checksum เมื่อเหมาะสม
- license
- target compatibility
- evidence

การมี URL ใน config ไม่ใช่หลักฐานว่า Target โหลดและใช้ list จริง

## 7. Apple MobileConfig

Apple เป็น Target adapter ไม่ใช่ Core

Flow:

```
Core Policy
 ↓
Apple Adapter
 ↓
payloads[]
 ↓
Configuration Profile
 ↓
plist/XML serialization
 ↓
.mobileconfig
```

Payload families ที่อยู่ในขอบเขต:

- `com.apple.dnsSettings.managed`
- `com.apple.wifi.managed`
- `com.apple.vpn.managed`
- `com.apple.proxy.http.global`
- `com.apple.webClip.managed`

Declarative DNS ต้องแยกจาก legacy DNSSettings และต้องผูกกับ capability/version ที่รองรับจริง

Certificate/signing เป็น conditional dependency เท่านั้น

## 8. Apple exporter rules

Exporter ต้องตรวจ:

- required fields
- protocol compatibility
- Target capability
- unsupported features
- degraded representation
- profile loss

ผลลัพธ์ควรแบ่งเป็น:

```
Supported
Unsupported
Degraded
Warning
Loss
```

ถ้า exporter ไม่สามารถแทน semantics ของ Core ได้ครบ ต้องรายงาน ไม่ใช่ลดข้อมูลเงียบ ๆ

## 9. MobileConfig validation

Pipeline:

```
Generate
 ↓
Parse
 ↓
Structural validation
 ↓
Payload assertions
 ↓
Round-trip Core ↔ Export
 ↓
Loss detection
 ↓
Compatibility report
```

ต้องตรวจอย่างน้อย:

- valid XML/plist
- top-level Configuration Profile
- PayloadIdentifier
- PayloadUUID
- PayloadContent
- payload type
- payload count
- DNS mapping
- Wi-Fi mapping
- VPN mapping
- Global HTTP Proxy mapping
- Web Clip mapping
- certificate conditions
- unsupported/degraded fields
- silent data loss

Apple-native checks เช่น `plutil`, `security cms` หรือ profile tooling ต้องรันบน macOS runner หากจำเป็น เพราะ Linux runner ไม่มีเครื่องมือ Apple-native เหล่านี้

CI ยังไม่สามารถแทนการติดตั้งและ runtime test บน iPhone/iPad ได้

## 10. Wizard

เป้าหมาย UI:

```
1. DNS
2. Wi-Fi
3. VPN
4. Proxy
5. Web App
6. Review / Export
```

แต่ละ step ต้องมี Skip

Skip semantics:

```
Skip
 ↓
ไม่สร้าง state ของ component นั้น
 ↓
ไม่สร้าง payload ของ component นั้น
```

ห้ามสร้าง empty/default payload เพียงเพราะผู้ใช้กดข้าม

สถานะจาก PROJECT-STATUS ปัจจุบัน: UI ยังอยู่ใน flow เดิมและ wizard 6 ขั้นยังเป็นงานที่ต้องทำ

## 11. Target exporters

Target registry ต้องแยก:

- Apple MobileConfig
- Surge
- Shadowrocket
- Quantumult X
- WireGuard
- Loon
- Stash/Mihomo
- targets อื่นตาม registry

แต่ละ Target ต้องมี capability/compatibility layer

ห้ามถือว่า configuration semantics เดียวกันสามารถ export เป็น syntax เดียวกันได้ทุก Target

## 12. Evidence

Evidence hierarchy:

### Level 1 — Build
โค้ด build ได้

### Level 2 — Structural
artifact/schema/plist ผ่าน validation

### Level 3 — Target acceptance
Target/device รับ configuration

### Level 4 — Runtime
พฤติกรรมที่ตั้งใจเกิดขึ้นจริง

### Level 5 — Repeatable evidence
ทำซ้ำได้และเก็บผลไว้ใน repository

Verified ต้องใช้หลักฐานที่ถึงระดับที่เหมาะกับ claim นั้น

## 13. DNS benchmark

Benchmark ต้องแยกจาก configuration UI

ข้อมูลที่ต้องเก็บ:

- device
- OS
- network
- VPN/tunnel state
- resolver
- protocol
- iterations
- timeout
- timestamp
- samples
- median
- p95
- p99
- errors

ผล benchmark ที่ต่างกันระหว่างรอบไม่ควรถูกสรุปเป็นคุณภาพถาวรของ resolver โดยไม่ควบคุม environment

Browser-load benchmark และ resolver-level benchmark เป็นคนละ measurement

## 14. Pyto / Shortcut

เครื่องมือ Pyto ปัจจุบันเป็น smoke-test workflow สำหรับเรียก DoH

ยังไม่ถือว่าเป็น benchmark สมบูรณ์จนกว่าจะมี:

- workflow จริงบน iPhone
- หลายโดเมน
- หลายรอบ
- median/p95/p99
- error rate
- environment metadata
- import/run evidence
- ผลซ้ำได้

Pyto ไม่ควรถูกอ้างว่าเปลี่ยน system DNS เพียงเพราะเรียก DoH ได้

## 15. CI pipeline

มาตรฐาน:

```text
PR
 ↓
lint
 ↓
unit
 ↓
integration
 ↓
exporter smoke
 ↓
MobileConfig validation
 ↓
round-trip / loss detection
 ↓
wizard E2E
 ↓
artifact/report
 ↓
PASS
```

ถ้า fail:

```FAIL
 ↓
อ่าน log
 ↓
หา root cause
 ↓
แก้ source หลัก
 ↓
commit
 ↓
run CI
 ↓
รอผล
```

ไม่ควรแก้เฉพาะ fixture/test เพื่อทำให้ CI เขียว หาก source implementation ผิด

## 16. Branch / PR / Commit workflow

งานเปลี่ยนแปลงควรทำบน branch เฉพาะงาน

ตัวอย่าง:

```text
feature/wizard-ui
        ↓
commit
        ↓
CI
        ↓
PR
        ↓
review
        ↓
merge เมื่อ acceptance criteria ผ่าน
```

ทุก commit ที่จะถือว่าเสร็จต้องผ่าน test suite ที่เกี่ยวข้อง

เมื่อพบ failure ต้องระบุ:

- workflow
- run
- failing job
- failing test
- root cause
- source file
- fix
- rerun result

## 17. Roadmap แบบละเอียด

### Phase 0 — Baseline

- ตรวจ actual repository tree
- ตรวจ branch/PR
- ตรวจ workflows
- ตรวจ test commands
- sync README กับ PROJECT-STATUS
- ระบุไฟล์ชั่วคราว/fixture ให้ชัด

### Phase 1 — Core

- freeze schema
- multi-profile DNS
- IPv4/IPv6
- IP/hostname modes
- blocklist separation
- explicit enabled/order
- DNS controller semantics
- diagnostics trace

### Phase 2 — Wizard

- 6 steps
- add/remove DNS profile
- edit profile
- skip semantics
- review screen
- export selection

### Phase 3 — Target normalization

- capability matrix
- normalization layer
- compatibility diagnostics
- no silent reduction

### Phase 4 — Apple

- legacy MobileConfig
- Declarative DNS mapping
- Wi-Fi
- VPN
- proxy
- Web Clip
- conditional certificate
- validation

### Phase 5 — CI

- lint
- unit
- integration
- exporter smoke
- MobileConfig validation
- round-trip
- loss detection
- wizard E2E
- artifact/report

### Phase 6 — Evidence

- actual Apple acceptance
- DNS runtime
- VPN runtime
- proxy runtime
- Web Clip runtime
- Target-specific evidence

### Phase 7 — Benchmark

- resolver-level measurement
- Pyto workflow
- repeatability
- environment capture
- report generation

### Phase 8 — Other Targets

- Surge
- WireGuard
- Shadowrocket
- Quantumult X
- Loon
- Stash/Mihomo

สถานะ Verified ต้องเลื่อนตาม evidence เท่านั้น

## 18. Definition of Done

ถือว่างานส่วนนี้เสร็จเมื่อ:

- Core เป็น source of truth
- DNS profiles ไม่ถูกล็อกไว้ที่ 3
- IPv4/IPv6 mapping ถูกต้อง
- IP/hostname modes แยกกัน
- blocklists แยกจาก resolver
- wizard 6 steps ทำงาน
- Skip ไม่สร้าง payload
- Apple MobileConfig ผ่าน structural validation
- Declarative/legacy DNS แยกกัน
- VPN/Proxy มี compatibility diagnostics
- ไม่มี silent data loss
- CI ที่เกี่ยวข้องผ่าน
- exporter smoke ผ่าน
- wizard E2E ผ่าน
- Target ที่ประกาศ verified มี evidence
- benchmark ทำซ้ำได้
- ไม่มี secret ใน repository

## 19. กฎสูงสุดของโครงการ

ต้องสามารถตรวจสอบย้อนกลับได้:

```
Core
 ↓
Exporter
 ↓
Artifact
 ↓
Validation
 ↓
Target acceptance
 ↓
Runtime behavior
 ↓
Repeatability
 ↓
Evidence
 ↓
Verified
```

ห้ามข้ามขั้นใดขั้นหนึ่งแล้วสรุปว่า Target ใช้งานจริงได้
