import { Card, PageHeader, Table } from "@/components/ui";
import { VENDORS } from "@/mock/data";
export default function Vendors() { return (<><PageHeader title="ผู้ขาย / ผู้รับเหมา" /><Card><Table head={["ชื่อ", "ประเภท", "อีเมล", "โทร"]} rows={VENDORS.map((v) => [v.name, v.type, v.contact, v.phone])} /></Card></>); }
