// ALL DATA BELOW IS FICTIONAL (Demo Auto Parts Co.). No real company, people, assets or figures.
import type { Asset, User, WoEvent, WoStatus, WorkOrder, Priority } from "@/lib/types";

export const NOW = "2026-11-23T10:00:00+07:00";
export const COMPANY = "Demo Auto Parts Co.";

export const USERS: User[] = [
  { id: "u1", name: "สมชาย ใจดี", role: "operator", employeeCode: "E1001" },
  { id: "u2", name: "วิภา ศรีสุข", role: "technician", employeeCode: "M2001", team: "Mechanical" },
  { id: "u3", name: "ณัฐ พรหมมา", role: "technician", employeeCode: "M2002", team: "Electrical" },
  { id: "u4", name: "ธนา วงศ์ไทย", role: "supervisor", employeeCode: "M3001" },
  { id: "u5", name: "ปราณี มั่นคง", role: "manager", employeeCode: "M4001" },
  { id: "u6", name: "อนุชา เรืองศรี", role: "prod_supervisor", employeeCode: "P3001" },
  { id: "u7", name: "ผู้ดูแลระบบ", role: "admin", employeeCode: "A0001" },
];
export const userName = (id?: string) => USERS.find((u) => u.id === id)?.name ?? id ?? "-";

export const LINES = ["LN-01 ปั๊มขึ้นรูป", "LN-02 เชื่อม", "LN-03 CNC", "LN-04 ฉีดพลาสติก", "LN-05 ประกอบ"];

const A = (n: number, code: string, name: string, line: string, c: "A" | "B" | "C", status: Asset["status"], mf: string, model: string, y: string): Asset =>
  ({ id: `a${n}`, code, name, line, area: "AREA-1", criticality: c, status, manufacturer: mf, model, installed: y });
export const ASSETS: Asset[] = [
  A(1, "DAP-A1-LN01-0001", "เครื่องปั๊ม 250T #1", LINES[0], "A", "stopped", "Acme Press", "AP-250", "2019-03-01"),
  A(2, "DAP-A1-LN01-0002", "เครื่องปั๊ม 160T #2", LINES[0], "B", "running", "Acme Press", "AP-160", "2020-06-15"),
  A(3, "DAP-A1-LN02-0001", "หุ่นยนต์เชื่อม R1", LINES[1], "A", "running", "RoboWeld", "RW-6", "2021-01-10"),
  A(4, "DAP-A1-LN02-0002", "หุ่นยนต์เชื่อม R2", LINES[1], "A", "maintenance", "RoboWeld", "RW-6", "2021-01-10"),
  A(5, "DAP-A1-LN03-0001", "CNC Lathe #1", LINES[2], "B", "running", "Nordic CNC", "NL-300", "2018-09-20"),
  A(6, "DAP-A1-LN03-0002", "CNC Mill #2", LINES[2], "B", "running", "Nordic CNC", "NM-500", "2018-09-20"),
  A(7, "DAP-A1-LN04-0001", "เครื่องฉีดพลาสติก 350T", LINES[3], "A", "running", "PlastoJet", "PJ-350", "2022-02-02"),
  A(8, "DAP-A1-LN04-0002", "Chiller หล่อเย็น", LINES[3], "B", "running", "CoolTech", "CT-40", "2022-02-02"),
  A(9, "DAP-A1-LN05-0001", "สายพานลำเลียงประกอบ", LINES[4], "C", "running", "ConveyX", "CX-12", "2020-11-11"),
  A(10, "DAP-A1-LN05-0002", "Air Compressor 37kW", LINES[4], "A", "running", "AirPro", "AP-37", "2017-05-05"),
];
export const assetById = (id: string) => ASSETS.find((a) => a.id === id);

const t = (d: string, hm: string) => `${d}T${hm}:00+07:00`;
const ev = (at: string, status: WoStatus, actor: string, note?: string): WoEvent => ({ at, status, actor, note });

const base = (o: Partial<WorkOrder> & Pick<WorkOrder, "no" | "assetId" | "title" | "priority" | "status" | "reportedAt">): WorkOrder => ({
  id: o.no, type: "BM", symptom: o.title, reporter: "u1", machineCondition: "stopped", safetyRisk: false,
  events: [], parts: [], laborHours: [], ...o,
});

export const WORK_ORDERS: WorkOrder[] = [
  base({ no: "BM-202611-0012", assetId: "a1", title: "ปั๊มหยุดกลางจังหวะ มีเสียงดังผิดปกติ", priority: "P1", status: "Repairing",
    reportedAt: t("2026-11-23", "08:40"), stoppedAt: t("2026-11-23", "08:35"), acknowledgedAt: t("2026-11-23", "08:43"),
    arrivedAt: t("2026-11-23", "08:52"), lead: "u2", failureCategory: "Mechanical",
    events: [ev(t("2026-11-23", "08:40"), "Submitted", "u1"), ev(t("2026-11-23", "08:42"), "UnderTriage", "u4"),
      ev(t("2026-11-23", "08:42"), "Assigned", "u4", "มอบหมาย วิภา"), ev(t("2026-11-23", "08:43"), "Acknowledged", "u2"),
      ev(t("2026-11-23", "08:52"), "OnSite", "u2"), ev(t("2026-11-23", "09:05"), "Diagnosing", "u2", "สงสัย clutch/brake"),
      ev(t("2026-11-23", "09:30"), "Repairing", "u2")], laborHours: [{ user: "u2", hours: 1.2 }] }),
  base({ no: "BM-202611-0013", assetId: "a4", title: "หุ่นยนต์เชื่อม R2 error E-204 สายเชื่อมไม่ป้อน", priority: "P2", status: "WaitingParts",
    reportedAt: t("2026-11-23", "07:10"), stoppedAt: t("2026-11-23", "07:05"), acknowledgedAt: t("2026-11-23", "07:18"),
    arrivedAt: t("2026-11-23", "07:35"), lead: "u3", failureCategory: "Electrical",
    parts: [{ code: "WF-MOT-01", name: "มอเตอร์ป้อนลวดเชื่อม", qty: 1, unit: "ชิ้น" }],
    events: [ev(t("2026-11-23", "07:10"), "Submitted", "u1"), ev(t("2026-11-23", "07:12"), "Assigned", "u4"),
      ev(t("2026-11-23", "07:18"), "Acknowledged", "u3"), ev(t("2026-11-23", "07:35"), "OnSite", "u3"),
      ev(t("2026-11-23", "08:10"), "WaitingParts", "u3", "มอเตอร์ป้อนลวดเสีย รออะไหล่จากคลัง")] }),
  base({ no: "BM-202611-0014", assetId: "a10", title: "คอมเพรสเซอร์ความดันตก เสียงผิดปกติ", priority: "P2", status: "Submitted",
    reportedAt: t("2026-11-23", "09:48"), stoppedAt: undefined, machineCondition: "degraded", reporter: "u1",
    events: [ev(t("2026-11-23", "09:48"), "Submitted", "u1")] }),
  base({ no: "BM-202611-0011", assetId: "a7", title: "เครื่องฉีดอุณหภูมิ barrel สูงเกิน", priority: "P3", status: "Testing",
    reportedAt: t("2026-11-23", "06:00"), stoppedAt: t("2026-11-23", "05:58"), acknowledgedAt: t("2026-11-23", "06:20"),
    arrivedAt: t("2026-11-23", "06:50"), lead: "u3", failureCategory: "Control/PLC", rootCause: "Sensor drift", repairAction: "Replace",
    events: [ev(t("2026-11-23", "06:00"), "Submitted", "u1"), ev(t("2026-11-23", "06:20"), "Acknowledged", "u3"),
      ev(t("2026-11-23", "06:50"), "OnSite", "u3"), ev(t("2026-11-23", "08:40"), "Testing", "u3", "เปลี่ยน thermocouple แล้ว")],
    parts: [{ code: "TC-K-02", name: "Thermocouple type K", qty: 1, unit: "ชิ้น" }], laborHours: [{ user: "u3", hours: 2.4 }] }),
  base({ no: "BM-202611-0010", assetId: "a9", title: "สายพานลำเลียงสะดุด", priority: "P4", status: "Restored",
    reportedAt: t("2026-11-22", "14:00"), stoppedAt: t("2026-11-22", "13:55"), acknowledgedAt: t("2026-11-22", "14:50"),
    arrivedAt: t("2026-11-22", "16:00"), restoredAt: t("2026-11-22", "17:30"), lead: "u2", failureCategory: "Mechanical",
    rootCause: "Wear", repairAction: "Adjust",
    events: [ev(t("2026-11-22", "14:00"), "Submitted", "u1"), ev(t("2026-11-22", "17:30"), "Restored", "u6")] }),
  base({ no: "BM-202611-0009", assetId: "a2", title: "เซนเซอร์ตำแหน่งแท่นปั๊มอ่านค่าเพี้ยน", priority: "P3", status: "Closed",
    reportedAt: t("2026-11-20", "10:00"), stoppedAt: t("2026-11-20", "09:50"), acknowledgedAt: t("2026-11-20", "10:10"),
    arrivedAt: t("2026-11-20", "10:40"), restoredAt: t("2026-11-20", "16:30"), lead: "u3", failureCategory: "Sensor",
    rootCause: "Contamination", repairAction: "Clean", breachReason: "รอผู้เชี่ยวชาญจากผู้ผลิตตรวจสอบ",
    events: [ev(t("2026-11-20", "10:00"), "Submitted", "u1"), ev(t("2026-11-20", "17:00"), "Closed", "u4")] }),
  base({ no: "PM-202611-0031", type: "PM", assetId: "a5", title: "PM รายเดือน CNC Lathe #1 (หล่อลื่น/ตรวจแกนหมุน)", priority: "P3",
    status: "Assigned", reportedAt: t("2026-11-23", "08:00"), lead: "u2", events: [ev(t("2026-11-23", "08:00"), "Assigned", "u4")] }),
  base({ no: "IN-202611-0004", type: "Inspection", assetId: "a8", title: "ตรวจเช็ก Chiller ประจำสัปดาห์", priority: "P4",
    status: "Closed", reportedAt: t("2026-11-21", "09:00"), lead: "u3", events: [ev(t("2026-11-21", "11:00"), "Closed", "u3")] }),
];

// Deterministic 30-day history for charts (fictional).
function rng(seed: number) { let s = seed; return () => ((s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296); }
const r = rng(42);
export const DAILY = Array.from({ length: 30 }, (_, i) => {
  const d = new Date("2026-10-25T00:00:00+07:00"); d.setDate(d.getDate() + i);
  return { date: `${d.getDate()}/${d.getMonth() + 1}`, breakdowns: Math.round(1 + r() * 5), downtime: Math.round(20 + r() * 180) };
});
export const PARETO = [
  { name: "Mechanical", count: 24 }, { name: "Electrical", count: 17 }, { name: "Pneumatic", count: 9 },
  { name: "Control/PLC", count: 7 }, { name: "Sensor", count: 6 }, { name: "Hydraulic", count: 4 }, { name: "Other", count: 2 },
];
export const DOWNTIME_BY_LINE = LINES.map((l, i) => ({ line: l.split(" ")[0], hours: [38, 22, 15, 27, 9][i] }));
export const KPI = { mttrMin: 94, mtbfHours: 156, repeatRate: 8.4, response: 93, arrival: 88, restoration: 81, breaches: 7, avgResponse: 11, avgRestoration: 118 };

export const PARTS = [
  { code: "BRG-6205", name: "ตลับลูกปืน 6205", stock: 12, min: 10, unit: "ชิ้น", cost: 120, loc: "คลัง A-01" },
  { code: "WF-MOT-01", name: "มอเตอร์ป้อนลวดเชื่อม", stock: 0, min: 1, unit: "ชิ้น", cost: 8500, loc: "คลัง B-03" },
  { code: "TC-K-02", name: "Thermocouple type K", stock: 3, min: 4, unit: "ชิ้น", cost: 650, loc: "คลัง A-07" },
  { code: "BLT-V-B52", name: "สายพาน V-Belt B52", stock: 8, min: 4, unit: "เส้น", cost: 210, loc: "คลัง A-02" },
  { code: "SOL-VLV-24", name: "โซลินอยด์วาล์ว 24V", stock: 2, min: 3, unit: "ชิ้น", cost: 1450, loc: "คลัง B-01" },
  { code: "OIL-HYD-46", name: "น้ำมันไฮดรอลิก VG46", stock: 6, min: 2, unit: "ถัง", cost: 3200, loc: "คลัง C-01" },
];
export const VENDORS = [
  { id: "v1", name: "Siam Industrial Supply (สมมติ)", type: "ผู้ขายอะไหล่", contact: "sales@example.com", phone: "02-000-0001" },
  { id: "v2", name: "Nordic CNC Service (สมมติ)", type: "ผู้รับเหมาซ่อม", contact: "service@example.com", phone: "02-000-0002" },
  { id: "v3", name: "RoboWeld Thailand (สมมติ)", type: "ผู้ผลิต/ตัวแทน", contact: "support@example.com", phone: "02-000-0003" },
];
export const POS = [
  { no: "PO-2611-001", vendor: "Siam Industrial Supply (สมมติ)", item: "มอเตอร์ป้อนลวดเชื่อม x2", total: 17000, status: "รออนุมัติ", requester: "ธนา วงศ์ไทย" },
  { no: "PO-2611-002", vendor: "Siam Industrial Supply (สมมติ)", item: "Thermocouple type K x10", total: 6500, status: "อนุมัติแล้ว", requester: "ธนา วงศ์ไทย" },
  { no: "PO-2610-014", vendor: "Nordic CNC Service (สมมติ)", item: "ค่าบริการ calibrate แกน CNC", total: 24000, status: "รับของแล้ว", requester: "ปราณี มั่นคง" },
];
export const METERS = [
  { id: "m1", asset: "a1", name: "ชั่วโมงเดินเครื่อง", value: 18420, unit: "ชม.", trigger: "ทุก 500 ชม. → PM หล่อลื่น", next: 18500 },
  { id: "m2", asset: "a10", name: "ชั่วโมงโหลด", value: 41230, unit: "ชม.", trigger: "ทุก 2,000 ชม. → เปลี่ยนไส้กรอง", next: 42000 },
  { id: "m3", asset: "a7", name: "จำนวนช็อต", value: 912400, unit: "ช็อต", trigger: "ทุก 1,000,000 ช็อต → ตรวจสกรู", next: 1000000 },
];
export const PM_PLANS = [
  { id: "pm1", asset: "a5", name: "PM รายเดือน CNC Lathe", freq: "ทุก 1 เดือน", next: "2026-11-23", checklist: "CL-CNC-M" },
  { id: "pm2", asset: "a10", name: "PM รายไตรมาส Compressor", freq: "ทุก 3 เดือน", next: "2026-12-05", checklist: "CL-AIR-Q" },
  { id: "pm3", asset: "a1", name: "ตรวจ clutch/brake ปั๊ม", freq: "ทุก 500 ชม.", next: "ตามมิเตอร์", checklist: "CL-PRESS-H" },
];
export const CHECKLISTS = [
  { code: "CL-CNC-M", name: "PM รายเดือน CNC", items: ["ตรวจระดับน้ำมันหล่อลื่น", "ทำความสะอาดแกนหมุน", "ตรวจ backlash", "ตรวจระบบน้ำหล่อเย็น"] },
  { code: "CL-AIR-Q", name: "PM รายไตรมาส Compressor", items: ["เปลี่ยนไส้กรองอากาศ", "ตรวจสายพาน", "ตรวจ safety valve", "ถ่ายน้ำ drain"] },
  { code: "CL-PRESS-H", name: "ตรวจ clutch/brake ปั๊ม", items: ["วัดระยะเบรก", "ตรวจแรงดันลม", "ตรวจเสียงผิดปกติ"] },
];
export const FILES = [
  { name: "คู่มือ AP-250 (ตัวอย่าง).pdf", asset: "a1", type: "Manual", size: "4.2 MB" },
  { name: "แผนผังไฟฟ้า RW-6 (ตัวอย่าง).pdf", asset: "a4", type: "Diagram", size: "1.8 MB" },
  { name: "ใบรับรอง Compressor (ตัวอย่าง).pdf", asset: "a10", type: "Certificate", size: "0.6 MB" },
];
export const LOCATIONS = [
  { name: "AREA-1 (โรงงานสมมติ)", children: LINES },
];
export const SLA_BREACH_REASONS = ["รออะไหล่", "รอผู้เชี่ยวชาญ", "รอผู้รับเหมา", "รอฝ่ายผลิตปล่อยเครื่อง", "อื่น ๆ"];
export const SYMPTOM_TEMPLATES = ["เครื่องหยุดทำงาน", "เสียงดังผิดปกติ", "ความร้อนสูง", "น้ำมัน/ลมรั่ว", "Error บนหน้าจอ", "ผลิตภัณฑ์ไม่ได้คุณภาพ"];
export type { Priority };
