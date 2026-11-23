import { Card, PageHeader, Table } from "@/components/ui";
import { FILES, assetById } from "@/mock/data";
export default function Files() { return (<><PageHeader title="เอกสาร / ไฟล์" sub="คู่มือ แผนผัง ใบรับรอง (เก็บใน MinIO; สิทธิ์ดาวน์โหลดตามขอบเขต)" /><Card><Table head={["ไฟล์", "เครื่อง", "ประเภท", "ขนาด"]} rows={FILES.map((f) => [f.name, assetById(f.asset)?.name, f.type, f.size])} /></Card></>); }
