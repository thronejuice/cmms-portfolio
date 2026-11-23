import { Card, PageHeader } from "@/components/ui";
import { COMPANY, LOCATIONS } from "@/mock/data";
export default function Locations() { return (<><PageHeader title="สถานที่" sub={`${COMPANY} → Area → Line → Equipment`} />{LOCATIONS.map((l) => <Card key={l.name} title={l.name}><ul className="list-inside list-disc text-sm">{l.children.map((c) => <li key={c}>{c}</li>)}</ul></Card>)}</>); }
