import clsx from "clsx";
import type { Priority, WoStatus } from "@/lib/types";
import { STATUS_LABEL } from "@/lib/workflow";
import type { SlaState } from "@/lib/sla";

export const Card = ({ title, children, className, action }: { title?: string; children: React.ReactNode; className?: string; action?: React.ReactNode }) => (
  <section className={clsx("rounded-xl border border-slate-200 bg-white p-4 shadow-sm", className)}>
    {(title || action) && <div className="mb-3 flex items-center justify-between"><h3 className="font-semibold text-slate-800">{title}</h3>{action}</div>}
    {children}
  </section>
);
export const PageHeader = ({ title, sub, action }: { title: string; sub?: string; action?: React.ReactNode }) => (
  <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
    <div><h1 className="text-2xl font-bold text-slate-900">{title}</h1>{sub && <p className="text-sm text-slate-500">{sub}</p>}</div>{action}
  </div>
);
export const Btn = ({ variant = "primary", className, ...p }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" | "danger" }) => (
  <button {...p} className={clsx("min-h-11 rounded-lg px-4 text-sm font-medium transition disabled:opacity-40",
    variant === "primary" && "bg-blue-700 text-white hover:bg-blue-800",
    variant === "ghost" && "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50",
    variant === "danger" && "bg-red-600 text-white hover:bg-red-700", className)} />
);
const PRIO: Record<Priority, string> = { P1: "bg-red-600 text-white", P2: "bg-orange-500 text-white", P3: "bg-blue-600 text-white", P4: "bg-slate-500 text-white" };
export const PriorityBadge = ({ p }: { p: Priority }) => <span className={clsx("rounded px-2 py-0.5 text-xs font-bold", PRIO[p])}>{p}</span>;
export const StatusBadge = ({ s }: { s: WoStatus }) => {
  const tone = s === "Closed" ? "bg-slate-100 text-slate-700" : s === "Restored" ? "bg-green-100 text-green-800"
    : s.startsWith("Waiting") ? "bg-amber-100 text-amber-800" : s === "Rejected" || s === "Reopened" ? "bg-red-100 text-red-800" : "bg-blue-100 text-blue-800";
  return <span className={clsx("rounded-full px-2.5 py-0.5 text-xs font-medium", tone)}>{STATUS_LABEL[s]}</span>;
};
export const SLA_TEXT: Record<SlaState, string> = { ok: "ปกติ", warning: "ใกล้ครบ (50%)", escalated: "เสี่ยงเกิน (80%)", breached: "เกิน SLA", met: "ทัน SLA" };
export const Stat = ({ label, value, sub, tone }: { label: string; value: React.ReactNode; sub?: string; tone?: "red" | "green" | "amber" }) => (
  <Card><p className="text-xs text-slate-500">{label}</p>
    <p className={clsx("mt-1 text-3xl font-bold", tone === "red" && "text-red-600", tone === "green" && "text-green-700", tone === "amber" && "text-amber-600", !tone && "text-slate-900")}>{value}</p>
    {sub && <p className="mt-1 text-xs text-slate-500">{sub}</p>}</Card>
);
export function Table({ head, rows }: { head: string[]; rows: React.ReactNode[][] }) {
  return (
    <div className="overflow-x-auto"><table className="w-full text-sm">
      <thead><tr className="border-b text-left text-xs uppercase text-slate-500">{head.map((h) => <th key={h} className="px-3 py-2 font-medium">{h}</th>)}</tr></thead>
      <tbody>{rows.map((r, i) => <tr key={i} className="border-b last:border-0 hover:bg-slate-50">{r.map((c, j) => <td key={j} className="px-3 py-2.5 align-top">{c}</td>)}</tr>)}</tbody>
    </table></div>
  );
}
