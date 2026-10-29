import { snapshot } from "@/lib/league";

/** GET /api/league — the committed week snapshot (standings, featured matchups, insights). */
export async function GET() {
  return Response.json({ source: "snapshot", ...snapshot });
}
