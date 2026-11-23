import type { Priority, SlaConfig, WorkOrder } from "./types";

// Proposed SLA (trial values, editable by admin). All times in minutes, 24h continuous calendar.
export const SLA_DEFAULTS: SlaConfig[] = [
  { priority: "P1", label: "Critical", response: 5, arrival: 10, restoration: 60, warn: 50, escalate: 80 },
  { priority: "P2", label: "High", response: 10, arrival: 20, restoration: 120, warn: 50, escalate: 80 },
  { priority: "P3", label: "Normal", response: 30, arrival: 60, restoration: 240, warn: 50, escalate: 80 },
  { priority: "P4", label: "Low", response: 120, arrival: 240, restoration: 480, warn: 50, escalate: 80 },
];

export const ESCALATION_BREACH_TO: Record<Priority, string> = {
  P1: "Maintenance Manager", P2: "Maintenance Manager", P3: "Maintenance Supervisor", P4: "Maintenance Supervisor",
};

export const slaFor = (p: Priority) => SLA_DEFAULTS.find((s) => s.priority === p)!;
const mins = (a: string, b: string) => (new Date(b).getTime() - new Date(a).getTime()) / 60000;

export type SlaState = "ok" | "warning" | "escalated" | "breached" | "met";
export interface SlaMeter { label: string; target: number; elapsed: number; state: SlaState; done: boolean }

function meter(label: string, target: number, elapsed: number, done: boolean, cfg: SlaConfig): SlaMeter {
  const pct = (elapsed / target) * 100;
  let state: SlaState = "ok";
  if (done) state = elapsed <= target ? "met" : "breached";
  else if (pct >= 100) state = "breached";
  else if (pct >= cfg.escalate) state = "escalated";
  else if (pct >= cfg.warn) state = "warning";
  return { label, target, elapsed: Math.round(elapsed), state, done };
}

/** Response/Arrival measure from reportedAt; Restoration from stoppedAt (machine stop) until production confirms. */
export function computeSla(wo: WorkOrder, now: string): SlaMeter[] {
  if (wo.type !== "BM") return [];
  const cfg = slaFor(wo.priority);
  const out: SlaMeter[] = [];
  out.push(meter("Response", cfg.response, mins(wo.reportedAt, wo.acknowledgedAt ?? now), !!wo.acknowledgedAt, cfg));
  out.push(meter("Arrival", cfg.arrival, mins(wo.reportedAt, wo.arrivedAt ?? now), !!wo.arrivedAt, cfg));
  const start = wo.stoppedAt ?? wo.reportedAt;
  out.push(meter("Restoration", cfg.restoration, mins(start, wo.restoredAt ?? now), !!wo.restoredAt, cfg));
  return out;
}

export const fmtMin = (m: number) => (m >= 60 ? `${Math.floor(m / 60)} ชม. ${m % 60} นาที` : `${m} นาที`);
