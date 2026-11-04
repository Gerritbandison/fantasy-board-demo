import { notFound } from "next/navigation";
import { TeamHistory } from "@/components/league/team-sections";
import { getTeam, STANDINGS } from "@/lib/league";

export function generateStaticParams() {
  return STANDINGS.map((t) => ({ id: String(t.id) }));
}

export default async function HistoryPage({ params }: PageProps<"/teams/[id]/history">) {
  const t = getTeam(Number((await params).id));
  if (!t) notFound();
  return <TeamHistory team={t} />;
}
