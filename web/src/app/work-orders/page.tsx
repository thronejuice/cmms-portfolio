"use client";
import Link from "next/link";
import { useState } from "react";
import { useApp } from "@/components/AppProvider";
import { Card, PageHeader, PriorityBadge, StatusBadge, Table } from "@/components/ui";
import { assetById, userName } from "@/mock/data";
import { fmtMin } from "@/lib/sla";
import { demoNow } from "@/lib/api";

export default function WorkOrders() {
  const { wos } = useApp(); const [type, setType] = useState("all"); const [q, setQ] = useState("");
  const rows = wos.filter((w) => (type === "all" || w.type === type) && (w.no + w.title + (assetById(w.assetId)?.name ?? "")).toLowerCase().includes(q.toLowerCase()));
  return (
    <>
      <PageHeader title="ใบสั่งงาน (Work Orders)" sub="BM / PM / Corrective / Inspection" />
      <Card>
        <div className="mb-3 flex flex-wrap gap-2">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ค้นหา เลขที่ / เครื่อง / อาการ" className="min-h-11 flex-1 rounded-lg border border-slate-300 px-3" />
          <select value={type} onChange={(e) => setType(e.target.value)} className="min-h-11 rounded-lg border border-slate-300 px-3"><option value="all">ทุกประเภท</option><option>BM</option><option>PM</option><option>Corrective</option><option>Inspection</option></select>
        </div>
        <Table head={["เลขที่", "ประเภท", "เครื่อง", "อาการ/งาน", "P", "สถานะ", "ผู้รับผิดชอบ", "เครื่องหยุด"]} rows={rows.map((w) => {
          const dt = w.stoppedAt ? Math.round(((w.restoredAt ? new Date(w.restoredAt).getTime() : new Date(demoNow()).getTime()) - new Date(w.stoppedAt).getTime()) / 60000) : null;
          return [<Link key="n" className="font-mono text-blue-700" href={`/work-orders/${w.id}`}>{w.no}</Link>, w.type, assetById(w.assetId)?.name, w.title, <PriorityBadge key="p" p={w.priority} />, <StatusBadge key="s" s={w.status} />, userName(w.lead), dt === null ? "—" : fmtMin(dt)];
        })} />
      </Card>
    </>
  );
}
