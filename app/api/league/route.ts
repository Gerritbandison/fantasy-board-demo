import { publicLeague } from "@/lib/league";

/** GET /api/league — teams, games, week 8 matchups, and champions (display names only). */
export async function GET() {
  return Response.json(publicLeague());
}
