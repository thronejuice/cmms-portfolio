"use client";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, PageHeader, Stat } from "@/components/ui";
const D = [{ n: "ค่าแรง", v: 142000 }, { n: "อะไหล่", v: 318000 }, { n: "ผู้รับเหมา", v: 96000 }, { n: "อื่น ๆ", v: 21000 }];
export default function Costs() { return (<><PageHeader title="ต้นทุนงานซ่อม" sub="ตัวเลขสมมติ (Release 3)" /><div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4"><Stat label="รวมเดือนนี้" value="฿577,000" /><Stat label="ต่อ Breakdown เฉลี่ย" value="฿9,800" /></div>
  <Card title="ต้นทุนแยกประเภท"><div className="h-64"><ResponsiveContainer><BarChart data={D}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="n" /><YAxis /><Tooltip /><Bar dataKey="v" name="บาท" fill="#1d4ed8" /></BarChart></ResponsiveContainer></div></Card></>); }
