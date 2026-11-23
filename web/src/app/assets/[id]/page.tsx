"use client";
import { use } from "react";
import Link from "next/link";
import { useApp } from "@/components/AppProvider";
import { Card, PageHeader, PriorityBadge, StatusBadge, Table } from "@/components/ui";
import { ASSETS, FILES, METERS } from "@/mock/data";

export default function AssetDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params); const { wos } = useApp(); const a = ASSETS.find((x) => x.id === id);
  if (!a) return <p>ไม่พบเครื่อง</p>;
  const hist = wos.filter((w) => w.assetId === a.id);
  return (<><PageHeader title={a.name} sub={a.code} />
    <div className="grid gap-4 lg:grid-cols-3">
      <Card title="โปรไฟล์"><dl className="space-y-1 text-sm"><div>ไลน์: {a.line}</div><div>ผู้ผลิต: {a.manufacturer} {a.model}</div><div>ติดตั้ง: {a.installed}</div><div>ความสำคัญ: {a.criticality}</div><div>สถานะ: {a.status}</div></dl>
        <div className="mt-3 grid size-28 place-items-center rounded border-2 border-dashed text-xs text-slate-400">QR: {a.code}</div></Card>
      <Card title="ประวัติงาน" className="lg:col-span-2"><Table head={["เลขที่", "ประเภท", "อาการ", "P", "สถานะ"]} rows={hist.map((w) => [<Link key="n" className="text-blue-700" href={`/work-orders/${w.id}`}>{w.no}</Link>, w.type, w.title, <PriorityBadge key="p" p={w.priority} />, <StatusBadge key="s" s={w.status} />])} />{hist.length === 0 && <p className="p-3 text-sm text-slate-500">ยังไม่มีประวัติ</p>}</Card>
      <Card title="มิเตอร์"><ul className="text-sm">{METERS.filter((m) => m.asset === a.id).map((m) => <li key={m.id}>{m.name}: {m.value.toLocaleString()} {m.unit}</li>)}</ul></Card>
      <Card title="เอกสาร"><ul className="text-sm">{FILES.filter((f) => f.asset === a.id).map((f) => <li key={f.name}>📄 {f.name}</li>)}</ul></Card>
    </div></>);
}
