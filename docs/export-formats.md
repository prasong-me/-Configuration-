# รูปแบบการส่งออก

เอกสารนี้เป็นตารางทดสอบสำหรับผลลัพธ์การส่งออกที่เฉพาะกับ Target

## Target สำหรับการส่งออก

| Target | ไฟล์ | ฟังก์ชัน | สถานะ |
|---|---|---|---|
| Surge | .conf | exportSurge() | แม่แบบ |
| Mihomo / Clash-compatible | .yaml | exportMihomo() | แม่แบบ |
| WireGuard | .conf | exportWireGuard() | แม่แบบ |
| Shadowrocket | .conf | exportShadowrocket() | แม่แบบ |
| Loon | .conf | exportLoon() | แม่แบบ |
| Stash | .yaml | exportStash() | แม่แบบ |
| Quantumult X | .conf | exportQuantumultX() | แม่แบบ |
| Apple Network DNS Settings | .json | exportAppleDnsDeclaration() | ข้อมูลอ้างอิง |
| Apple DNSSettings legacy | .mobileconfig | exportAppleMobileConfigLegacy() | รุ่นเก่า |

## ลำดับการทดสอบ

สำหรับแต่ละ Target:

1. ส่งออกไฟล์จากเว็บแอปพลิเคชัน
2. นำเข้าหรือโหลดไฟล์ในแอปหรืออุปกรณ์จริงของ Target
3. ทดสอบ DNS
4. ทดสอบการกำหนดเส้นทาง / VPN หรือ TUN ตามความเหมาะสม
5. ทดสอบกฎการบล็อกหนึ่งรายการ
6. บันทึกผลที่เกิดขึ้นจริง
7. ส่งคืน artifact ที่ส่งออกโดยลบข้อมูลลับออก
8. ยกระดับ Target จากแม่แบบเป็น adapter ที่ได้รับการยืนยันเมื่อมีการตรวจสอบผลจากอุปกรณ์จริงแล้วเท่านั้น

## หมายเหตุเกี่ยวกับรูปแบบ

### Surge
โปรไฟล์ Surge ใช้รูปแบบคล้าย INI โดยมี section เช่น [General], [Proxy], [Proxy Group] และ [Rule]

แหล่งอ้างอิง: https://manual.nssurge.com/profile/format.html

### Mihomo
Mihomo ใช้ YAML โดย DNS อยู่ภายใต้ dns, โหนดพร็อกซีอยู่ภายใต้ proxies, กลุ่มพร็อกซีอยู่ภายใต้ proxy-groups และกฎการกำหนดเส้นทางอยู่ภายใต้ rules

แหล่งอ้างอิง: https://wiki.metacubex.one/en/config/

### WireGuard
การส่งออกใช้โครงสร้างมาตรฐาน [Interface] / [Peer] โดย private key ตั้งใจให้เป็นเพียง placeholder

แหล่งอ้างอิง: https://www.wireguard.com/

### Shadowrocket
การส่งออกใช้โครงสร้างโปรไฟล์ .conf ของ Shadowrocket fixture สำหรับการทดสอบปัจจุบันจะเก็บส่วน DNS และกฎให้น้อยที่สุด เพื่อให้ทดสอบแต่ละฟีเจอร์แยกกันได้

แหล่งอ้างอิง: https://github.com/LOWERTOP/Shadowrocket/wiki

### Loon
การส่งออกใช้รูปแบบการตั้งค่าแบบ section ของ Loon โดย DNS อยู่ใน [General] และกฎอยู่ใน [Rule]

แหล่งอ้างอิง: https://github.com/Loon0x00/LoonManual

### Stash
การตั้งค่า Stash ใช้ YAML โดย DNS อยู่ภายใต้ dns และกฎทราฟฟิกอยู่ภายใต้ rules

แหล่งอ้างอิง: https://stash.wiki/en/configuration/example-config

### Quantumult X
การส่งออกใช้การตั้งค่าแบบ section ของ Quantumult X fixture ขั้นต่ำประกอบด้วย [general], [dns], [policy] และ [filter_local]

แหล่งอ้างอิง: https://github.com/crossutility/Quantumult-X

### Apple Network DNS Settings
โมเดล declarative ของ Apple ในปัจจุบันใช้ declaration `com.apple.configuration.network.dns-settings` และส่งออกแยกจาก payload DNS แบบ .mobileconfig รุ่นเก่า

แหล่งอ้างอิง: https://developer.apple.com/documentation/devicemanagement/networkdnssettings

### Apple DNSSettings legacy
payload `com.apple.dnsSettings.managed` ยังคงไว้เป็น fixture สำหรับความเข้ากันได้กับระบบรุ่นเก่าเท่านั้น เนื่องจาก Apple ระบุว่า declarative network DNS settings เป็นรูปแบบทดแทนบนระบบปฏิบัติการรุ่นใหม่

แหล่งอ้างอิง: https://developer.apple.com/documentation/devicemanagement/dnssettings
