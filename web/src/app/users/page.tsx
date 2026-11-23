import { Card, PageHeader, Table } from "@/components/ui";
import { USERS } from "@/mock/data";
import { ROLE_LABEL } from "@/lib/workflow";
export default function Users() { return (<><PageHeader title="ผู้ใช้ / บทบาท" sub="RBAC ตามขอบเขต plant · area · line (ชื่อทั้งหมดสมมติ)" /><Card><Table head={["รหัส", "ชื่อ", "บทบาท", "ทีม"]} rows={USERS.map((u) => [u.employeeCode, u.name, ROLE_LABEL[u.role], u.team ?? "—"])} /></Card></>); }
