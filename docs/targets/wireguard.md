# หลักฐาน Target ของ WireGuard

## หลักฐานทางการ

WireGuard มีเอกสารเกี่ยวกับโมเดลการตั้งค่ามาตรฐานที่ใช้ section `[Interface]` และ `[Peer]` รวมถึง field เช่น `Address`, `DNS`, `PrivateKey`, `PublicKey`, `AllowedIPs` และ `Endpoint`

แหล่งข้อมูล: https://www.wireguard.com/talks/netdev2017-slides.pdf

## สถานะของโครงการ

หลักฐานนี้ยืนยัน syntax พื้นฐานของการตั้งค่า แต่ต้องทดสอบพฤติกรรมการนำเข้าที่แน่นอนของแอป iOS แยกต่างหาก ก่อนทำเครื่องหมาย adapter สำหรับ iOS ว่าสมบูรณ์

Private key เป็นข้อมูลลับและต้องส่งเข้ามาใน runtime หรือผ่านกลไกจัดการข้อมูลลับที่มีการป้องกัน
