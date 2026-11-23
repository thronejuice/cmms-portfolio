"use client";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, PageHeader, Stat } from "@/components/ui";
import { DOWNTIME_BY_LINE, KPI } from "@/mock/data";
export default function Analytics() { return (<><PageHeader title="รายงาน / KPI" sub="นิยาม: MTTR = เวลาซ่อมจริง (ช่างลงมือ) · Downtime = เครื่องหยุด → ฝ่ายผลิตยืนยัน · SLA นับ 24 ชม." />
  <div className="grid grid-cols-2 gap-3 lg:grid-cols-3"><Stat label="Response SLA Compliance" value={`${KPI.response}%`} tone="green" /><Stat label="Arrival SLA Compliance" value={`${KPI.arrival}%`} tone="amber" /><Stat label="Restoration SLA Compliance" value={`${KPI.restoration}%`} tone="amber" /><Stat label="SLA Breach" value={KPI.breaches} tone="red" /><Stat label="Average Response" value={`${KPI.avgResponse} นาที`} /><Stat label="Average Restoration" value={`${KPI.avgRestoration} นาที`} /></div>
  <Card title="Downtime ต่อไลน์ (ชม.)" className="mt-4"><div className="h-64"><ResponsiveContainer><BarChart data={DOWNTIME_BY_LINE}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="line" /><YAxis /><Tooltip /><Bar dataKey="hours" fill="#dc2626" name="ชม." /></BarChart></ResponsiveContainer></div></Card></>); }
