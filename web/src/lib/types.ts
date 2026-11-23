export type Role = "operator" | "technician" | "supervisor" | "manager" | "prod_supervisor" | "admin";
export type Priority = "P1" | "P2" | "P3" | "P4";
export type WoType = "BM" | "PM" | "Corrective" | "Inspection";
export type WoStatus =
  | "Submitted" | "UnderTriage" | "Rejected" | "Assigned" | "Acknowledged" | "OnSite"
  | "Diagnosing" | "Repairing" | "WaitingParts" | "WaitingProduction" | "Testing"
  | "Restored" | "Closed" | "Reopened";

export interface User { id: string; name: string; role: Role; employeeCode: string; team?: string }
export interface Asset {
  id: string; code: string; name: string; line: string; area: string; criticality: "A" | "B" | "C";
  status: "running" | "stopped" | "maintenance"; manufacturer: string; model: string; installed: string;
}
export interface WoEvent { at: string; status: WoStatus; actor: string; note?: string }
export interface WorkOrder {
  id: string; no: string; type: WoType; assetId: string; title: string; symptom: string;
  priority: Priority; status: WoStatus; reporter: string; lead?: string; reportedAt: string;
  stoppedAt?: string; acknowledgedAt?: string; arrivedAt?: string; restoredAt?: string;
  machineCondition: "stopped" | "abnormal" | "degraded"; safetyRisk: boolean;
  failureCategory?: string; rootCause?: string; repairAction?: string;
  events: WoEvent[]; parts: { code: string; name: string; qty: number; unit: string }[];
  laborHours: { user: string; hours: number }[]; breachReason?: string;
}
export interface SlaConfig { priority: Priority; label: string; response: number; arrival: number; restoration: number; warn: number; escalate: number }
