"use client";
import Link from "next/link";
import { useState } from "react";
import { useApp } from "@/components/AppProvider";
import { Btn, Card, PageHeader, PriorityBadge, Table } from "@/components/ui";
import { assetById, userName } from "@/mock/data";
import { api } from "@/lib/api";
import type { Priority } from "@/lib/types";

export default function Requests() {
  const { user, wos, refresh } = useApp(); const [busy, setBusy] = useState("");
  const rows = wos.filter((w) => w.type === "BM" && ["Submitted", "UnderTriage"].includes(w.status));
  const canTriage = user?.role === "supervisor" || user?.role === "admin";
  const act = async (id: string, fn: () => Promise<unknown>) => { setBusy(id); await fn(); await refresh(); setBusy(""); };
  return (
    <>
      <PageHeader title="คำขอ / คัดกรอง (Triage)" sub="หัวหน้าบำรุงตรวจความปลอดภัย ผลกระทบ และกำหนด Priority" />
      <Card>{rows.length === 0 ? <p className="p-4 text-sm text-slate-500">ไม่มีคำขอที่รอคัดกรอง</p> :
        <Table head={["เลขที่", "เครื่อง", "อาการ", "ผู้แจ้ง", "Priority", "ดำเนินการ"]} rows={rows.map((w) => [
          <Link key="n" href={`/work-orders/${w.id}`} className="font-mono text-blue-700">{w.no}</Link>, assetById(w.assetId)?.name, <>{w.safetyRisk && "⚠️ "}{w.title}</>, userName(w.reporter),
          canTriage ? <select key="p" value={w.priority} onChange={(e) => act(w.id, () => api.setPriority(w.id, e.target.value as Priority, user!.id))} className="min-h-10 rounded border px-2">{["P1", "P2", "P3", "P4"].map((p) => <option key={p}>{p}</option>)}</select> : <PriorityBadge key="p" p={w.priority} />,
          canTriage ? <div key="a" className="flex gap-2">{w.status === "Submitted" && <Btn disabled={busy === w.id} onClick={() => act(w.id, () => api.transition(w.id, "UnderTriage", user!.id))}>เริ่มคัดกรอง</Btn>}
            {w.status === "UnderTriage" && <><Btn disabled={busy === w.id} onClick={() => act(w.id, () => api.transition(w.id, "Assigned", user!.id, "มอบหมาย วิภา ศรีสุข"))}>มอบหมายช่าง</Btn><Btn variant="ghost" onClick={() => act(w.id, () => api.transition(w.id, "Rejected", user!.id, "ไม่ใช่งานซ่อม"))}>ปฏิเสธ</Btn></>}</div> : "สลับเป็นหัวหน้าบำรุงเพื่อคัดกรอง"])} />}
      </Card>
    </>
  );
}
