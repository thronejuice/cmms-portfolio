import { Card, PageHeader } from "@/components/ui";
import { CHECKLISTS } from "@/mock/data";
export default function Checklists() { return (<><PageHeader title="Checklists / Task templates" /><div className="grid gap-4 md:grid-cols-3">{CHECKLISTS.map((c) => <Card key={c.code} title={`${c.name} (${c.code})`}><ul className="space-y-1 text-sm">{c.items.map((i) => <li key={i}>☐ {i}</li>)}</ul></Card>)}</div></>); }
