"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useApp } from "@/components/AppProvider";
import { Btn, Card, PageHeader } from "@/components/ui";
import { ASSETS, SYMPTOM_TEMPLATES } from "@/mock/data";
import { api } from "@/lib/api";
import type { WorkOrder } from "@/lib/types";

const DRAFT = "cmms-bm-draft";
export default function Report() {
  const { user, refresh } = useApp(); const router = useRouter();
  const [assetId, setAsset] = useState(""); const [symptom, setSymptom] = useState("");
  const [cond, setCond] = useState<WorkOrder["machineCondition"]>("stopped"); const [safety, setSafety] = useState(false);
  const [draftSaved, setDraft] = useState(false); const [done, setDone] = useState<string | null>(null);
  useEffect(() => { try { const d = JSON.parse(localStorage.getItem(DRAFT) ?? "null"); if (d) { setAsset(d.assetId); setSymptom(d.symptom); setCond(d.cond); setSafety(d.safety); setDraft(true); } } catch {} }, []);
  const asset = ASSETS.find((a) => a.id === assetId);
  const saveDraft = () => { try { localStorage.setItem(DRAFT, JSON.stringify({ assetId, symptom, cond, safety })); setDraft(true); } catch {} };
  const submit = async () => {
    const wo = await api.createBreakdown({ assetId, symptom, machineCondition: cond, safetyRisk: safety, stoppedAt: cond === "stopped" ? new Date().toISOString() : undefined, reporter: user!.id });
    try { localStorage.removeItem(DRAFT); } catch {} await refresh(); setDone(wo.no);
  };
  if (done) return <Card className="mx-auto max-w-lg text-center"><p className="text-4xl">✅</p><h2 className="mt-2 text-xl font-bold">ส่งแจ้งซ่อมแล้ว</h2><p className="my-2 text-2xl font-mono text-blue-800">{done}</p><p className="mb-4 text-sm text-slate-600">หัวหน้าบำรุงจะคัดกรองและมอบหมายช่าง</p><Btn onClick={() => router.push("/work-orders")}>ดูใบสั่งงาน</Btn></Card>;
  return (
    <>
      <PageHeader title="แจ้งซ่อม (Breakdown)" sub="ใช้งานบนมือถือได้ · สแกน QR หรือเลือกเครื่องเอง" />
      <Card className="mx-auto max-w-xl space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium">เครื่องจักร *</label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <select value={assetId} onChange={(e) => setAsset(e.target.value)} className="min-h-12 min-w-0 flex-1 rounded-lg border border-slate-300 px-3">
              <option value="">— เลือกเครื่อง —</option>{ASSETS.map((a) => <option key={a.id} value={a.id}>{a.code} · {a.name}</option>)}</select>
            <Btn variant="ghost" onClick={() => setAsset("a1")}>📷 จำลองสแกน QR</Btn>
          </div>
          {asset && <p className="mt-2 rounded bg-slate-50 p-2 text-sm text-slate-600">{asset.line} · {asset.area} · ความสำคัญ {asset.criticality}</p>}
        </div>
        <fieldset><legend className="mb-1 text-sm font-medium">สภาพเครื่อง *</legend>
          <div className="grid grid-cols-3 gap-2">{([["stopped", "หยุดทำงาน"], ["abnormal", "ทำงานแต่ผิดปกติ"], ["degraded", "ประสิทธิภาพลดลง"]] as const).map(([v, l]) => (
            <button key={v} type="button" onClick={() => setCond(v)} className={`min-h-12 rounded-lg border px-2 text-sm ${cond === v ? "border-blue-700 bg-blue-50 font-semibold text-blue-900" : "border-slate-300"}`}>{l}</button>))}</div></fieldset>
        <div>
          <label className="mb-1 block text-sm font-medium">อาการ *</label>
          <div className="mb-2 flex flex-wrap gap-2">{SYMPTOM_TEMPLATES.map((s) => <button key={s} type="button" onClick={() => setSymptom(s)} className="min-h-10 rounded-full border border-slate-300 px-3 text-xs hover:bg-slate-50">{s}</button>)}</div>
          <textarea value={symptom} onChange={(e) => setSymptom(e.target.value)} rows={3} className="w-full rounded-lg border border-slate-300 p-3" placeholder="อธิบายอาการสั้น ๆ" />
        </div>
        <label className="flex min-h-12 items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-3 text-sm"><input type="checkbox" checked={safety} onChange={(e) => setSafety(e.target.checked)} className="size-5" />มีความเสี่ยงด้านความปลอดภัย / สิ่งแวดล้อม</label>
        {safety && <p className="rounded bg-red-100 p-2 text-xs text-red-900">กรณีเสี่ยงด้านความปลอดภัย ให้หยุดเครื่องและทำตามขั้นตอน EHS ทันที ไม่ต้องรอ SLA — ระบบเป็นเพียงที่บันทึก ไม่ได้ยืนยันว่าเครื่องปลอดภัย</p>}
        <div className="flex gap-2"><Btn className="flex-1" disabled={!assetId || !symptom.trim()} onClick={submit}>ส่งแจ้งซ่อม</Btn><Btn variant="ghost" onClick={saveDraft}>บันทึกร่าง</Btn></div>
        {draftSaved && <p className="text-xs text-slate-500">มีร่างที่บันทึกในเครื่องนี้ (ยังไม่ได้ส่ง) · ไม่รองรับการส่งแบบออฟไลน์</p>}
      </Card>
    </>
  );
}
