"use client";
import { useRouter } from "next/navigation";
import { useApp } from "@/components/AppProvider";
import { USERS } from "@/mock/data";
import { ROLE_LABEL } from "@/lib/workflow";

export default function Login() {
  const { login } = useApp(); const router = useRouter();
  return (
    <div className="flex min-h-screen items-center justify-center bg-blue-900 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h1 className="text-2xl font-bold text-blue-900">CMMS</h1>
        <p className="mb-1 text-sm text-slate-600">Maintenance Management · Portfolio Demo</p>
        <p className="mb-4 rounded bg-amber-50 p-2 text-xs text-amber-900">หน้าจอจำลอง ไม่ต้องใส่รหัสผ่าน — เลือกผู้ใช้ตัวอย่างเพื่อดูมุมมองของแต่ละบทบาท (ข้อมูลทั้งหมดเป็นข้อมูลสมมติ)</p>
        <div className="space-y-2">{USERS.map((u) => (
          <button key={u.id} onClick={() => { login(u.id); router.push("/"); }} className="flex min-h-14 w-full items-center justify-between rounded-lg border border-slate-200 px-4 text-left hover:border-blue-600 hover:bg-blue-50">
            <span><span className="block font-medium">{u.name}</span><span className="text-xs text-slate-500">{ROLE_LABEL[u.role]}</span></span>
            <span className="text-xs text-slate-400">{u.employeeCode}</span></button>))}
        </div>
      </div>
    </div>
  );
}
