import { Card, PageHeader, Table } from "@/components/ui";
import { PM_PLANS, assetById } from "@/mock/data";
export default function PM() { return (<><PageHeader title="Preventive Maintenance" sub="แผน PM ตามเวลาหรือมิเตอร์ → สร้างใบสั่งงานอัตโนมัติ (Release 2)" /><Card><Table head={["แผน", "เครื่อง", "ความถี่", "ครบกำหนดถัดไป", "Checklist"]} rows={PM_PLANS.map((p) => [p.name, assetById(p.asset)?.name, p.freq, p.next, p.checklist])} /></Card></>); }
