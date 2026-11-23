"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Activity, Boxes, CalendarClock, ClipboardList, Cog, FileText, Gauge, Inbox, ListChecks, MapPin, Menu, PlusCircle, ShoppingCart, Truck, Users, Wallet, Wrench, BarChart3, X } from "lucide-react";
import { useApp } from "./AppProvider";
import { ROLE_LABEL } from "@/lib/workflow";
import type { Role } from "@/lib/types";
import { COMPANY } from "@/mock/data";
import clsx from "clsx";

const NAV = [
  { h: "/", t: "แดชบอร์ด", i: Gauge }, { h: "/report", t: "แจ้งซ่อม (BM)", i: PlusCircle }, { h: "/requests", t: "คำขอ/คัดกรอง", i: Inbox },
  { h: "/work-orders", t: "ใบสั่งงาน", i: Wrench }, { h: "/assets", t: "เครื่องจักร", i: Cog }, { h: "/pm", t: "PM", i: CalendarClock },
  { h: "/checklists", t: "Checklists", i: ListChecks }, { h: "/meters", t: "มิเตอร์", i: Activity }, { h: "/parts", t: "อะไหล่/คลัง", i: Boxes },
  { h: "/purchase-orders", t: "ใบสั่งซื้อ", i: ShoppingCart }, { h: "/vendors", t: "ผู้ขาย/ผู้รับเหมา", i: Truck }, { h: "/costs", t: "ต้นทุน", i: Wallet },
  { h: "/files", t: "เอกสาร", i: FileText }, { h: "/locations", t: "สถานที่", i: MapPin }, { h: "/analytics", t: "รายงาน/KPI", i: BarChart3 },
  { h: "/users", t: "ผู้ใช้/บทบาท", i: Users }, { h: "/settings/sla", t: "ตั้งค่า SLA", i: ClipboardList },
];
const ROLES = Object.keys(ROLE_LABEL) as Role[];

export default function Shell({ children }: { children: React.ReactNode }) {
  const { user, setRole, logout, ready } = useApp();
  const path = usePathname(); const router = useRouter(); const [open, setOpen] = useState(false);
  const isLogin = path === "/login";
  useEffect(() => { if (ready && !user && !isLogin) router.replace("/login"); }, [ready, user, isLogin, router]);
  if (isLogin) return <>{children}</>;
  if (!user) return <div className="p-8 text-slate-500">กำลังโหลด…</div>;
  return (
    <div className="min-h-screen bg-slate-50 lg:flex">
      <header className="sticky top-0 z-20 flex items-center justify-between bg-blue-900 px-4 py-3 text-white lg:hidden">
        <button aria-label="เมนู" onClick={() => setOpen(!open)} className="min-h-11 min-w-11">{open ? <X /> : <Menu />}</button>
        <span className="font-semibold">CMMS</span>
        <Link href="/report" className="rounded bg-orange-500 px-3 py-2 text-sm font-semibold">แจ้งซ่อม</Link>
      </header>
      <aside className={clsx("fixed inset-y-0 left-0 z-30 w-64 overflow-y-auto bg-blue-900 p-3 text-blue-50 transition lg:static lg:translate-x-0", open ? "translate-x-0" : "-translate-x-full")}>
        <div className="mb-4 px-2 pt-2"><p className="text-xl font-bold">CMMS</p><p className="text-xs text-blue-200">{COMPANY}</p></div>
        <nav className="space-y-0.5">{NAV.map(({ h, t, i: I }) => (
          <Link key={h} href={h} onClick={() => setOpen(false)} className={clsx("flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm", (h === "/" ? path === "/" : path.startsWith(h)) ? "bg-blue-700 font-semibold" : "hover:bg-blue-800")}><I size={18} />{t}</Link>))}
        </nav>
      </aside>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-white px-4 py-2 text-sm">
          <span className="rounded bg-amber-100 px-2 py-1 text-xs font-medium text-amber-900">DEMO · ข้อมูลสมมติทั้งหมด</span>
          <div className="flex min-w-0 items-center gap-2">
            <label className="hidden text-slate-500 sm:inline" htmlFor="role">สลับบทบาท:</label>
            <select id="role" value={user.role} onChange={(e) => setRole(e.target.value as Role)} className="min-h-11 min-w-0 max-w-[13rem] rounded border border-slate-300 bg-white px-2 sm:max-w-none">
              {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}</select>
            <span className="hidden text-slate-600 sm:inline">{user.name}</span>
            <button onClick={() => { logout(); router.push("/login"); }} className="min-h-11 px-2 text-blue-700">ออก</button>
          </div>
        </div>
        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
