# Unified Operating Model — Configuration Platform × Network-Configuration

สถานะเอกสาร: **DESIGN INTEGRATION BASELINE / NOT IMPLEMENTATION APPROVAL**

เอกสารนี้รวบรวมแบบจำลองการทำงานที่ผู้ใช้ยืนยัน เพื่อให้ Configuration Platform ทำงานร่วมกับ Network-Configuration ได้โดยรักษาความสามารถและขอบเขตเดิมของแต่ละระบบไว้ เอกสารนี้ไม่ใช่การประกาศว่าการเชื่อมต่อทางเทคนิคเสร็จแล้ว และไม่เปลี่ยน Contract v2.1 หรือ Target Adapter ที่ได้รับการคุ้มครอง

## 1. เป้าหมายและหลักการอ่านเอกสาร

ต้องมองระบบจากเจตนาการทำงานและความสัมพันธ์จริง ไม่ใช่จากชื่อโฟลเดอร์ ชื่อเอกสาร หรือจำนวนหัวข้อ

ชื่อและหัวข้อย่อยในชุดเอกสารเดิมถูกใช้เป็นเครื่องมือสื่อสารเพื่อให้ AI เข้าใจคำอธิบายทีละเรื่อง ไม่ใช่หลักฐานว่าผู้ใช้ออกแบบให้ทุกหัวข้อกลายเป็น subsystem, service หรือ module แยกกัน

ดังนั้น:
- รวมแนวคิดและความสัมพันธ์กลับเป็น operating model เดียวก่อน
- แยกหัวข้ออธิบายออกจาก entity, responsibility และ implementation component
- ไม่อนุมาน architecture จาก folder tree
- ไม่สร้าง controller, database, workflow engine หรือ execution path ซ้ำ หากมีความสามารถเดิมที่นำกลับมาใช้ได้
- ระบุให้ชัดว่าอะไรคือ USER-CONFIRMED DESIGN, REPOSITORY-OBSERVED, SOURCE-OBSERVED, PROPOSED INTEGRATION หรือ UNKNOWN

หลักการพัฒนา: **Reuse first → Integrate second → Extend when necessary → Replace only with evidence → Build only when needed.**

## 2. ขอบเขตของระบบที่ทำงานร่วมกัน

### 2.1 Configuration Platform (prasong-me/-Configuration-)

Repository นี้เป็น Configuration Composition / Compatibility Platform:
- Web application ที่มีอยู่แล้วอยู่ที่ apps/web
- Web UI รับความต้องการและสร้าง Canonical Policy
- Core ทำ normalization, validation, capability evaluation และ compilation
- Target Adapter / Serializer แปลงความหมายไปเป็นรูปแบบของ Target
- Compatibility report ต้องบอกข้อจำกัดและห้ามสร้างความสามารถที่ไม่มีหลักฐานรองรับ
- ไม่ใช่ VPN engine, proxy engine หรือ runtime ของแอปเป้าหมาย

ขอบเขตดังกล่าวยังคงเดิม การเพิ่ม operating model นี้ไม่เปลี่ยน Configuration Platform ให้กลายเป็น IRIS runtime หรือ network runtime

### 2.2 Network-Configuration (prasong-me/Network-Configuration)

Repository นี้ระบุภารกิจเป็น Network Configuration Engineering Repository และมีเอกสาร architecture, control, evidence, protocols, targets และ IRIS-related contracts

ให้ใช้เป็น repository คู่สำหรับความรู้และงานด้าน Network Configuration, contracts, adapters, target evidence และ integration ที่มีหลักฐานจริง

การมีเอกสาร API หรือ controller contract อยู่ใน repository ไม่ได้พิสูจน์ว่า endpoint ยัง deploy อยู่, เชื่อมต่อได้, ได้รับอนุญาต หรือเป็น runtime authority ในปัจจุบัน ต้องตรวจสอบก่อนใช้งานจริง

### 2.3 IRIS operating model

IRIS เป็นแนวคิดการประสานงานและควบคุมการทำงานที่เชื่อม Main AI กับข้อมูล สถานะ เครื่องมือ และ workflow โดยไม่ยึดติดกับ AI worker รายใดรายหนึ่ง

องค์ประกอบสามส่วนที่ผู้ใช้ยืนยันในเอกสาร operating structure:
1. Storage Lifecycle
2. IRIS Workflow Lifecycle
3. First Adapter / IRIS Adapter

ให้รักษาความหมายและความสัมพันธ์ของสามส่วนนี้ไว้ ห้ามเทียบโดยอัตโนมัติกับ package, controller หรือ adapter ที่มีชื่อคล้ายกันใน repository อื่น

### 2.4 บทบาทของระบบสนับสนุน

- **HAP** — operating environment และ policy constraints เช่น offline-first, approval-gated actions และข้อจำกัดการเขียนข้อมูล
- **AICC** — data, evidence และ records
- **SMPE** — schema/process/validation/gate governance
- **Main AI / Workers** — วิเคราะห์และปฏิบัติงานตาม instruction package และสิทธิ์ที่ได้รับ
- **Raw Database** — durable project state ตามแหล่งข้อมูลที่ได้รับการยืนยัน
- **Temporary Workspace** — working data ของแต่ละ execution cycle
- **Checkpoint / Resume** — ตำแหน่งและบริบทสำหรับทำงานต่อ
- **Evidence / Provenance** — หลักฐาน ที่มา และความสัมพันธ์ของข้อมูล

ชื่อเหล่านี้เป็น responsibility/concept ตามเอกสารอ้างอิง ไม่ได้ยืนยันตำแหน่ง physical deployment หรือ implementation mapping ในสอง repository นี้

## 3. Unified operating principle

หลักการพื้นฐานของงานคือ:

**STATE / CONDITION → ACTION → STATE / CONDITION**

State คือสภาพหรือตำแหน่งปัจจุบันของงาน ไม่ได้หมายถึงเพียงจุดเริ่มหรือจุดสิ้นสุด งานหนึ่งสามารถเปลี่ยนไปได้หลายเส้นทางตาม event, dependency, policy และผลตรวจสอบ

ระบบต้องรองรับ:
- linear workflow;
- nested cycles;
- branching และ merging;
- event-triggered work;
- dependency network;
- parallel work เมื่อเงื่อนไขและ resource อนุญาต;
- return path เพื่อส่งผลกลับไปยังงานที่รอหรือเกี่ยวข้อง;
- wait / resume โดยรักษา context และ execution position;
- retry และ validation loop โดยแยกจากการรอ dependency;
- checkpoint และ recovery ตามหลักฐานจริง

ไม่มีข้อกำหนดว่าทุกงานต้องเดินผ่าน Start → Process → End แบบเส้นตรงเพียงเส้นเดียว

## 4. Event, dependency, wait และ resume semantics

งานหนึ่งสามารถสร้าง event หรือผลลัพธ์ที่กระตุ้นงานอื่นได้ งานที่ต้องใช้ผลลัพธ์จากอีกงานสามารถเข้าสู่ WAITING และกลับมาทำต่อเมื่อ dependency พร้อม

**WAITING ไม่ใช่ FAILED และไม่ใช่ BLOCKED โดยอัตโนมัติ.**

ความหมายของสถานะ:
- READY — เงื่อนไขครบและพร้อมเริ่ม
- EXECUTING — กำลังปฏิบัติงาน
- WAITING — รอ event, dependency หรือผลจากงานอื่น
- BLOCKED — ไม่สามารถดำเนินต่อได้เพราะ policy, permission หรือ prerequisite ที่จำเป็น
- RETURNED — ส่งข้อมูล/ผลกลับไปยัง node หรือวงจรที่เกี่ยวข้อง
- RESUMED — กลับมาทำงานจาก checkpoint/context ที่อ้างอิงได้
- COMPLETED — ผ่านเกณฑ์ completion ของ work unit
- FAILED — execution หรือ acceptance condition ไม่สำเร็จตามนิยามที่กำหนด

ต้องแยกอย่างน้อยสามกรณี:
1. **Dependency return:** ผลจากงานอื่นมาถึง ทำให้งานที่รอทำต่อได้
2. **Validation return:** ผลไม่ผ่านเกณฑ์ จึงย้อนกลับไปแก้ไขหรือทำซ้ำตามกติกา
3. **Control return:** ส่งการควบคุม/ข้อมูลกลับไปยังผู้ประสานงานหรือจุดตัดสินใจ

การ resume ต้องระบุ source checkpoint, dependency ที่ทำให้ resume, prior execution context และตำแหน่งที่กลับมาทำต่อ ห้ามอ้างว่า resume สำเร็จเพียงเพราะมี checkpoint record

## 5. วงจรการทำงานหลักที่ยืนยันแล้ว

วงจรระดับภาพรวม:
1. IRIS retrieves required data/state.
2. Data is made available in Temporary Workspace.
3. Main AI / MCP performs the assigned work.
4. Result enters the required gate / verification.
5. Authorized persistence occurs only when permitted.
6. Checkpoint / resume position is updated.
7. Temporary Workspace is cleaned according to lifecycle policy.
8. Verified output is returned to its intended consumer.

วงจรนี้เป็นภาพรวม ไม่ใช่ข้อบังคับว่าทุก task ต้องทำทุกขั้นแบบเส้นตรง การแตกแขนง การรอ การกลับมา และการวนซ้ำขึ้นกับเงื่อนไขของงาน

## 6. Configuration Platform workflow remains authoritative for configuration generation

การสร้าง configuration ยังคงใช้ flow และ contract ปัจจุบันของ Configuration Platform:

**User Intent → Canonical Policy → Normalize → Validate → Capability Evaluation → Compiler → Target Adapter → Target Model → Serializer → Target Configuration**

การนำเข้า (เมื่อ Target รองรับ) ยังคงเป็นเส้นทางแยก:

**Target Configuration → Parser → Target Model → Canonical Policy → Validation / Diagnostics**

Unified operating model ทำหน้าที่ประสานงานระดับงานและสถานะ ไม่ได้แทนที่ compiler pipeline, DNS processing semantics, Target Adapter, Serializer หรือ Validator

Target runtime เป็นความรับผิดชอบของแอป/ระบบเป้าหมาย ไม่ใช่ Configuration Platform เว้นแต่จะมี native runtime contract ระบุไว้โดยชัดเจน

## 7. Cross-repository collaboration boundary

ความสัมพันธ์ที่ต้องการ:
- Configuration Platform Web App เป็น user-facing surface สำหรับสร้าง/แก้ไข Canonical Policy และดูผล compatibility/export
- Network-Configuration เป็น companion engineering repository สำหรับ network-specific contracts, target knowledge, adapters, evidence และ integration ที่ได้รับการยืนยัน
- IRIS/AWPIC-style work coordination อาจจัดงานข้าม repository โดยมี scope, references, permissions, dependencies, acceptance criteria และ evidence
- ผลลัพธ์จาก repository หนึ่งจะถูกส่งให้อีก repository ใช้ได้เมื่อมี artifact reference และ contract ที่ชัดเจน
- ห้ามสมมติว่า repository ทั้งสองแชร์ database, filesystem, runtime, authentication หรือ live state โดยอัตโนมัติ
- ห้ามให้ web UI เขียนข้อมูลถาวรหรือเปลี่ยน remote system โดยไม่มี permission และ approval contract ที่ตรวจสอบได้

**Proposed integration sequence (not yet implemented/verified):**

**User → Configuration Web App → Canonical Policy → Configuration Core**

**Configuration Core → Compatibility / Target Export Result**

**Work Coordinator → Network-Configuration references / contracts / evidence**

**Network-specific validation result → Evidence / status reconciliation → User-facing result**

จุดเชื่อมต่อจริง (API, MCP, storage, authentication, event transport, deployment) ต้องถูกตรวจสอบจาก source และ environment ก่อนเลือกใช้ ห้ามสร้าง integration endpoint ใหม่จากการคาดเดา

## 8. AWPIC — AI Work Package & Instruction Checklist

เมื่อแบ่งงานให้ AI ให้ส่ง work package ที่ปฏิบัติได้ ไม่ใช่เพียง prompt สั้น ๆ

แต่ละ package ควรมี:
- objective และ expected output;
- scope / out-of-scope;
- assigned role และ worker identity;
- exact instructions;
- ordered steps และ dependency references;
- checklist;
- source files / artifact references;
- permissions, constraints และ protected boundaries;
- acceptance criteria;
- evidence requirements;
- return / handoff format;
- resume context เมื่อมีการรอหรือส่งกลับ

Lifecycle ที่ใช้ติดตามการส่งมอบ:
**GENERATED → ASSIGNED → INJECTED → ACKNOWLEDGED → EXECUTING → RETURNED → VERIFIED → ACCEPTED**

สถานะ transport ต้องอ้างจากหลักฐานเท่านั้น หากยังไม่ได้ส่งจริง ให้คงสถานะ GENERATED / NOT_SENT ห้ามอ้างว่า worker ได้รับหรือเริ่มทำงานแล้ว

## 9. Data, checkpoint, evidence และ identity

ข้อมูลและหลักฐานต้องรักษาความต่อเนื่องและตรวจสอบย้อนกลับได้:
- แยก durable state ออกจาก temporary working data;
- แต่ละ work item, event, artifact, checkpoint และ evidence record มี stable ID;
- ความสัมพันธ์หรือ derived record ต้องมี ID ของตัวเองและอ้าง parent/source IDs;
- ห้ามเขียนทับ source evidence หรือเปลี่ยน historical identity;
- เก็บ actor/worker, timestamps, source, permission/approval, tool/action, intermediate state, retry, handoff, verification และ closure evidence ตามความเหมาะสม;
- แยก EXECUTED, OUTPUT_PRESENT, OUTPUT_VALID, MATCHED, VERIFIED, PASS และ ACCEPTED;
- การมีไฟล์หรือ record ไม่ได้พิสูจน์ว่าผลลัพธ์ถูกต้องหรือ runtime ทำงานจริง

## 10. Permission, safety และ persistence gates

- อ่านข้อมูลได้ไม่เท่ากับมีสิทธิ์แก้ไขข้อมูล
- การสร้าง artifact ไม่เท่ากับได้รับอนุญาตให้ deploy หรือเปลี่ยนระบบปลายทาง
- ทุก persistent write ต้องผ่าน permission และ approval gate ที่เกี่ยวข้อง
- ปฏิบัติตาม offline-first และ ZERO_DATABASE_WRITE เมื่อ policy กำหนด
- ห้ามส่ง credentials, private keys, tokens หรือข้อมูลส่วนบุคคลเข้า repository/evidence สาธารณะ
- ห้ามให้ AI ตรวจรับผลงานของตัวเองเป็นหลักฐานอิสระ หาก contract กำหนด independent verification
- เมื่อข้อมูลหรือความสามารถไม่ชัดเจน ให้ใช้ UNKNOWN / UNVERIFIED และระบุสิ่งที่ต้องตรวจสอบ

## 11. Compatibility and preservation rules

1. Configuration Platform ยังคงเป็น configuration composition/compiler platform ไม่ใช่ orchestrator runtime โดยอัตโนมัติ
2. Network-Configuration ยังคงเป็น companion engineering repository; อย่าคัดลอก source หรือสร้าง parallel implementation โดยไม่จำเป็น
3. IRIS three-part operating model ไม่เท่ากับ IRIS Controller package หรือ five-step sub-lifecycle
4. IRIS Adapter ไม่เท่ากับ SMPE Adapter โดยอาศัยชื่อคล้ายกัน
5. Raw Database ไม่เท่ากับ SQLite, GitHub หรือ Supabase โดยไม่มีหลักฐาน mapping
6. MCP contract ไม่ได้พิสูจน์ว่า MCP host เชื่อมต่ออยู่จริง
7. Checkpoint existence ไม่ได้พิสูจน์ checkpoint restore/resume behavior
8. Target export success ไม่ได้พิสูจน์ installation/runtime interoperability
9. Existing contracts and protected boundaries remain in force unless explicitly revised through their own review/approval process.

## 12. Evidence classification and current status

ใช้ classification ต่อไปนี้ในเอกสารและการดำเนินงาน:
- **USER-CONFIRMED DESIGN** — ผู้ใช้ยืนยันเจตนา/เงื่อนไข
- **REPOSITORY-OBSERVED** — พบใน repository ณ branch/commit ที่ระบุ
- **SOURCE-OBSERVED** — ยืนยันจาก source implementation
- **PROPOSED INTEGRATION** — แนวทางเชื่อมต่อที่ยังไม่ implemented/verified
- **UNKNOWN / UNVERIFIED** — ไม่มีหลักฐานเพียงพอ
- **CONFLICT** — มีหลักฐานขัดแย้งกัน ต้องเก็บไว้จนกว่าจะ reconcile

สถานะของเอกสารนี้:
- Unified operating concepts: USER-CONFIRMED DESIGN where explicitly stated above.
- Configuration Web App at apps/web: REPOSITORY-OBSERVED.
- Network-Configuration as a separate engineering repository: REPOSITORY-OBSERVED.
- Cross-repository runtime/API/event integration: PROPOSED / UNVERIFIED.
- Code changes, deployment, live connectivity and end-to-end tests: NOT PERFORMED by this document.

## 13. Next implementation gates

ก่อนแก้ code หรือเพิ่ม integration:
1. Read current branch, commit, project state, roadmap, evidence and protected boundaries in both repositories.
2. Map existing UI/core/adapter/API/storage capabilities to the operating model.
3. Identify reusable components and exact contract gaps.
4. Confirm which operations are read-only, local writes, persistent writes or remote mutations.
5. Define only the smallest compatible integration contract.
6. Implement on a working branch without altering protected baselines.
7. Test each gate separately and record evidence.
8. Read back committed state and reconcile project status.

ห้ามสร้าง graph engine, event bus, scheduler, database หรือ controller ใหม่ก่อนตรวจสอบความสามารถเดิมในทั้งสอง repository และ runtime ที่เชื่อมอยู่จริง

---

เอกสารนี้เป็นการรวบรวมและเชื่อมความเข้าใจระดับ design เท่านั้น ไม่ใช่การอนุมัติให้เปลี่ยน Contract v2.1, protected Target adapters, runtime, production data หรือ deployment.
