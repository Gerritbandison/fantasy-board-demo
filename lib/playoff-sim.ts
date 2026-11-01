/**
 * Client-side Monte Carlo for the Chicken league's last seven regular-season weeks.
 * Ported from the playoff canvas: ESPN projection, plus each team's bias,
 * plus normal noise. The focus team's bias is 0; `shift` moves that mean instead.
 * Top 4 make the playoffs. Tiebreak is wins, then points for.
 */

/** Runs used by the page. Seeded, so a reload shows the same odds. */
export const SIM_COUNT = 8000;

export interface SimTeam {
  id: number;
  bias: number;
  sd: number;
  wins: number;
  losses: number;
  pf: number;
}

export interface SimGame {
  week: number;
  homeId: number;
  awayId: number;
  homeProj: number;
  awayProj: number;
  homeCurrent?: number;
  awayCurrent?: number;
}

export interface RootFor {
  week: number;
  winnerId: number;
  loserId: number;
}

export interface SimModel {
  focusId: number;
  playoffSpots: number;
  regularSeasonWeeks: number;
  nonByeEspn: number;
  source?: string;
  teams: SimTeam[];
  games: SimGame[];
  rootFor: RootFor[];
}

export interface SimOpts {
  n: number;
  seed: number;
  shift: number;
  /** Game index → winner team id. */
  forced?: Record<number, number>;
}

export interface TeamOdds {
  id: number;
  odds: number;
  avgPf: number;
}

export interface WinBucket {
  wins: number;
  count: number;
  share: number;
  odds: number;
}

export interface Swing {
  gameIndex: number;
  week: number;
  winnerId: number;
  loserId: number;
  oddsIfWinner: number;
  oddsIfLoser: number;
  swing: number;
}

export interface SimSummary {
  n: number;
  teams: TeamOdds[];
  focusOdds: number;
  byWins: WinBucket[];
  cut: { wins: number; share: number }[];
  pfDecidedRate: number;
  pfWonRate: number;
  swings: Swing[];
}

export interface PathStep {
  wins: number;
  losses: number;
  /** Week just won on this step. Null is the record today, before another forced win. */
  week: number | null;
  odds: number;
}

export interface ScheduleRow {
  gameIndex: number;
  week: number;
  home: boolean;
  opponentId: number;
  focusProj: number;
  oppProj: number;
  margin: number;
  winProb: number;
  live: boolean;
}

export function rngFrom(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function phi(x: number) {
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const d = 0.3989423 * Math.exp((-x * x) / 2);
  const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return x > 0 ? 1 - p : p;
}

export function formatPct(x: number, digits = 0) {
  if (!Number.isFinite(x)) return "—";
  if (digits > 0) return `${(x * 100).toFixed(digits)}%`;
  if (x >= 0.995 && x < 1) return ">99%";
  if (x > 0 && x < 0.005) return "<1%";
  return `${Math.round(x * 100)}%`;
}

function teamOf(model: SimModel, id: number) {
  const team = model.teams.find((t) => t.id === id);
  if (!team) throw new Error(`Unknown team ${id}`);
  return team;
}

export function focusTeam(model: SimModel) {
  return teamOf(model, model.focusId);
}

/** Mean and SD of a side's final score. Week 8 shrinks the noise by how much of the projection is still out. */
export function sideDist(model: SimModel, game: SimGame, side: "home" | "away", shift: number): [number, number] {
  const id = side === "home" ? game.homeId : game.awayId;
  const proj = side === "home" ? game.homeProj : game.awayProj;
  const cur = side === "home" ? game.homeCurrent : game.awayCurrent;
  const team = teamOf(model, id);
  const adj = id === model.focusId ? shift : team.bias;
  if (game.week === 8 && cur != null) {
    const frac = Math.max(0.05, (proj - cur) / proj);
    return [proj + adj * frac, team.sd * Math.sqrt(frac)];
  }
  return [proj + adj, team.sd];
}

export function focusWinProb(model: SimModel, game: SimGame, shift: number) {
  const home = game.homeId === model.focusId;
  const [mm, ms] = sideDist(model, game, home ? "home" : "away", shift);
  const [om, os] = sideDist(model, game, home ? "away" : "home", shift);
  return phi((mm - om) / Math.sqrt(ms * ms + os * os));
}

export function focusSchedule(model: SimModel, shift: number): ScheduleRow[] {
  const rows: ScheduleRow[] = [];
  model.games.forEach((game, gameIndex) => {
    const home = game.homeId === model.focusId;
    const away = game.awayId === model.focusId;
    if (!home && !away) return;
    const [mm, ms] = sideDist(model, game, home ? "home" : "away", shift);
    const [om, os] = sideDist(model, game, home ? "away" : "home", shift);
    const myEspn = (home ? game.homeProj : game.awayProj) + shift;
    const oppEspn = home ? game.awayProj : game.homeProj;
    const opp = teamOf(model, home ? game.awayId : game.homeId);
    rows.push({
      gameIndex,
      week: game.week,
      home,
      opponentId: home ? game.awayId : game.homeId,
      focusProj: myEspn,
      oppProj: oppEspn + opp.bias,
      margin: mm - om,
      winProb: phi((mm - om) / Math.sqrt(ms * ms + os * os)),
      live: game.week === 8 && game.homeCurrent != null,
    });
  });
  return rows;
}

export function winOutChance(model: SimModel, shift: number) {
  return focusSchedule(model, shift).reduce((acc, row) => acc * row.winProb, 1);
}

function gaussOf(rand: () => number) {
  return () => {
    const u = 1 - rand();
    const v = rand();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  };
}

function samplePair(gauss: () => number, mh: number, sh: number, ma: number, sa: number, want: number | undefined, homeId: number) {
  let h = 0;
  let a = 0;
  for (let k = 0; k < 60; k++) {
    h = mh + sh * gauss();
    a = ma + sa * gauss();
    if (want === undefined || (want === homeId) === (h > a)) break;
  }
  if (want !== undefined && (want === homeId) !== (h > a)) {
    const swap = h;
    h = a;
    a = swap;
  }
  return [h, a] as const;
}

interface Prepared {
  ids: number[];
  index: Map<number, number>;
  nt: number;
  ng: number;
  homeI: number[];
  awayI: number[];
  homeId: number[];
  means: [number, number][];
  sds: [number, number][];
  mayeAt: number[];
  focusI: number;
  baseW: Float64Array;
  basePf: Float64Array;
}

function prepare(model: SimModel, shift: number): Prepared {
  const ids = model.teams.map((t) => t.id);
  const index = new Map(ids.map((id, i) => [id, i]));
  const homeI: number[] = [];
  const awayI: number[] = [];
  const homeId: number[] = [];
  const means: [number, number][] = [];
  const sds: [number, number][] = [];
  const mayeAt: number[] = [];
  model.games.forEach((game, i) => {
    const hi = index.get(game.homeId);
    const ai = index.get(game.awayId);
    if (hi == null || ai == null) throw new Error(`Game ${i} names an unknown team`);
    homeI.push(hi);
    awayI.push(ai);
    homeId.push(game.homeId);
    const [mh, sh] = sideDist(model, game, "home", shift);
    const [ma, sa] = sideDist(model, game, "away", shift);
    means.push([mh, ma]);
    sds.push([sh, sa]);
    if (game.homeId === model.focusId || game.awayId === model.focusId) mayeAt.push(i);
  });
  const focusI = index.get(model.focusId);
  if (focusI == null) throw new Error("Focus team missing");
  return {
    ids,
    index,
    nt: ids.length,
    ng: model.games.length,
    homeI,
    awayI,
    homeId,
    means,
    sds,
    mayeAt,
    focusI,
    baseW: Float64Array.from(model.teams.map((t) => t.wins)),
    basePf: Float64Array.from(model.teams.map((t) => t.pf)),
  };
}

function applyScore(W: Float64Array, PF: Float64Array, hi: number, ai: number, h: number, a: number) {
  PF[hi] += h;
  PF[ai] += a;
  if (h > a) W[hi] += 1;
  else W[ai] += 1;
}

function ranked(W: Float64Array, PF: Float64Array) {
  const order = Array.from(W, (_, i) => i);
  order.sort((x, y) => W[y] - W[x] || PF[y] - PF[x]);
  return order;
}

export function simulate(model: SimModel, opts: SimOpts): SimSummary {
  const prep = prepare(model, opts.shift);
  const rand = rngFrom(opts.seed);
  const gauss = gaussOf(rand);
  const { nt, ng, focusI, homeI, awayI, homeId, means, sds, baseW, basePf } = prep;
  const forced = opts.forced ?? {};
  const mayeSet = new Set(prep.mayeAt);
  const made = new Uint32Array(nt);
  const pfSum = new Float64Array(nt);
  const byCount = new Uint32Array(model.regularSeasonWeeks + 1);
  const byMade = new Uint32Array(model.regularSeasonWeeks + 1);
  const cut = new Uint32Array(model.regularSeasonWeeks + 1);
  const swingH = new Uint32Array(ng);
  const swingHMade = new Uint32Array(ng);
  const swingA = new Uint32Array(ng);
  const swingAMade = new Uint32Array(ng);
  let pfDecided = 0;
  let pfWon = 0;
  const W = new Float64Array(nt);
  const PF = new Float64Array(nt);
  const spots = model.playoffSpots;

  for (let s = 0; s < opts.n; s++) {
    W.set(baseW);
    PF.set(basePf);
    const homeWon = new Uint8Array(ng);
    for (let gi = 0; gi < ng; gi++) {
      const [h, a] = samplePair(gauss, means[gi][0], sds[gi][0], means[gi][1], sds[gi][1], forced[gi], homeId[gi]);
      applyScore(W, PF, homeI[gi], awayI[gi], h, a);
      if (h > a) homeWon[gi] = 1;
    }
    const order = ranked(W, PF);
    let focusMade = false;
    for (let k = 0; k < spots; k++) {
      made[order[k]] += 1;
      if (order[k] === focusI) focusMade = true;
    }
    for (let i = 0; i < nt; i++) pfSum[i] += PF[i];
    const wins = W[focusI];
    byCount[wins] += 1;
    if (focusMade) byMade[wins] += 1;
    cut[W[order[spots - 1]]] += 1;
    if (W[order[spots - 1]] === W[order[spots]] && wins === W[order[spots - 1]]) {
      pfDecided += 1;
      if (focusMade) pfWon += 1;
    }
    for (let gi = 0; gi < ng; gi++) {
      if (mayeSet.has(gi) || forced[gi] !== undefined) continue;
      if (homeWon[gi]) {
        swingH[gi] += 1;
        if (focusMade) swingHMade[gi] += 1;
      } else {
        swingA[gi] += 1;
        if (focusMade) swingAMade[gi] += 1;
      }
    }
  }

  return finishSummary(model, opts.n, prep, made, pfSum, byCount, byMade, cut, pfDecided, pfWon, swingH, swingHMade, swingA, swingAMade);
}

function finishSummary(
  model: SimModel,
  n: number,
  prep: Prepared,
  made: Uint32Array,
  pfSum: Float64Array,
  byCount: Uint32Array,
  byMade: Uint32Array,
  cut: Uint32Array,
  pfDecided: number,
  pfWon: number,
  swingH: Uint32Array,
  swingHMade: Uint32Array,
  swingA: Uint32Array,
  swingAMade: Uint32Array,
): SimSummary {
  const teams: TeamOdds[] = prep.ids.map((id, i) => ({ id, odds: made[i] / n, avgPf: pfSum[i] / n }));
  const byWins: WinBucket[] = [];
  for (let wins = 0; wins < byCount.length; wins++) {
    if (byCount[wins] < 20) continue;
    byWins.push({ wins, count: byCount[wins], share: byCount[wins] / n, odds: byMade[wins] / byCount[wins] });
  }
  const cutRows = [];
  for (let wins = 0; wins < cut.length; wins++) {
    if (cut[wins] === 0) continue;
    cutRows.push({ wins, share: cut[wins] / n });
  }
  const swings: Swing[] = [];
  model.games.forEach((game, gi) => {
    const hn = swingH[gi];
    const an = swingA[gi];
    if (hn < 30 || an < 30) return;
    const ph = swingHMade[gi] / hn;
    const pa = swingAMade[gi] / an;
    if (ph >= pa) swings.push({ gameIndex: gi, week: game.week, winnerId: game.homeId, loserId: game.awayId, oddsIfWinner: ph, oddsIfLoser: pa, swing: ph - pa });
    else swings.push({ gameIndex: gi, week: game.week, winnerId: game.awayId, loserId: game.homeId, oddsIfWinner: pa, oddsIfLoser: ph, swing: pa - ph });
  });
  swings.sort((a, b) => b.swing - a.swing);
  return {
    n,
    teams,
    focusOdds: made[prep.focusI] / n,
    byWins,
    cut: cutRows,
    pfDecidedRate: pfDecided / n,
    pfWonRate: pfDecided ? pfWon / pfDecided : 0,
    swings,
  };
}

/**
 * Playoff odds if the focus team wins the next k remaining games, k = 0…7.
 * Later games stay random. Other forced results apply on every step.
 * One pass draws each other game once and each focus game twice (random, and a forced win).
 */
export function winOutPath(model: SimModel, opts: SimOpts): PathStep[] {
  const prep = prepare(model, opts.shift);
  const rand = rngFrom(opts.seed);
  const gauss = gaussOf(rand);
  const { nt, ng, focusI, homeI, awayI, homeId, means, sds, mayeAt, baseW, basePf } = prep;
  const forced = opts.forced ?? {};
  const mayeSet = new Set(mayeAt);
  const steps = mayeAt.length;
  const made = new Uint32Array(steps + 1);
  const W = new Float64Array(nt);
  const PF = new Float64Array(nt);
  const snapW = new Float64Array(nt);
  const snapPf = new Float64Array(nt);
  const uh = new Float64Array(steps);
  const ua = new Float64Array(steps);
  const fh = new Float64Array(steps);
  const fa = new Float64Array(steps);
  const spots = model.playoffSpots;

  for (let s = 0; s < opts.n; s++) {
    W.set(baseW);
    PF.set(basePf);
    for (let gi = 0; gi < ng; gi++) {
      if (mayeSet.has(gi)) continue;
      const [h, a] = samplePair(gauss, means[gi][0], sds[gi][0], means[gi][1], sds[gi][1], forced[gi], homeId[gi]);
      applyScore(W, PF, homeI[gi], awayI[gi], h, a);
    }
    snapW.set(W);
    snapPf.set(PF);
    for (let j = 0; j < steps; j++) {
      const gi = mayeAt[j];
      const [h, a] = samplePair(gauss, means[gi][0], sds[gi][0], means[gi][1], sds[gi][1], undefined, homeId[gi]);
      uh[j] = h;
      ua[j] = a;
      const [hw, aw] = samplePair(gauss, means[gi][0], sds[gi][0], means[gi][1], sds[gi][1], model.focusId, homeId[gi]);
      fh[j] = hw;
      fa[j] = aw;
    }
    for (let k = 0; k <= steps; k++) {
      W.set(snapW);
      PF.set(snapPf);
      for (let j = 0; j < steps; j++) {
        const gi = mayeAt[j];
        const h = j < k ? fh[j] : uh[j];
        const a = j < k ? fa[j] : ua[j];
        applyScore(W, PF, homeI[gi], awayI[gi], h, a);
      }
      const order = ranked(W, PF);
      for (let p = 0; p < spots; p++) {
        if (order[p] === focusI) made[k] += 1;
      }
    }
  }

  const focus = focusTeam(model);
  return Array.from({ length: steps + 1 }, (_, k) => ({
    wins: focus.wins + k,
    losses: focus.losses,
    week: k === 0 ? null : model.games[mayeAt[k - 1]].week,
    odds: made[k] / opts.n,
  }));
}
