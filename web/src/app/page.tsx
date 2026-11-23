"use client";
import Link from "next/link";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useApp } from "@/components/AppProvider";
import { Card, PageHeader, PriorityBadge, SLA_TEXT, Stat, StatusBadge, Table } from "@/components/ui";
import { ASSETS, DAILY, KPI, PARETO, PARTS, assetById } from "@/mock/data";
import { computeSla } from "@/lib/sla";
import { demoNow } from "@/lib/api";

export default function Dashboard() {
  const { user, wos } = useApp();
  const open = wos.filter((w) => !["Closed", "Rejected", "Restored"].includes(w.status));
  const down = ASSETS.filter((a) => a.status === "stopped");
  const bm = open.filter((w) => w.type === "BM");
  const risky = bm.filter((w) => computeSla(w, demoNow()).some((m) => ["escalated", "breached"].includes(m.state) && !m.done));
  const mine = user?.role === "technician" ? open.filter((w) => w.lead === user.id) : open;
  const showMgmt = user && ["manager", "supervisor", "admin"].includes(user.role);
  return (
    <>
      <PageHeader title="แดชบอร์ด" sub={`มุมมอง: ${user?.name}`} />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="เครื่องที่หยุดอยู่ตอนนี้" value={down.length} tone={down.length ? "red" : "green"} sub={down.map((d) => d.name).join(", ") || "—"} />
        <Stat label="ใบสั่งงานที่เปิดอยู่" value={open.length} sub={`BM ${bm.length} · PM ${open.filter((w) => w.type === "PM").length}`} />
        <Stat label="เสี่ยง/เกิน SLA" value={risky.length} tone={risky.length ? "amber" : "green"} sub="ถึง 80% ของเป้าหมาย" />
        <Stat label="อะไหล่ต่ำกว่าขั้นต่ำ" value={PARTS.filter((p) => p.stock < p.min).length} tone="amber" sub="ดูหน้าอะไหล่/คลัง" />
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card title={user?.role === "technician" ? "งานของฉัน" : "งานที่ต้องจับตา"}>
          <Table head={["เลขที่", "เครื่อง", "P", "สถานะ", "SLA"]} rows={mine.slice(0, 7).map((w) => {
            const worst = computeSla(w, demoNow()).find((m) => !m.done && m.state !== "ok");
            return [<Link key="n" className="whitespace-nowrap text-blue-700" href={`/work-orders/${w.id}`}>{w.no}</Link>, assetById(w.assetId)?.name, <PriorityBadge key="p" p={w.priority} />, <StatusBadge key="s" s={w.status} />, worst ? `${worst.label}: ${SLA_TEXT[worst.state]}` : "—"];
          })} />
        </Card>
        <Card title="จำนวน Breakdown ต่อวัน (30 วัน)">
          <div className="h-56"><ResponsiveContainer><BarChart data={DAILY}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="date" fontSize={10} /><YAxis fontSize={11} /><Tooltip /><Bar dataKey="breakdowns" name="ครั้ง" fill="#1d4ed8" /></BarChart></ResponsiveContainer></div>
        </Card>
      </div>
      {showMgmt && (
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          <Card title="KPI (30 วัน)"><dl className="grid grid-cols-2 gap-2 text-sm">
            <dt>MTTR (เวลาซ่อมจริง)</dt><dd className="font-semibold">{KPI.mttrMin} นาที</dd><dt>MTBF</dt><dd className="font-semibold">{KPI.mtbfHours} ชม.</dd>
            <dt>Response SLA</dt><dd className="font-semibold">{KPI.response}%</dd><dt>Arrival SLA</dt><dd className="font-semibold">{KPI.arrival}%</dd>
            <dt>Restoration SLA</dt><dd className="font-semibold">{KPI.restoration}%</dd><dt>เกิน SLA</dt><dd className="font-semibold">{KPI.breaches} งาน</dd></dl></Card>
          <Card title="Downtime (นาที/วัน)" className="lg:col-span-2"><div className="h-52"><ResponsiveContainer><LineChart data={DAILY}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="date" fontSize={10} /><YAxis fontSize={11} /><Tooltip /><Line dataKey="downtime" name="นาที" stroke="#dc2626" dot={false} /></LineChart></ResponsiveContainer></div></Card>
          <Card title="Pareto ประเภทความเสีย" className="lg:col-span-3"><div className="h-52"><ResponsiveContainer><BarChart data={PARETO}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" fontSize={11} /><YAxis fontSize={11} /><Tooltip /><Bar dataKey="count" name="ครั้ง" fill="#0f766e" /></BarChart></ResponsiveContainer></div></Card>
        </div>
      )}
    </>
  );
}
