import { notFound } from "next/navigation";
import { TeamRoster } from "@/components/league/team-sections";
import { getTeam, STANDINGS } from "@/lib/league";

export function generateStaticParams() {
  return STANDINGS.map((t) => ({ id: String(t.id) }));
}

export default async function RosterPage({ params }: PageProps<"/teams/[id]/roster">) {
  const t = getTeam(Number((await params).id));
  if (!t) notFound();
  return <TeamRoster team={t} />;
}
