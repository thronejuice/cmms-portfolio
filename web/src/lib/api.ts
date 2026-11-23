import type { Priority, WoStatus, WorkOrder } from "./types";
import { WORK_ORDERS, NOW } from "@/mock/data";

/** Swappable API layer. NEXT_PUBLIC_API_MODE=mock (default) uses in-browser data; "http" calls the Go Fiber API. */
export interface CmmsApi {
  listWorkOrders(): Promise<WorkOrder[]>;
  createBreakdown(input: { assetId: string; symptom: string; machineCondition: WorkOrder["machineCondition"]; safetyRisk: boolean; stoppedAt?: string; reporter: string }): Promise<WorkOrder>;
  transition(id: string, to: WoStatus, actor: string, note?: string): Promise<WorkOrder>;
  setPriority(id: string, p: Priority, actor: string): Promise<WorkOrder>;
}

const KEY = "cmms-portfolio-wo-v1";
let mem: WorkOrder[] | null = null;
const load = (): WorkOrder[] => {
  if (mem) return mem;
  try { const s = localStorage.getItem(KEY); if (s) return (mem = JSON.parse(s)); } catch {}
  return (mem = structuredClone(WORK_ORDERS));
};
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(mem)); } catch {} };
export const resetMock = () => { mem = null; try { localStorage.removeItem(KEY); } catch {} };
// Demo clock: starts at the fixed demo "now" and advances in real time, so SLA numbers stay coherent.
const T0 = Date.now();
export const demoNow = () => new Date(new Date(NOW).getTime() + (Date.now() - T0)).toISOString();
const nowIso = demoNow;

const mock: CmmsApi = {
  async listWorkOrders() { return load(); },
  async createBreakdown(i) {
    const list = load();
    const n = Math.max(0, ...list.filter((w) => w.type === "BM").map((w) => parseInt(w.no.split("-")[2], 10))) + 1;
    const wo: WorkOrder = {
      id: `BM-202611-${String(n).padStart(4, "0")}`, no: `BM-202611-${String(n).padStart(4, "0")}`, type: "BM", assetId: i.assetId,
      title: i.symptom, symptom: i.symptom, priority: i.safetyRisk ? "P1" : "P3", status: "Submitted", reporter: i.reporter,
      reportedAt: nowIso(), stoppedAt: i.stoppedAt, machineCondition: i.machineCondition, safetyRisk: i.safetyRisk,
      events: [{ at: nowIso(), status: "Submitted", actor: i.reporter }], parts: [], laborHours: [],
    };
    list.unshift(wo); save(); return wo;
  },
  async transition(id, to, actor, note) {
    const wo = load().find((w) => w.id === id)!;
    const at = nowIso();
    wo.status = to; wo.events.push({ at, status: to, actor, note });
    if (to === "Acknowledged") wo.acknowledgedAt = at;
    if (to === "OnSite") wo.arrivedAt = at;
    if (to === "Restored") wo.restoredAt = at;
    if (to === "Assigned" && !wo.lead) wo.lead = "u2";
    save(); return wo;
  },
  async setPriority(id, p, actor) {
    const wo = load().find((w) => w.id === id)!;
    wo.events.push({ at: nowIso(), status: wo.status, actor, note: `เปลี่ยน Priority ${wo.priority} → ${p}` });
    wo.priority = p; save(); return wo;
  },
};

// Placeholder for the real backend: same interface, backed by Go Fiber REST (/api/v1/work-orders ...).
const http: CmmsApi = {
  async listWorkOrders() { throw new Error("HTTP mode not implemented yet (Release 1 backend)"); },
  async createBreakdown() { throw new Error("not implemented"); },
  async transition() { throw new Error("not implemented"); },
  async setPriority() { throw new Error("not implemented"); },
};

export const api: CmmsApi = process.env.NEXT_PUBLIC_API_MODE === "http" ? http : mock;
