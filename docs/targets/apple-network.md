# หลักฐานการตั้งค่าเครือข่ายของ Apple

## ขอบเขต

หลักฐานนี้ครอบคลุมความสามารถด้านเครือข่ายของแพลตฟอร์ม Apple ที่เกี่ยวข้องกับโครงการ ไม่ได้หมายความว่าแอปจาก App Store ทุกแอปจะสามารถรับการตั้งค่าของ Apple ได้ทุกประเภท

## ข้อเท็จจริงที่ตรวจสอบแล้ว

Apple มีเอกสารเกี่ยวกับ DNS แบบเข้ารหัสผ่านประเภทการตั้งค่าแบบ declarative `com.apple.configuration.network.dns-settings` การติดตั้งภายในเครื่องรองรับสำหรับการตั้งค่านี้ โดยขึ้นอยู่กับเงื่อนไขด้านความพร้อมใช้งานของ Apple

แหล่งข้อมูล: https://developer.apple.com/documentation/devicemanagement/networkdnssettings

Apple มีเอกสารเกี่ยวกับการตั้งค่า VPN plugin ผ่าน `com.apple.configuration.network.vpn.vpn-plugin` โดยรองรับการลงทะเบียนภายในเครื่องบนการตั้งค่า iOS/iPadOS ที่รองรับ

แหล่งข้อมูล: https://developer.apple.com/documentation/devicemanagement/networkvpnvpnplugin

Per-App VPN มีข้อกำหนดเพิ่มเติมด้าน MDM และการจัดการแอป จึงไม่เทียบเท่ากับการสร้างไฟล์โปรไฟล์เพียงอย่างเดียว

แหล่งข้อมูล: https://developer.apple.com/documentation/networkextension/netunnelprovidermanager

Network Extension framework ของ Apple เป็นชุด API ที่รองรับสำหรับแอปพลิเคชัน VPN

แหล่งข้อมูล: https://developer.apple.com/videos/play/wwdc2025/234/

## กฎของโครงการ

ความสามารถระดับแพลตฟอร์มเหล่านี้ไม่ได้กลายเป็นความสามารถของ Target ที่เป็นแอปจากบุคคลที่สามโดยอัตโนมัติ Target Adapter ต้องมีหลักฐานแยกต่างหากว่า Target นั้นยอมรับรูปแบบการนำเข้าและการตั้งค่าที่เกี่ยวข้อง

## สถานะ

ยังไม่มี Apple Target Adapter ที่ทำเครื่องหมายเป็น SUPPORTED
