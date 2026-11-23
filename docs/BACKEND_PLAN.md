# Backend Plan — Go Fiber API

> ข้อมูลและตัวเลขในเอกสารนี้เป็นสมมติสำหรับ portfolio · กฎธุรกิจอ้างอิง [PLAN.md](PLAN.md) §2
> เอกสารนี้เป็นแผนออกแบบ ยังไม่มีโค้ดฝั่ง backend ใน repo

## 1. การตัดสินใจทางเทคนิค

| หัวข้อ | เลือก | เหตุผลสั้น ๆ |
|---|---|---|
| Framework | Go + Fiber v2 | ตามที่กำหนด |
| DB / ORM | PostgreSQL + GORM | GORM ใช้เฉพาะ query/relation **ไม่ใช้ AutoMigrate บน production** |
| Migration | golang-migrate (SQL up/down) | schema ตรวจได้ใน PR, ใช้ใน CI และเซิร์ฟเวอร์ได้ |
| Auth | Session cookie (HttpOnly, SameSite=Lax, Secure) เก็บใน PostgreSQL | ถอนสิทธิ์ทันที, เหมาะกับระบบภายใน; ต้องมี CSRF token |
| Password | argon2id | login ด้วยรหัสพนักงาน, ผู้ดูแลสร้างบัญชี ไม่มีสมัครเอง |
| Background jobs | Goroutine scheduler ใน process เดียวกัน + คิวในตาราง `jobs` (PostgreSQL) | ไม่เพิ่ม Redis; ใช้ `pg_advisory_lock` / `SELECT … FOR UPDATE SKIP LOCKED` กันทำซ้ำ |
| API contract | OpenAPI 3.1 เป็นแหล่งจริง → gen TypeScript client/types ฝั่ง web | type สองฝั่งตรงกัน; ตรวจ request ฝั่ง Go ด้วย spec |
| Notification | In-app + polling 15–30 วิ (เปลี่ยนเป็น SSE ภายหลังได้) | ทน Wi-Fi อ่อน |
| File storage | MinIO (S3-compatible) เก็บไฟล์, metadata+สิทธิ์ใน DB | ตามที่ตกลง |
| Deploy | Docker Compose บน server ภายใน: `web`, `api`, `postgres`, `minio`, `nginx` | on-premises |

**ข้อควรระวัง:** การเปลี่ยนเป็น Redis/queue แยกภายหลังต้องแก้เฉพาะชั้น `jobs` ผ่าน interface `JobQueue` จึงต้องเขียนผ่าน interface ตั้งแต่ต้น

## 2. โครงสร้างโปรเจกต์ `api/`

```
api/
  cmd/api/main.go            # entry: config, DI, start HTTP + scheduler
  cmd/migrate/main.go        # รัน golang-migrate (ใช้ใน compose/CI)
  migrations/                # 0001_init.up.sql / .down.sql ...
  openapi/openapi.yaml       # สัญญา API (แหล่งจริง)
  internal/
    config/                  # env, ค่าเริ่มต้น, validate ตอน boot
    http/                    # fiber app, middleware (session, csrf, rbac, request-id, logging, rate-limit)
      handlers/              # แปลง request/response เท่านั้น ไม่มี business logic
    domain/                  # entity + กฎธุรกิจล้วน (workflow, sla) ไม่พึ่ง Fiber/GORM
    service/                 # use case: breakdown, workorder, asset, sla, notification, report
    repo/                    # GORM repositories (interface อยู่ฝั่ง service)
    storage/                 # MinIO adapter
    jobs/                    # JobQueue interface + postgres impl + scheduler + handlers
    audit/                   # เขียน audit_logs ใน transaction เดียวกับการเปลี่ยนแปลง
    authz/                   # permission + scope check
  test/                      # integration tests (testcontainers-go: postgres, minio)
```

กฎ: handler → service → repo ทิศทางเดียว · `domain` เป็น pure Go ทดสอบหน่วยได้ง่ายที่สุด · ทุกการเปลี่ยนสถานะผ่าน `service` เท่านั้น

## 3. Data model

ใช้ UUID (v7 ถ้าได้) เป็น PK ทุกตาราง · เวลาเก็บ `timestamptz` (UTC) แสดงเป็น Asia/Bangkok ที่ frontend · master data ใช้ `is_active` ไม่ลบจริง · ทุกตาราง `created_at/updated_at`

### 3.1 Identity & scope
`users(id, employee_code UNIQUE, name, email, password_hash, status, must_change_password)` ·
`roles(id, code)` · `permissions(id, code)` · `role_permissions` · `user_roles` ·
`user_scopes(user_id, plant_id, area_id NULL, line_id NULL)` — NULL = ทั้งระดับนั้น ·
`sessions(id, user_id, token_hash, csrf_token, expires_at, ip, user_agent, revoked_at)` ·
`login_attempts` (rate limit/lockout)

### 3.2 Organization & assets
`plants(code, name, timezone)` · `areas(plant_id, code, name)` · `production_lines(area_id, code, name)` ·
`assets(id, asset_code UNIQUE, qr_value UNIQUE, name, line_id, parent_asset_id NULL, criticality, status, manufacturer, model, serial_no, installed_on, responsible_team_id)` ·
`asset_documents(asset_id, file_id, doc_type)` · `asset_meters(asset_id, name, unit)` · `meter_readings(meter_id, value, read_at)` (R2)
`asset_code` สร้างจากลำดับต่อ `plant-area-line` ด้วย `asset_sequences` (กันเลขซ้ำใน transaction)

### 3.3 Work orders (BM เป็น `type='BM'`)
- `breakdown_reports(id, report_no, asset_id, reporter_id, detected_at, stopped_at, reported_at, machine_condition, symptom, impact_note, safety_risk, idempotency_key UNIQUE)`
- `work_orders(id, wo_no UNIQUE, type, asset_id, report_id NULL, parent_incident_id NULL, title, priority, status, team_id, lead_user_id, sla_snapshot jsonb, sla_paused_total_sec, created_at, closed_at)`
- เวลาสำคัญแยกคอลัมน์ ไม่ใช้ start/end คู่เดียว: `reported_at, acknowledged_at, arrived_at, diagnosis_started_at, repair_started_at, repair_completed_at, test_started_at, restored_at, production_verified_at, closed_at`
- `work_order_assignments(wo_id, user_id, role: lead|member)` · `work_order_events(wo_id, from_status, to_status, actor_id, reason, occurred_at)` **append-only**
- `work_logs(wo_id, user_id, activity, started_at, ended_at, notes)` — แรงงานรายคน · `work_order_parts(wo_id, item_code, name, qty, unit)` (R1 บันทึกอย่างเดียว; R3 เชื่อมสต็อก)
- `work_order_attachments(wo_id, file_id, kind: before|after|other)` · `production_verifications(wo_id, verified_by, verified_at, result, notes)`
- `downtime_events(asset_id, wo_id, stopped_at, restored_at, reason)` · `waiting_periods(wo_id, kind: parts|production|expert|contractor, started_at, ended_at, reason)`
- `failure_categories / failure_modes / root_causes / repair_actions` (master) · `work_order_classification(wo_id, category_id, mode_id, root_cause_id, action_id, exception_approved_by NULL)`
- `sla_breaches(wo_id, metric, breached_at, reason_code, reason_note, recorded_by)`
- `sla_pauses(wo_id, metric, started_at, ended_at, reason, approved_by)` — อนุมัติโดยหัวหน้าฝ่ายผลิตเท่านั้น

### 3.4 SLA configuration (ตามสเปกที่ตกลง)
`maintenance_sla_configs(id, priority, response_time_minutes, arrival_time_minutes, restoration_time_minutes, warning_threshold_percent, escalation_threshold_percent, is_active, effective_from, effective_until, created_at)` + `plant_id NULL` (ตั้งต่อโรงงานได้)
`maintenance_sla_escalations(id, config_id, level: warning|escalation|breach, notify_role, channel)`
**Versioning:** ตอนสร้าง WO ให้คัดลอก config ที่มีผล (`effective_from ≤ now < effective_until`) ลง `work_orders.sla_snapshot` — แก้ config ทีหลังไม่กระทบใบเดิม; เปลี่ยน priority ทีหลังไม่เปลี่ยน snapshot ของใบที่เปิดอยู่ (ตามที่ตกลง) แต่บันทึกใน events

### 3.5 Support
`notifications(user_id, event_type, title, body, entity_ref, created_at, read_at)` · `files(id, bucket, object_key, mime, size, sha256, uploaded_by)` ·
`jobs(id, kind, payload, run_at, attempts, locked_at, locked_by, status, last_error)` · `audit_logs(actor_id, entity_type, entity_id, action, before_json, after_json, ip, created_at)` ·
`settings(key, value jsonb)` · `number_sequences(kind, period, last_value)` (เลข `BM-YYYYMM-0001` รีเซ็ตรายเดือนต่อโรงงาน)

Index ที่ต้องมี: `work_orders(status, priority)`, `work_orders(asset_id, created_at)`, `work_order_events(wo_id, occurred_at)`, `downtime_events(asset_id, stopped_at)`, `notifications(user_id, read_at)`, `jobs(status, run_at)`.

## 4. Auth, RBAC และ scope

1. **Login:** `POST /auth/login` (employee_code + password) → สร้าง session แถวใน DB, ตั้ง cookie, ส่ง CSRF token · rate limit ต่อ IP+user, lockout ชั่วคราว, audit
2. **Middleware ทุก request:** ตรวจ session → โหลด user/roles/scopes → ตรวจ CSRF กับ method ที่เปลี่ยนข้อมูล → ตรวจ permission → ตรวจ scope ของ resource
3. **Permission code ตัวอย่าง:** `breakdown.create`, `breakdown.triage`, `wo.assign`, `wo.transition.<to_status>`, `wo.verify_restore`, `wo.close`, `sla.config.write`, `sla.pause.approve`, `asset.write`, `user.admin`, `report.read`
4. **Scope:** repo query ทุกตัวต้องรับ `Scope` และ filter (`plant/area/line`) — ห้ามมีเส้นทางที่ดึงตาม id ตรง ๆ โดยไม่ตรวจ scope (ป้องกัน IDOR) · ครอบด้วย integration test
5. ตารางสิทธิ์ตามบทบาท (พนักงานผลิต, ช่าง, หัวหน้าบำรุง, ผู้จัดการ, หัวหน้าฝ่ายผลิต, admin, viewer) เก็บเป็น seed migration แก้ได้ผ่าน admin ภายหลัง

## 5. Workflow service

- ตาราง transition เป็นโค้ดใน `domain/workflow` ชุดเดียวกับ `web/src/lib/workflow.ts` (frontend ใช้แค่ซ่อนปุ่ม — **backend เป็นผู้ตัดสิน**) และมี test เทียบสองตารางกันใน CI
- `POST /work-orders/{id}/transitions {to, reason?, idempotency_key}`: เปิด transaction → `SELECT … FOR UPDATE` แถว WO → ตรวจ transition + role + scope + guard → อัปเดตสถานะ/เวลา → แทรก `work_order_events` + `audit_logs` + สร้าง notification/job → commit
- **Guards:** `Rejected` ต้องมีเหตุผล · `WaitingParts/WaitingProduction` ต้องมีเหตุผลและเปิด `waiting_periods` · `Restored` เฉพาะหัวหน้าฝ่ายผลิต และเขียน `production_verifications` + ปิด `downtime_events` · `Closed` เฉพาะหัวหน้าบำรุง และบล็อกถ้า (ก) classification ไม่ครบและไม่มี exception (ข) เกิน SLA แต่ไม่มี `sla_breaches.reason` (ค) งานค้าง waiting
- Concurrency: optimistic version (`row_version`) + 409 เมื่อชน · Reopen: สร้าง event ใหม่ ไม่เขียนทับข้อมูลซ่อมเดิม
- Idempotency: unique `idempotency_key` กันกดซ้ำ/retry เมื่อเน็ตหลุด

## 6. SLA engine

- **ฟังก์ชันล้วน** `domain/sla`: รับ snapshot + timestamps + pauses → คืน `{metric, target, elapsed, state}` (ใช้ซ้ำใน API, worker และ report) · นับ 24 ชม. ต่อเนื่อง · Response/Arrival จาก `reported_at` · Restoration จาก `stopped_at` (ถ้าไม่มีใช้ `reported_at`) ถึง `restored_at` · **ไม่หยุดนับ** ตอน waiting; หยุดได้เฉพาะแถวใน `sla_pauses` ที่อนุมัติแล้ว
- **Scheduler** รันทุก 30 วินาที: ดึง WO ที่ยังไม่จบ → คำนวณ → ถ้าข้าม 50%/80%/100% ที่ยังไม่เคยแจ้ง ให้สร้าง notification ตาม `maintenance_sla_escalations` (50% ช่าง · 80% หัวหน้าบำรุง · เกิน: P1/P2 → Manager, P3/P4 → Supervisor) โดยบันทึก "แจ้งแล้ว" ต่อระดับเพื่อไม่ส่งซ้ำ และสร้าง `sla_breaches` แถวเมื่อเกิน
- ใช้ `pg_advisory_lock` ให้มีผู้รัน tick เดียวเมื่อมีหลาย instance · tick ที่ค้างหรือพลาดต้องไล่ตามได้ (คำนวณจากเวลาจริง ไม่ใช่นับ tick)
- เปลี่ยนเวลา/ไทม์โซน: เก็บ UTC ทั้งหมด; ทดสอบข้ามเที่ยงคืนและเปลี่ยนวัน

## 7. API (ย่อ — รายละเอียดอยู่ใน `openapi.yaml`)

รูปแบบ: `/api/v1`, JSON, cursor/offset pagination (`page`, `page_size ≤ 100`), filter/sort ตาม query, error มาตรฐาน `{code, message, details[], request_id}`, เวลาเป็น RFC3339 UTC

| กลุ่ม | Endpoint หลัก |
|---|---|
| Auth | `POST /auth/login` · `POST /auth/logout` · `GET /me` · `POST /auth/change-password` |
| Master | `/plants` `/areas` `/lines` `/assets` (+`/assets/{id}/history`, `/assets/by-qr/{value}`) · `/failure-*` |
| Breakdown | `POST /breakdowns` (idempotent) · `GET /breakdowns` · `POST /breakdowns/{id}/triage` · `…/link-duplicate` |
| Work orders | `GET/POST /work-orders` · `GET /work-orders/{id}` · `POST …/assignments` · `POST …/transitions` · `POST …/work-logs` · `POST …/parts` · `POST …/classification` · `POST …/verification` · `POST …/close` · `POST …/pause-requests` · `POST …/breach-reason` |
| SLA | `GET/PUT /sla/configs` · `GET/PUT /sla/escalations` |
| Files | `POST /files` (multipart, ตรวจชนิด/ขนาด ≤10MB, ≤10 ไฟล์/ใบ) · `GET /files/{id}` (ตรวจสิทธิ์ก่อน stream/presign) |
| Notifications | `GET /notifications?since=` (polling) · `POST /notifications/{id}/read` |
| Reports | `GET /reports/kpis` · `/reports/downtime` · `/reports/pareto` · `/reports/export?format=csv|xlsx|pdf` |
| Admin | `/users` `/roles` `/scopes` `/settings` `/audit-logs` |
| Ops | `GET /healthz` · `GET /readyz` |

## 8. Notifications, ไฟล์, audit, report

- **Notification:** เขียนลงตารางในธุรกรรมเดียวกับเหตุการณ์ → frontend polling `GET /notifications?since=…` ทุก 15–30 วิ (backoff เมื่อออฟไลน์) · email/LINE เป็นช่องทางเสริมภายหลังผ่าน interface `Notifier`
- **ไฟล์:** ตรวจ MIME จาก magic bytes ไม่เชื่อ extension, จำกัดขนาด/จำนวน, ตั้งชื่อ object แบบสุ่ม, ไม่เปิด bucket สาธารณะ, ดาวน์โหลดผ่าน API ที่ตรวจ scope (หรือ presigned URL อายุสั้น) · สแกนไวรัสเป็นตัวเลือกถ้าโครงสร้างพื้นฐานรองรับ
- **Audit:** เขียนในธุรกรรมเดียวกัน: เปลี่ยน priority/assignment/status/equipment/closure/reopen/SLA config, login สำเร็จ/ล้มเหลว
- **KPI:** query SQL/view แยกตามนิยามที่ตกลง (MTTR = เวลาซ่อมจริงจาก `work_logs`/ช่วง repair ไม่นับ waiting; Downtime = `stopped_at`→`restored_at`; MTBF ใช้เวลาปฏิทินเป็นค่าประมาณและติดป้ายกำกับ) · export XLSX/PDF แบบ stream

## 9. Security & reliability

HTTPS (nginx) · cookie HttpOnly/Secure/SameSite · CSRF · rate limit login และ upload · validate input ด้วย schema (OpenAPI) · parameterized query ผ่าน GORM · ไม่ log ข้อมูลลับ · secrets ผ่าน env/Docker secrets ไม่ commit · security headers · backup `pg_dump` + MinIO ตามตารางเวลา และซ้อมกู้คืนเป็นระยะ · retention ตั้งค่าได้ (placeholder 5 ปี) · health/readiness + structured logs + request-id

## 10. Testing

| ชั้น | วิธี |
|---|---|
| Unit | `domain/workflow`, `domain/sla` (table-driven: ข้ามเที่ยงคืน, waiting, pause, versioning, boundary 50/80/100%) |
| Integration | testcontainers-go (PostgreSQL + MinIO): repo, transition ทั้ง valid/invalid, concurrency (สองคน transition พร้อมกัน), idempotency |
| Permission | ทุก endpoint × ทุกบทบาท × in/out of scope; ทดสอบ API โดยตรงไม่พึ่ง UI |
| Contract | openapi lint + ตรวจ response ตรง spec + gen client ไม่มี diff ใน CI |
| E2E | Playwright ใน `web/` ชี้ API จริง (flow แจ้ง→ปิดงาน) |
| Non-functional | โหลดค้นหา WO/asset, backup/restore, security scan (govulncheck, gosec) |

## 11. Phase ของ backend (อยู่ใน Release 1)

| Phase | งาน | Acceptance |
|---|---|---|
| **B0 Skeleton** (≈1 สัปดาห์) | `api/` โครง, config, Fiber, healthz, compose (postgres+minio), golang-migrate, CI (lint/test/build), OpenAPI เริ่มต้น + gen client | `docker compose up` ได้ · CI เขียว · `/healthz` ตอบ |
| **B1 Identity** (≈1–2 สัปดาห์) | users/roles/permissions/scopes, session+CSRF, login/lockout, audit พื้นฐาน, seed บทบาท | login/logout ได้ · ทดสอบ permission/scope ผ่าน · session ถูกเพิกถอนทันที |
| **B2 Master data** (≈1–2 สัปดาห์) | plants/areas/lines/assets + QR, failure taxonomy, sequences, SLA configs + escalations (+ versioning) | สร้าง/ค้นหาเครื่อง, QR resolve ถูก, แก้ SLA ไม่กระทบใบเก่า |
| **B3 Breakdown & Triage** (≈2 สัปดาห์) | breakdown report (idempotent), ไฟล์ MinIO, triage, duplicate/cancel/reject, notifications + polling | พนักงานผลิตแจ้งได้ · หัวหน้าคัดกรองได้ · ไฟล์ตรวจชนิด/ขนาด/สิทธิ์ |
| **B4 Work order engine** (≈3 สัปดาห์) | workflow service ครบ 15 สถานะ, assignments, work logs, labor, parts, downtime, waiting periods, classification, verification, close/reopen | transition ผิดถูกปฏิเสธ · ปิดงานถูกบล็อกเมื่อข้อมูลไม่ครบ · concurrency ปลอดภัย |
| **B5 SLA engine & jobs** (≈2 สัปดาห์) | pure SLA calc, scheduler + jobs queue, escalation 50/80/เกิน, breach reason, pause+approval | เหตุการณ์ SLA ตรงตัวอย่าง (P1 60 นาที → 30/48/60) · ไม่ส่งซ้ำ · หลาย instance ไม่ซ้ำ |
| **B6 KPI & reports** (≈2 สัปดาห์) | KPI endpoints, dashboard data, export CSV/XLSX/PDF | KPI ตรงตัวอย่างคำนวณ · export ตรงกับข้อมูลต้นทาง |
| **B7 Integrate & harden** (≈2 สัปดาห์) | เปลี่ยน web เป็น `NEXT_PUBLIC_API_MODE=http`, E2E, security review, backup/restore, เอกสาร deploy | UAT pilot ผ่าน · ไม่มี critical security/data-integrity defect |

รวมประมาณ 14–16 สัปดาห์สำหรับ backend ของ Release 1 ถ้าทีม 2–3 คนทำคู่ขนานกับ frontend (ประมาณการ ไม่ใช่คำมั่น) — ปรับให้สอดคล้องกับ "Release 1 ≈ 8–10 สัปดาห์" ใน PLAN.md เมื่อทีมและขอบเขต pilot ชัดเจน

## 12. ความเสี่ยงและเรื่องที่ยังเปิด

- **ระยะเวลา:** ตัวเลขข้างบนเกินช่วง 8–10 สัปดาห์ใน PLAN.md — ต้องตกลงว่าจะลดขอบเขต B6/B7 หรือเพิ่มคน
- **คิวบน PostgreSQL** พอสำหรับปริมาณงานระดับโรงงานเดียว ถ้าโตมากต้องย้ายไป queue แยกผ่าน `JobQueue`
- **MTBF** ต้องมีเวลาเดินเครื่องจริง ถ้าไม่มีใช้เวลาปฏิทินและติดป้ายกำกับ
- **LOTO/permit** รอ EHS กำหนด ออกแบบเป็น checklist ตั้งค่าได้ ไม่ยืนยันความปลอดภัยแทนคน
- **ไทม์โซน/กะ:** ตอนนี้ SLA นับ 24 ชม.; ถ้าภายหลังต้องนับตามกะ ต้องเพิ่ม calendar ในชั้น `domain/sla` (ออกแบบให้แทนที่ได้)
