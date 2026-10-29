import { getMatchup, LEAGUE, MATCHUPS, team } from "@/lib/league";
import { buildPreview } from "@/lib/preview";

export async function generateStaticParams() {
  return [...MATCHUPS.map((m) => ({ slug: m.slug })), { slug: "golden-goose" }, { slug: "bibis" }];
}

/** GET /api/matchup/:slug for any week 8 game (e.g. maye-dim); golden-goose and bibis still resolve. */
export async function GET(_req: Request, ctx: RouteContext<"/api/matchup/[slug]">) {
  const { slug } = await ctx.params;
  const m = getMatchup(slug);
  if (!m) {
    return Response.json({ error: `Unknown matchup "${slug}"`, available: MATCHUPS.map((x) => x.slug) }, { status: 404 });
  }
  return Response.json({
    league: { season: LEAGUE.season, week: LEAGUE.week },
    matchup: m,
    left: team(m.left.teamId),
    right: team(m.right.teamId),
    preview: buildPreview(m),
  });
}
