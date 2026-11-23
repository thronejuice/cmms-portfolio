"use client";
import Link from "next/link";
import { Card, PageHeader, Table } from "@/components/ui";
import { ASSETS } from "@/mock/data";
const ST = { running: "🟢 เดินเครื่อง", stopped: "🔴 หยุด", maintenance: "🟡 ซ่อมบำรุง" };
export default function Assets() {
  return (<><PageHeader title="เครื่องจักร (Assets)" sub="รหัสรูปแบบ plant-area-line-running · QR ชี้ไปหน้าเครื่องนี้" />
    <Card><Table head={["รหัส", "ชื่อ", "ไลน์", "ความสำคัญ", "สถานะ"]} rows={ASSETS.map((a) => [<Link key="c" className="font-mono text-blue-700" href={`/assets/${a.id}`}>{a.code}</Link>, a.name, a.line, a.criticality, ST[a.status]])} /></Card></>);
}
