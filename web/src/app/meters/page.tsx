import { Card, PageHeader, Table } from "@/components/ui";
import { METERS, assetById } from "@/mock/data";
export default function Meters() { return (<><PageHeader title="มิเตอร์ + Automation triggers" sub="เมื่อค่าถึงเกณฑ์ ระบบสร้างใบสั่งงานให้อัตโนมัติ" /><Card><Table head={["เครื่อง", "มิเตอร์", "ค่าปัจจุบัน", "Trigger", "เกณฑ์ถัดไป", "ความคืบหน้า"]} rows={METERS.map((m) => [assetById(m.asset)?.name, m.name, `${m.value.toLocaleString()} ${m.unit}`, m.trigger, m.next.toLocaleString(), `${Math.round((m.value / m.next) * 100)}%`])} /></Card></>); }
