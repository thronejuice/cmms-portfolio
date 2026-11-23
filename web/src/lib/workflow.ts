import type { Role, WoStatus } from "./types";

export const STATUS_LABEL: Record<WoStatus, string> = {
  Submitted: "แจ้งแล้ว", UnderTriage: "กำลังคัดกรอง", Rejected: "ปฏิเสธ", Assigned: "มอบหมายแล้ว",
  Acknowledged: "รับทราบ", OnSite: "ถึงหน้างาน", Diagnosing: "วิเคราะห์สาเหตุ", Repairing: "กำลังซ่อม",
  WaitingParts: "รออะไหล่", WaitingProduction: "รอฝ่ายผลิต", Testing: "ทดสอบเครื่อง",
  Restored: "กลับมาผลิตได้", Closed: "ปิดงาน", Reopened: "เปิดใหม่",
};

export const MAIN_FLOW: WoStatus[] = [
  "Submitted", "UnderTriage", "Assigned", "Acknowledged", "OnSite", "Diagnosing", "Repairing", "Testing", "Restored", "Closed",
];

interface Transition { to: WoStatus; roles: Role[]; label: string }

/** Validated workflow — the real backend (Go) must enforce the same table. */
export const TRANSITIONS: Partial<Record<WoStatus, Transition[]>> = {
  Submitted: [{ to: "UnderTriage", roles: ["supervisor"], label: "เริ่มคัดกรอง" }],
  UnderTriage: [
    { to: "Assigned", roles: ["supervisor"], label: "มอบหมายช่าง" },
    { to: "Rejected", roles: ["supervisor"], label: "ปฏิเสธ (ไม่ใช่งานซ่อม)" },
  ],
  Assigned: [{ to: "Acknowledged", roles: ["technician"], label: "รับทราบงาน" }],
  Acknowledged: [{ to: "OnSite", roles: ["technician"], label: "ถึงหน้างาน" }],
  OnSite: [{ to: "Diagnosing", roles: ["technician"], label: "เริ่มวิเคราะห์" }],
  Diagnosing: [
    { to: "Repairing", roles: ["technician"], label: "เริ่มซ่อม" },
    { to: "WaitingParts", roles: ["technician", "supervisor"], label: "รออะไหล่" },
  ],
  Repairing: [
    { to: "Testing", roles: ["technician"], label: "ซ่อมเสร็จ → ทดสอบ" },
    { to: "WaitingParts", roles: ["technician", "supervisor"], label: "รออะไหล่" },
    { to: "WaitingProduction", roles: ["technician", "supervisor"], label: "รอฝ่ายผลิต" },
  ],
  WaitingParts: [{ to: "Repairing", roles: ["technician"], label: "ได้อะไหล่ → ซ่อมต่อ" }],
  WaitingProduction: [{ to: "Repairing", roles: ["technician"], label: "ซ่อมต่อ" }],
  Testing: [
    { to: "Restored", roles: ["prod_supervisor"], label: "ยืนยันกลับมาผลิตได้" },
    { to: "Reopened", roles: ["prod_supervisor", "supervisor"], label: "ทดสอบไม่ผ่าน → เปิดใหม่" },
  ],
  Restored: [
    { to: "Closed", roles: ["supervisor"], label: "อนุมัติปิดงาน" },
    { to: "Reopened", roles: ["prod_supervisor", "supervisor"], label: "เปิดใหม่" },
  ],
  Reopened: [{ to: "Assigned", roles: ["supervisor"], label: "มอบหมายใหม่" }],
};

export const nextActions = (s: WoStatus, role: Role) =>
  (TRANSITIONS[s] ?? []).filter((t) => t.roles.includes(role) || role === "admin");

export const ROLE_LABEL: Record<Role, string> = {
  operator: "พนักงานผลิต", technician: "ช่างซ่อมบำรุง", supervisor: "หัวหน้าบำรุง (Maintenance Supervisor)",
  manager: "ผู้จัดการบำรุง (Maintenance Manager)", prod_supervisor: "หัวหน้าฝ่ายผลิต", admin: "ผู้ดูแลระบบ",
};
