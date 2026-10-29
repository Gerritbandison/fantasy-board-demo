import { getFantasyConfig } from "@/lib/config";
import { getEspnFantasy } from "@/lib/espn";
import { getMockDisconnected, getMockFantasy } from "@/lib/mock-fantasy";
import type { FantasyPayload } from "@/lib/types";

function json(payload: FantasyPayload) {
  return Response.json(payload, { headers: { "Cache-Control": "no-store" } });
}

/**
 * GET /api/fantasy
 *   ?state=disconnected  preview the empty "connect Flaim" state
 *   ?mock=1              force mock data even when ESPN is configured
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cfg = getFantasyConfig();

  if (searchParams.get("state") === "disconnected" || (cfg.mock && cfg.mockDisconnected)) {
    return json(getMockDisconnected(cfg.teamName));
  }

  if (cfg.mock || searchParams.get("mock") === "1") {
    return json(getMockFantasy(cfg.teamName));
  }

  if (!cfg.espn) {
    return json({
      ...getMockDisconnected(cfg.teamName),
      source: "espn",
      reason: "Live mode is on, but ESPN_LEAGUE_ID and ESPN_TEAM_ID are not set.",
    });
  }

  try {
    return json(await getEspnFantasy(cfg.espn));
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    return json({
      ...getMockFantasy(cfg.teamName),
      notice: `ESPN unavailable (${message}). Showing demo data.`,
    });
  }
}
