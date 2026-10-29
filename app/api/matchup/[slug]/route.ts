import { BOARDS, getBoard, snapshot } from "@/lib/league";

export async function generateStaticParams() {
  return BOARDS.map((b) => ({ slug: b.slug }));
}

/** GET /api/matchup/golden-goose | /api/matchup/bibis */
export async function GET(_req: Request, ctx: RouteContext<"/api/matchup/[slug]">) {
  const { slug } = await ctx.params;
  const board = getBoard(slug);
  if (!board) {
    return Response.json(
      { error: `Unknown matchup "${slug}"`, available: BOARDS.map((b) => b.slug) },
      { status: 404 },
    );
  }
  return Response.json({
    source: "snapshot",
    league: snapshot.league,
    manager: board.config.manager,
    matchup: board.matchup,
    focus: board.focus,
    opponent: board.opponent,
  });
}
