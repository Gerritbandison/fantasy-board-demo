import { ImageResponse } from "next/og";
import { formatRecord, LEAGUE, STANDINGS } from "@/lib/league";

export const alt = `Chicken League, week ${LEAGUE.week}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export function OgImage() {
  const leader = STANDINGS[0];
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: "#0f1e36",
        color: "white",
        padding: "72px",
      }}
    >
      <div style={{ display: "flex", fontSize: 28, letterSpacing: 2, color: "#e6b325", fontWeight: 700 }}>CHICKEN LEAGUE · WEEK {LEAGUE.week}</div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", fontSize: 84, fontWeight: 800, lineHeight: 1 }}>{LEAGUE.season} season</div>
        <div style={{ display: "flex", marginTop: 28, fontSize: 36 }}>
          {leader.name} {formatRecord(leader)} leads after week {LEAGUE.week - 1}
        </div>
      </div>
    </div>,
    { ...size },
  );
}
