import { gameCommentary, type GameInput, type SideInput } from "./commentary.ts";
import { formatRecord, isFlagged, ordinal, team, winnerSide, type Matchup, type Team } from "./league";
import { allPlay, meetings, pfRank, teamStats } from "./stats";

export interface Edge {
  label: string;
  detail: string;
}

export interface Preview {
  favoriteId?: number;
  margin?: number;
  story: string[];
  edges: { left: Edge[]; right: Edge[] };
  stakes: string[];
}

const f1 = (n: number) => n.toFixed(1);

function lossesInARow(t: Team) {
  let streak = 0;
  for (const week of [...t.weekly].reverse()) {
    if (week.provisional) continue;
    if (week.result !== "L") break;
    streak += 1;
  }
  return streak;
}

function sideInput(t: Team, points: number | undefined, projected: number | undefined): SideInput {
  return {
    name: t.name,
    points: points ?? 0,
    projected: projected ?? null,
    wins: t.wins,
    losses: t.losses,
    lossesInARow: lossesInARow(t),
  };
}

/** Facts the commentary templates are allowed to use. */
export function matchupFacts(m: Matchup): GameInput {
  const left = team(m.left.teamId);
  const right = team(m.right.teamId);
  return {
    state: m.state,
    seed: m.week * 100 + left.id * 10 + right.id,
    left: sideInput(left, m.left.points, m.left.projected),
    right: sideInput(right, m.right.points, m.right.projected),
  };
}

/** A data-only preview: every sentence and edge is computed from the committed league file. */
export function buildPreview(m: Matchup): Preview {
  const L = team(m.left.teamId);
  const R = team(m.right.teamId);
  const lp = m.left.projected;
  const rp = m.right.projected;
  const story: string[] = [];
  let favoriteId: number | undefined;
  let margin: number | undefined;

  if (lp != null && rp != null) {
    const fav = lp >= rp ? L : R;
    favoriteId = fav.id;
    margin = Math.abs(lp - rp);
  }
  story.push(...gameCommentary(matchupFacts(m)).lines);
  story.push(`${placeLine(L)} ${placeLine(R)}`);
  const ls = teamStats(L);
  const rs = teamStats(R);
  story.push(`Last three weeks: ${L.name} ${f1(ls.last3)}, ${R.name} ${f1(rs.last3)}.`);
  const met = meetings(L.id, R.id);
  if (met.length) {
    story.push(met.map((g) => {
      const w = winnerSide(g);
      const l = w === g.home ? g.away : g.home;
      return `Week ${g.week}: ${team(w.teamId).name} won ${w.score.toFixed(2)}–${l.score.toFixed(2)}.`;
    }).join(" "));
  } else {
    story.push("First meeting this season.");
  }

  const edges: Preview["edges"] = { left: [], right: [] };
  const push = (lv: number, rv: number, higherIsBetter: boolean, make: (winner: "l" | "r") => Edge) => {
    if (lv === rv) return;
    const leftWins = higherIsBetter ? lv > rv : lv < rv;
    (leftWins ? edges.left : edges.right).push(make(leftWins ? "l" : "r"));
  };
  const pick = <T,>(w: "l" | "r", l: T, r: T) => (w === "l" ? [l, r] : [r, l]);

  if (lp != null && rp != null)
    push(lp, rp, true, (w) => {
      const [a, b] = pick(w, lp, rp);
      return { label: "Projection", detail: `${f1(a)} vs ${f1(b)}` };
    });
  push(L.wins - L.losses, R.wins - R.losses, true, (w) => {
    const [a, b] = pick(w, L, R);
    return { label: "Record", detail: `${formatRecord(a)} vs ${formatRecord(b)}` };
  });
  push(L.pointsFor, R.pointsFor, true, (w) => {
    const [a, b] = pick(w, L, R);
    return { label: "Season points", detail: `${f1(a.pointsFor)} (${ordinal(pfRank(a.id))}) vs ${f1(b.pointsFor)}` };
  });
  push(ls.last3, rs.last3, true, (w) => {
    const [a, b] = pick(w, ls.last3, rs.last3);
      return { label: "Recent form", detail: `${f1(a)} vs ${f1(b)}` };
  });
  push(ls.high.pf, rs.high.pf, true, (w) => {
    const [a, b] = pick(w, ls.high, rs.high);
      return { label: "Ceiling", detail: `${f1(a.pf)} wk ${a.week} vs ${f1(b.pf)}` };
  });
  push(ls.stdDev, rs.stdDev, false, (w) => {
    const [a, b] = pick(w, ls.stdDev, rs.stdDev);
      return { label: "Consistency", detail: `±${f1(a)} vs ±${f1(b)}` };
  });
  const lap = allPlay(L.id);
  const rap = allPlay(R.id);
  push(lap.pct, rap.pct, true, (w) => {
    const [a, b] = pick(w, lap, rap);
    return { label: "All-play", detail: `${a.wins}-${a.losses} vs ${b.wins}-${b.losses}` };
  });
  const lf = L.roster.starters.filter(isFlagged).length;
  const rf = R.roster.starters.filter(isFlagged).length;
  push(lf, rf, false, (w) => {
    const [a, b] = pick(w, lf, rf);
      return { label: "Health", detail: `${a} vs ${b}` };
  });

  const stakes = [L, R].map(
    (t) =>
      `${t.name}: a win goes to ${formatRecord({ ...t, wins: t.wins + 1 })}, a loss to ${formatRecord({ ...t, losses: t.losses + 1 })}.`,
  );

  return { favoriteId, margin, story, edges, stakes };
}

function placeLine(t: Team) {
  return `${t.name} is ${formatRecord(t)}, ${ordinal(t.rank)} in the standings and ${ordinal(pfRank(t.id))} in points.`;
}
