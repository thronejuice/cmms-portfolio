# CMMS + Breakdown Maintenance (BM) — Plan แยกตาม Phase

> โปรเจกต์ portfolio ข้อมูลทั้งหมดเป็นข้อมูลสมมติ ไม่มีข้อมูลหรือโค้ดจากสถานที่ทำงานจริง
> ได้แรงบันดาลใจด้านขอบเขตฟีเจอร์จาก [Atlas CMMS](https://github.com/Grashjs/cmms) (AGPLv3) — โปรเจกต์นี้เขียนใหม่ทั้งหมด ไม่ได้คัดลอกโค้ด

**Stack:** Next.js (App Router) + TypeScript + Tailwind · Go Fiber · PostgreSQL + GORM · MinIO · Docker Compose (on-premises)
**ภาษา:** ไทยเป็นหลัก ศัพท์เทคนิคอังกฤษ · **เวลา:** Asia/Bangkok (เก็บ UTC) · **PWA:** ติดตั้งได้ + บันทึกร่างในเครื่อง (ไม่มี offline queue)

## 1. ขอบเขต

| กลุ่ม | โมดูล | Release |
|---|---|---|
| พื้นฐาน | Work Orders (BM/PM/Corrective/Inspection), Assets + QR, Requests/Triage, Locations, Users/Teams/RBAC, Analytics | R1 |
| BM | Workflow 15 สถานะ, SLA 3 ตัวชี้วัด, Downtime, Production verification, Closure approval | R1 |
| PM | แผน PM ตามเวลา, Checklists/Task templates, Meters + Automation triggers | R2 |
| คลัง/จัดซื้อ | Parts & Inventory (+เตือนสต็อกต่ำ), Purchase Orders + อนุมัติ, Vendors/Customers, Cost tracking, Files | R3 |

## 2. กฎธุรกิจที่ตกลงแล้ว

- **Downtime:** เริ่มเมื่อเครื่องหยุด → สิ้นสุดเมื่อ **หัวหน้าฝ่ายผลิตยืนยัน** กลับมาผลิตได้ (สถานะ `Restored`)
- **MTTR:** นับเวลาซ่อมจริง (ช่างลงมือ) · **ปฏิทิน SLA:** ต่อเนื่อง 24 ชม.
- **Priority:** หัวหน้าบำรุงกำหนด/เปลี่ยนได้ ต้องมีประวัติ · **ปิดงาน:** ต้องผ่านหัวหน้าบำรุงอนุมัติ
- **SLA (Proposed — ปรับได้ที่ Admin):**

| P | Response | Arrival | Restoration |
|---|---|---|---|
| P1 Critical | ≤5 นาที | ≤10 นาที | ≤60 นาที |
| P2 High | ≤10 นาที | ≤20 นาที | ≤2 ชม. |
| P3 Normal | ≤30 นาที | ≤60 นาที | ≤4 ชม. |
| P4 Low | ≤2 ชม. | ≤4 ชม. | ≤8 ชม. |

- **Escalation:** 50% → เตือนช่าง · 80% → เตือนหัวหน้าบำรุง · เกิน SLA → P1/P2 แจ้ง Manager, P3/P4 แจ้ง Supervisor
- Response/Arrival นับจากเวลาแจ้ง · Restoration นับจากเครื่องหยุด · Waiting for Parts/Production **ไม่หยุด** Restoration SLA
- **Pause SLA:** เฉพาะกรณีรอฝ่ายผลิต และหัวหน้าฝ่ายผลิตอนุมัติ · เกิน SLA ต้องระบุสาเหตุก่อนปิดงาน
- **SLA versioning:** ใบที่เปิดอยู่คง SLA เดิม ใบใหม่ใช้ค่าใหม่ (`effective_from` + snapshot)
- **ความปลอดภัย (LOTO/permit):** เว้นเป็นตัวเลือกให้ EHS กำหนดภายหลัง ระบบไม่ยืนยันว่าเครื่องปลอดภัย
- แจ้งเตือน: in-app เท่านั้น · ไฟล์แนบ ≤10MB/ไฟล์, ≤10 ไฟล์/ใบ · เก็บข้อมูล 5 ปี (placeholder) · เลขใบ `BM-YYYYMM-0001` รีเซ็ตรายเดือน
- รหัสเครื่อง `plant-area-line-running` สร้างอัตโนมัติ · ผู้ใช้ login ด้วยรหัสพนักงาน บัญชีสร้างโดยผู้ดูแลเท่านั้น

## 3. Phase

### Phase F — Frontend Demo (2–3 สัปดาห์) ← **เริ่มที่นี่ (ทำเสร็จในรอบแรกของ repo)**
**เป้าหมาย:** clickable prototype ให้ทีมดู ครบทุกโมดูล BM ละเอียดสุด
- Next.js + Tailwind, ชั้น `CmmsApi` สลับ mock/HTTP ได้ (`NEXT_PUBLIC_API_MODE`)
- Login จำลอง + ปุ่มสลับ 6 บทบาท · Dashboard ตามบทบาท · แจ้งซ่อมมือถือ (QR จำลอง, แม่แบบอาการ, ร่าง)
- Triage/มอบหมาย · Work Order detail (timeline, workflow ตามบทบาท, SLA meter, บังคับสาเหตุเมื่อเกิน SLA)
- Assets/ประวัติ · PM · Checklists · Meters · Parts · PO · Vendors · Costs · Files · Locations · KPI · Users · ตั้งค่า SLA
- Docker (frontend) · README อังกฤษ + screenshots
**Acceptance:** รันครบ flow แจ้ง→คัดกรอง→ซ่อม→ยืนยัน→ปิดงาน ด้วยบทบาทที่ถูกต้อง · ไม่มี console error · ใช้งานบนมือถือได้

### Phase 0 — Discovery (1–2 สัปดาห์, คู่ขนาน)
ยืนยัน workflow/ตัวเลข SLA กับผู้ใช้ · เก็บรายการเครื่อง pilot (1 โรงงาน + 1 พื้นที่) · นิยาม KPI · EHS กำหนด checklist ความปลอดภัย

### Release 1 — BM + Assets + Requests (≈ 8–10 สัปดาห์)
> รายละเอียดฝั่ง backend (data model, API, SLA engine, phase B0–B7) ดู [BACKEND_PLAN.md](BACKEND_PLAN.md) — ประมาณการ backend อยู่ที่ ~14–16 สัปดาห์ จึงต้องทบทวนช่วงเวลานี้
- **R1.1 Foundation:** monorepo `api/` (Go Fiber), PostgreSQL+GORM migrations, auth (argon2 + session/JWT), RBAC + scope (plant/area/line), audit log, CI
- **R1.2 Master data:** plants/areas/lines/assets + QR, failure taxonomy, `maintenance_sla_configs` + `maintenance_sla_escalations`
- **R1.3 Reporting & Triage:** breakdown report + MinIO attachments, triage, duplicate/cancel/reject, in-app notifications
- **R1.4 Work order engine:** workflow service (validated transitions ที่ backend), assignments, work logs, labor, downtime events, waiting reasons, verification, closure approval, reopen
- **R1.5 SLA engine:** background worker คำนวณ 50/80/เกิน, escalation, breach reason, versioning
- **R1.6 KPI & reports:** Response/Arrival/Restoration compliance, MTTR/MTBF, Pareto, CSV/XLSX/PDF export
- ต่อ frontend เข้า Go API (เปลี่ยน mode เป็น `http`)
**Acceptance:** UAT pilot ผ่าน · transition ที่ไม่ถูกต้องถูกปฏิเสธที่ backend · closure ถูกบล็อกเมื่อข้อมูลไม่ครบ · KPI ตรงกับตัวอย่างคำนวณ

### Release 2 — PM + Checklists + Meters (≈ 6–8 สัปดาห์)
PM schedule + recurring work orders · Checklists/Task templates ใน WO · Meters + Automation triggers · Calendar · คู่ขนาน PM compliance report

### Release 3 — Inventory + PO + Vendors + Cost (≈ 8–10 สัปดาห์)
Parts & stock (ตัดสต็อกจาก WO, เตือนต่ำกว่าขั้นต่ำ) · Purchase Orders + approval · Vendors/Customers · Cost tracking (แรงงาน/อะไหล่/ผู้รับเหมา) · Documents library

### ต่อเนื่องทุก Release
Testing (functional / permission / KPI / non-functional) · Security (rate limit, upload validation) · Backup/restore · Monitoring · เอกสารผู้ใช้

## 4. การตัดสินใจเปิด
- ตารางเวลาโดยรวมประมาณ ~6 เดือน สำหรับทีม 2–3 คน (ประมาณการ ไม่ใช่คำมั่น)
- สเปก LOTO/permit รอ EHS · ตัวเลข SLA เป็นค่าทดลอง
