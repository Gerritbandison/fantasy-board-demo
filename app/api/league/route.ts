import { publicLeague } from "@/lib/league";
import { WEEK_ROASTS } from "@/lib/roasts";

/** GET /api/league — teams, games, current matchups, roasts, and champions (display names only). */
export async function GET() {
  return Response.json({ ...publicLeague(), roasts: WEEK_ROASTS });
}
