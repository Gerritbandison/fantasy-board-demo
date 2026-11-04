import { notFound } from "next/navigation";
import { TeamTradesSection } from "@/components/league/trades";
import { getTeam, STANDINGS } from "@/lib/league";

export function generateStaticParams() {
  return STANDINGS.map((t) => ({ id: String(t.id) }));
}

export default async function TradesPage({ params }: PageProps<"/teams/[id]/trades">) {
  const t = getTeam(Number((await params).id));
  if (!t) notFound();
  return <TeamTradesSection teamId={t.id} />;
}
