# โมเดล Policy มาตรฐานกลาง

Canonical Policy Model คือรูปแบบข้อมูลที่ไม่ขึ้นกับแพลตฟอร์มและใช้แทนความต้องการของผู้ใช้

## เป้าหมาย

- แสดงความต้องการโดยไม่ผูกกับ syntax ของ Target
- มีผลลัพธ์ที่กำหนดแน่นอนและมีเวอร์ชัน
- เปิดให้ Target Adapter รายงานการรองรับเพียงบางส่วน
- หลีกเลี่ยงการเปลี่ยนพฤติกรรมที่ผู้ใช้ร้องขอโดยไม่แจ้ง

## ขอบเขตเริ่มต้น

- vpn
- dns
- proxy
- routing
- blocking
- privacy
- providers

## ตัวอย่าง

```json
{
  "version": "0.1",
  "policy": {
    "name": "privacy-basic",
    "vpn": { "enabled": false },
    "dns": { "enabled": true },
    "routing": { "ipv4": true, "ipv6": true },
    "blocking": {
      "malware": true,
      "tracker": true
    }
  }
}
```

โมเดลนี้อธิบายเพียงความต้องการ ไม่ได้หมายความว่า Target ทุกตัวสามารถนำทุก field ไปใช้งานได้
