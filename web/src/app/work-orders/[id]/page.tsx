"use client";
import { use, useState } from "react";
import Link from "next/link";
import { useApp } from "@/components/AppProvider";
import { Btn, Card, PageHeader, PriorityBadge, SLA_TEXT, StatusBadge } from "@/components/ui";
import { assetById, userName, SLA_BREACH_REASONS } from "@/mock/data";
import { computeSla, fmtMin, ESCALATION_BREACH_TO } from "@/lib/sla";
import { MAIN_FLOW, STATUS_LABEL, nextActions } from "@/lib/workflow";
import { api, demoNow } from "@/lib/api";
import clsx from "clsx";

export default function WoDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params); const { user, wos, refresh } = useApp(); const [reason, setReason] = useState("");
  const wo = wos.find((w) => w.id === id);
  if (!wo) return <p>ไม่พบใบสั่งงาน <Link className="text-blue-700" href="/work-orders">กลับ</Link></p>;
  const asset = assetById(wo.assetId); const slas = computeSla(wo, demoNow());
  const breached = slas.some((m) => m.state === "breached");
  const actions = user ? nextActions(wo.status, user.role) : [];
  const idx = MAIN_FLOW.indexOf(wo.status);
  const go = async (to: Parameters<typeof api.transition>[1]) => { await api.transition(wo.id, to, user!.id, to === "Closed" && breached ? `สาเหตุเกิน SLA: ${reason}` : undefined); await refresh(); };
  return (
    <>
      <PageHeader title={`${wo.no} · ${wo.title}`} sub={`${wo.type} · ${asset?.name} (${asset?.code})`} action={<div className="flex gap-2"><PriorityBadge p={wo.priority} /><StatusBadge s={wo.status} /></div>} />
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card title="สถานะ (Workflow)"><ol className="flex flex-wrap gap-1.5">{MAIN_FLOW.map((s, i) => (
            <li key={s} className={clsx("rounded-full px-3 py-1 text-xs", i < idx ? "bg-blue-700 text-white" : i === idx ? "bg-orange-500 font-bold text-white" : "bg-slate-100 text-slate-500")}>{i < idx ? "✓ " : ""}{STATUS_LABEL[s]}</li>))}</ol>
            {wo.status.startsWith("Waiting") && <p className="mt-2 rounded bg-amber-50 p-2 text-xs text-amber-900">⏱ {STATUS_LABEL[wo.status]} — Restoration SLA ยังคงนับ (เครื่องยังหยุดอยู่)</p>}</Card>
          <Card title="การดำเนินการ">
            {actions.length ? <div className="flex flex-wrap gap-2">{actions.map((a) => <Btn key={a.to} variant={a.to === "Rejected" || a.to === "Reopened" ? "ghost" : "primary"} disabled={a.to === "Closed" && breached && !reason} onClick={() => go(a.to)}>{a.label}</Btn>)}</div>
              : <p className="text-sm text-slate-500">บทบาทนี้ไม่มีการดำเนินการในสถานะนี้ (ลองสลับบทบาทด้านบน)</p>}
            {wo.status === "Restored" && breached && (
              <div className="mt-3 rounded bg-red-50 p-3"><p className="mb-1 text-sm font-medium text-red-800">งานเกิน SLA — ต้องระบุสาเหตุก่อนปิดงาน</p>
                <select value={reason} onChange={(e) => setReason(e.target.value)} className="min-h-11 w-full rounded border px-2"><option value="">— เลือกสาเหตุ —</option>{SLA_BREACH_REASONS.map((r) => <option key={r}>{r}</option>)}</select></div>)}
          </Card>
          <Card title="Timeline">
            <ul className="space-y-2 text-sm">{wo.events.map((e, i) => <li key={i} className="flex gap-3 border-l-2 border-blue-200 pl-3"><span className="w-36 shrink-0 text-xs text-slate-500">{new Date(e.at).toLocaleString("th-TH", { dateStyle: "short", timeStyle: "short", timeZone: "Asia/Bangkok" })}</span><span><b>{STATUS_LABEL[e.status]}</b> · {userName(e.actor)}{e.note && <span className="text-slate-500"> — {e.note}</span>}</span></li>)}</ul>
          </Card>
          <Card title="การวินิจฉัยและซ่อม">
            <dl className="grid grid-cols-2 gap-2 text-sm"><dt className="text-slate-500">ประเภทความเสีย</dt><dd>{wo.failureCategory ?? "รอระบุ (Pending Investigation)"}</dd><dt className="text-slate-500">สาเหตุราก</dt><dd>{wo.rootCause ?? "รอระบุ"}</dd><dt className="text-slate-500">การซ่อม</dt><dd>{wo.repairAction ?? "รอระบุ"}</dd>
              <dt className="text-slate-500">ช่างหลัก</dt><dd>{userName(wo.lead)}</dd><dt className="text-slate-500">ชั่วโมงแรงงาน</dt><dd>{wo.laborHours.map((l) => `${userName(l.user)} ${l.hours} ชม.`).join(", ") || "—"}</dd>
              <dt className="text-slate-500">อะไหล่ที่ใช้</dt><dd>{wo.parts.map((p) => `${p.name} x${p.qty}`).join(", ") || "—"}</dd></dl>
            <p className="mt-2 text-xs text-slate-400">ต้องระบุการจำแนกสุดท้ายก่อนปิดงาน (หรือมีข้อยกเว้นที่อนุมัติ) — บังคับใช้ที่ backend</p>
          </Card>
        </div>
        <div className="space-y-4">
          <Card title="SLA">{slas.length ? <ul className="space-y-3">{slas.map((m) => { const pct = Math.min(100, (m.elapsed / m.target) * 100); return (
            <li key={m.label}><div className="flex justify-between text-sm"><b>{m.label}</b><span>{fmtMin(m.elapsed)} / {fmtMin(m.target)}</span></div>
              <div className="my-1 h-2 rounded bg-slate-100"><div className={clsx("h-2 rounded", m.state === "breached" ? "bg-red-600" : m.state === "escalated" ? "bg-orange-500" : m.state === "warning" ? "bg-amber-400" : "bg-green-600")} style={{ width: `${pct}%` }} /></div>
              <span className="text-xs text-slate-500">{SLA_TEXT[m.state]}{!m.done && " (กำลังนับ)"}</span></li>); })}
            </ul> : <p className="text-sm text-slate-500">SLA ใช้กับงาน BM เท่านั้น</p>}
            {slas.length > 0 && <p className="mt-3 text-xs text-slate-400">เกิน SLA แจ้ง: {ESCALATION_BREACH_TO[wo.priority]} · นับต่อเนื่อง 24 ชม.</p>}</Card>
          <Card title="ข้อมูลเครื่อง"><p className="text-sm">{asset?.line}</p><p className="text-sm text-slate-500">{asset?.manufacturer} {asset?.model}</p><Link href={`/assets/${asset?.id}`} className="mt-2 inline-block text-sm text-blue-700">ดูประวัติเครื่อง →</Link></Card>
          <Card title="เวลาสำคัญ"><dl className="space-y-1 text-xs">{([["เครื่องหยุด", wo.stoppedAt], ["แจ้งซ่อม", wo.reportedAt], ["ช่างรับทราบ", wo.acknowledgedAt], ["ช่างถึงหน้างาน", wo.arrivedAt], ["ฝ่ายผลิตยืนยัน (Restored)", wo.restoredAt]] as const).map(([k, v]) => <div key={k} className="flex justify-between"><dt className="text-slate-500">{k}</dt><dd>{v ? new Date(v).toLocaleString("th-TH", { dateStyle: "short", timeStyle: "short", timeZone: "Asia/Bangkok" }) : "—"}</dd></div>)}</dl></Card>
        </div>
      </div>
    </>
  );
}
