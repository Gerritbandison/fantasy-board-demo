import { notFound } from "next/navigation";
import { TeamHeadToHead } from "@/components/league/h2h";
import { getTeam, STANDINGS } from "@/lib/league";

export function generateStaticParams() {
  return STANDINGS.map((t) => ({ id: String(t.id) }));
}

export default async function HeadToHeadPage({ params }: PageProps<"/teams/[id]/h2h">) {
  const t = getTeam(Number((await params).id));
  if (!t) notFound();
  return <TeamHeadToHead teamId={t.id} />;
}