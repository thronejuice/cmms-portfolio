import { Card, PageHeader, Table } from "@/components/ui";
import { PARTS } from "@/mock/data";
export default function Parts() { return (<><PageHeader title="อะไหล่ / คลัง" sub="แจ้งเตือนสต็อกต่ำกว่าขั้นต่ำ · ตัดสต็อกจากใบสั่งงาน (Release 3)" /><Card><Table head={["รหัส", "ชื่อ", "คงเหลือ", "ขั้นต่ำ", "ที่เก็บ", "ราคา/หน่วย", "สถานะ"]} rows={PARTS.map((p) => [p.code, p.name, `${p.stock} ${p.unit}`, p.min, p.loc, `฿${p.cost.toLocaleString()}`, p.stock < p.min ? <span key="s" className="font-medium text-red-600">⚠ สต็อกต่ำ</span> : "ปกติ"])} /></Card></>); }
