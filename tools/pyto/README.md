# Pyto DNS Benchmark

ไฟล์ `tools/pyto/dns_benchmark_builder.py` เป็นสคริปต์สำหรับ Pyto บน iPhone/iPad

การใช้งาน:

1. เปิดไฟล์ใน Pyto
2. กด Run
3. เมื่อ Share Sheet เปิดขึ้นมา เลือก **Shortcuts**
4. ตรวจสอบชื่อ **DNS Benchmark**
5. กดเพิ่ม/นำเข้าเพียงครั้งเดียว

สคริปต์ไม่สามารถติดตั้ง Shortcut แบบเงียบ ๆ ได้ เพราะ iOS ไม่เปิดสิทธิ์ให้ Pyto เขียนฐานข้อมูลของ Shortcuts โดยตรง

รุ่นแรกของ Shortcut เป็น DoH smoke test ที่เรียก Cloudflare, Google Public DNS และ Quad9 จริง เพื่อยืนยันเส้นทางก่อนขยายเป็น benchmark หลายรอบและหลายโดเมน

ไม่ควรตีความเวลา request นี้เป็น browser DNS latency เพราะเป็นการวัด HTTPS/DoH request โดยตรง
