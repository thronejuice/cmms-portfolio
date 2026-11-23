import { Card, PageHeader, Table } from "@/components/ui";
import { POS } from "@/mock/data";
export default function PO() { return (<><PageHeader title="ใบสั่งซื้อ (Purchase Orders)" sub="ขั้นตอนอนุมัติ: ผู้ขอ → หัวหน้า → ผู้จัดการ" /><Card><Table head={["เลขที่", "ผู้ขาย", "รายการ", "ยอดรวม", "ผู้ขอ", "สถานะ"]} rows={POS.map((p) => [p.no, p.vendor, p.item, `฿${p.total.toLocaleString()}`, p.requester, p.status])} /></Card></>); }
