import { intel } from "@/lib/intel";
import { snapshot } from "@/lib/league";

/** GET /api/league — the committed week snapshot plus the league intel archive. */
export async function GET() {
  return Response.json({ source: "snapshot", ...snapshot, intel });
}
