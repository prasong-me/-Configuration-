# Apple MobileConfig

## สถานะปัจจุบัน

หน้า Apple MobileConfig ใน Configuration Platform ใช้สร้างไฟล์ Apple Configuration Profile (.mobileconfig) จาก policy กลาง แล้วให้ผู้ใช้ดาวน์โหลดหรือส่งไฟล์ผ่าน Share Sheet บน iOS/iPadOS

ลำดับการใช้งาน:
1. กำหนดค่าใน Wizard
2. เลือก Target เป็น Apple iOS MobileConfig
3. ระบบสร้าง Configuration Profile แบบ XML plist
4. Payload ที่เปิดใช้งานถูกใส่ไว้ใน PayloadContent
5. ดาวน์โหลดไฟล์หรือส่งผ่าน Share Sheet

Apple configuration profiles ใช้โครงสร้าง plist และเก็บ payload เฉพาะไว้ใน PayloadContent โดย payload มีข้อมูลมาตรฐาน เช่น PayloadType, PayloadIdentifier, PayloadUUID และ PayloadVersion.

## สิ่งที่ใช้งานได้แล้ว

### DNS
รองรับ DNS profiles หลายชุดจาก Core โดยไม่บีบเหลือ profile แรก

แต่ละ profile รองรับชื่อ, Provider, Protocol, DNS servers หลายตัว, DoH endpoint, role และ enabled/disabled

Exporter สร้าง payload com.apple.dnsSettings.managed แยกตาม DNS profile ที่เปิดใช้งาน และมี automated tests ตรวจทั้ง multi-profile และการตัด profile ที่ disabled

### Web App / Web Clip
สร้าง com.apple.webClip.managed เมื่อเปิด Web App พร้อม URL, label, FullScreen และ removable ตาม policy

### Wi-Fi
สร้าง com.apple.wifi.managed สำหรับ SSID ที่ระบุ พร้อม AutoJoin, EncryptionType, Password และ Hidden network ตามข้อมูลที่มี

### VPN
สร้าง IKEv2 payload เมื่อ RemoteAddress, RemoteIdentifier และ LocalIdentifier ครบ หากข้อมูลไม่ครบจะสร้าง warning แทน payload ที่ไม่สมบูรณ์

### Global HTTP Proxy
มี adapter สำหรับ com.apple.proxy.http.global พร้อม warning เรื่อง supervision และตรวจรูปแบบ host:port

### Signing
การสร้าง MobileConfig แบบ manual ไม่บังคับให้สร้าง certificate/private key ระบบมี workflow แยกสำหรับ signing เมื่อ deployment path ต้องการ และมี CMS/DER + SHA-256 signing script พร้อม verification test

ยังไม่มีการสร้าง certificate หรือ private key ปลอมเพื่อทำให้ profile ดูเหมือน signed

## สิ่งที่ยังไม่ควรเรียกว่า Verified

Automated tests ยืนยันโครงสร้างและ exporter behavior ตามกรณีที่ทดสอบ แต่ยังไม่ใช่หลักฐานว่า payload ทุกชนิดได้รับการยอมรับและทำงานครบทุก capability บนอุปกรณ์ Apple จริง

จึงแยกสถานะเป็น:
- Generated: สร้างไฟล์ได้
- Schema/Exporter Tested: automated tests ผ่าน
- Device Verified: ต้องติดตั้งและตรวจบนอุปกรณ์จริง
- MDM Verified: ต้องทดสอบผ่าน MDM จริง

ห้ามเลื่อนเป็น Device Verified หรือ MDM Verified เพียงเพราะ exporter test ผ่าน

# Apple MobileConfig Roadmap

## Phase 1: Core MobileConfig generator
สถานะ: ทำแล้วเป็นหลัก

- [x] XML plist / top-level Configuration profile
- [x] Multi-DNS profiles
- [x] Filter disabled DNS profiles
- [x] Web Clip
- [x] Wi-Fi payload
- [x] IKEv2 payload validation
- [x] Global HTTP Proxy warning/validation
- [x] Automated exporter tests

## Phase 2: Installation and signing
สถานะ: บางส่วนเสร็จ

- [x] Download .mobileconfig
- [x] Share Sheet
- [x] แยก manual installation กับ managed deployment
- [x] Signing requirement detection
- [x] CMS/DER signing script
- [x] CMS signature verification test
- [ ] Signed profile installation บนอุปกรณ์ Apple จริง
- [ ] Signed profile replacement/update test
- [ ] MDM deployment test

## Phase 3: Real-device verification

### DNS
- [ ] ติดตั้ง MobileConfig จริง
- [ ] ตรวจ payload หลังติดตั้ง
- [ ] ทดสอบ Wi-Fi
- [ ] ทดสอบ Cellular
- [ ] DoH
- [ ] DoT
- [ ] Multi-DNS
- [ ] Enabled/disabled profile
- [ ] SupplementalMatchDomains
- [ ] AllowFailover

### Wi-Fi
- [ ] Installation
- [ ] AutoJoin
- [ ] Hidden SSID
- [ ] Authentication/encryption cases

### VPN
- [ ] IKEv2 installation
- [ ] Connection
- [ ] Routing
- [ ] Authentication
- [ ] Reconnect/failure behavior

### Web Clip
- [ ] Installation
- [ ] Home Screen
- [ ] URL
- [ ] FullScreen
- [ ] Removal behavior

## Phase 4: Declarative DNS

รูปแบบใหม่ที่ต้องให้ความสำคัญสำหรับ iOS รุ่นใหม่คือ com.apple.configuration.network.dns-settings

งาน:
- [x] Adapter เบื้องต้น
- [x] DNSProtocol
- [x] ServerURL
- [x] ServerAddresses
- [x] AllowFailover
- [x] IdentityAssetReference
- [x] Mapping tests ระหว่าง declarative และ legacy
- [ ] Multi-profile declarative exporter
- [ ] OnDemandRules
- [ ] SupplementalMatchDomains
- [ ] ProhibitDisablement ตาม enrollment/supervision
- [ ] Real-device declaration test
- [ ] Local/supervised/device enrollment tests

## Phase 5: Legacy compatibility

Apple ทำเครื่องหมาย DNSSettings แบบเดิมเป็น deprecated ใน iOS 27 และชี้ไปยัง declarative management ดังนั้น legacy จะเก็บไว้สำหรับ compatibility และ regression testing ไม่ใช่เป็นทิศทางหลักของระบบ

## Phase 6: Evidence and release gates

ก่อนเปลี่ยน Apple target เป็น verified ต้องมี:
1. Export tests ผ่าน
2. Payload structure ผ่าน
3. Real-device installation evidence
4. Behavior evidence ตาม capability
5. Signing evidence เมื่อ signing ถูกใช้
6. MDM evidence หากอ้าง MDM support
7. Compatibility diagnostics สำหรับข้อจำกัด

หลักการ: export ได้ ไม่เท่ากับใช้งานได้ และติดตั้งได้ ไม่เท่ากับทุก capability ทำงานครบ

## สถานะสรุป

| ส่วน | สถานะ |
|---|---|
| MobileConfig generator | ใช้งานได้ |
| Multi-DNS export | automated test แล้ว |
| Web Clip | adapter แล้ว |
| Wi-Fi | adapter แล้ว |
| IKEv2 | adapter + validation |
| Global Proxy | adapter + supervision warning |
| Manual signing | workflow แล้ว |
| CMS/DER signing | script + verification test |
| Real-device Apple verification | ยังต้องทำ |
| MDM verification | ยังต้องทำ |
| Declarative DNS adapter | มีระดับพื้นฐาน |
| Declarative multi-profile | ยังต้องทำ |
| Legacy DNS | compatibility |
| iOS 27+ primary DNS direction | Declarative DNS |
