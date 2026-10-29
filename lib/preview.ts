import { formatRecord, isFlagged, LEAGUE, ordinal, team, winnerSide, type Matchup, type Team } from "./league";
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
    story.push(`${fav.name} ${verb(fav, "is", "are")} projected to win by ${f1(margin)}, ${f1(Math.max(lp, rp))} to ${f1(Math.min(lp, rp))}.`);
  }
  story.push(`${standingLine(L)}; ${standingLine(R, true)}.`);
  const ls = teamStats(L);
  const rs = teamStats(R);
  story.push(`Over the last three weeks ${L.name} averaged ${f1(ls.last3)} and ${R.name} ${f1(rs.last3)}.`);
  const met = meetings(L.id, R.id);
  if (met.length) {
    story.push(met.map((g) => {
      const w = winnerSide(g);
      const l = w === g.home ? g.away : g.home;
      return `They already met in week ${g.week}: ${team(w.teamId).name} won ${w.score.toFixed(2)}–${l.score.toFixed(2)}.`;
    }).join(" "));
  } else {
    story.push(`First meeting of the ${LEAGUE.season} season.`);
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
    return { label: "Recent form", detail: `${f1(a)} avg over the last 3 vs ${f1(b)}` };
  });
  push(ls.high.pf, rs.high.pf, true, (w) => {
    const [a, b] = pick(w, ls.high, rs.high);
    return { label: "Ceiling", detail: `Best week ${f1(a.pf)} (wk ${a.week}) vs ${f1(b.pf)}` };
  });
  push(ls.stdDev, rs.stdDev, false, (w) => {
    const [a, b] = pick(w, ls.stdDev, rs.stdDev);
    return { label: "Consistency", detail: `±${f1(a)} weekly swing vs ±${f1(b)}` };
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
    return { label: "Health", detail: `${a} starter${a === 1 ? "" : "s"} on the injury report vs ${b}` };
  });

  const stakes = [L, R].map(
    (t) =>
      `${t.name}: a win goes to ${formatRecord({ ...t, wins: t.wins + 1 })}, a loss to ${formatRecord({ ...t, losses: t.losses + 1 })}.`,
  );

  return { favoriteId, margin, story, edges, stakes };
}

/** Team names like "Bibi's Boys" read as plural. */
function verb(t: Team, singular: string, plural: string) {
  return /s$/i.test(t.name) ? plural : singular;
}

function standingLine(t: Team, short?: boolean) {
  const v = short ? verb(t, "is", "are") : verb(t, "comes in", "come in");
  return `${t.name} ${v} ${formatRecord(t)}, ${ordinal(t.rank)} in the standings and ${ordinal(pfRank(t.id))} in points`;
}
