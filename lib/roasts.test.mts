import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { franchiseAbbrev, franchiseName, hasOtherRawName } from "./names.ts";
import { normalizeRoastText, parseRoastTag, roastMatchesScoreboard } from "./roast-copy.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const TEAM_7 = "Maye i give you a blowj0b";

interface RoastFile {
  week: number;
  matchups: {
    matchupId: string;
    homeTeamId: number;
    awayTeamId: number;
    headline: string;
    roast: string;
    tag: string;
    projection: { home: number; away: number };
    homePoints: number;
    awayPoints: number;
  }[];
}

interface ScoreGame {
  homeTeamId: number;
  awayTeamId: number;
  homeCurrentPoints?: number;
  awayCurrentPoints?: number;
  homeProjected?: number;
  awayProjected?: number;
}

interface LeagueFile {
  meta: { currentWeek: number; weekInProgress?: { final?: boolean } };
  schedule: { [key: string]: ScoreGame[] };
  teams: {
    teamId: number;
    displayName: string;
    displayAbbrev: string;
    espnName?: string;
    espnAbbrev?: string;
    weekly?: { week: number; provisional?: boolean }[];
  }[];
}

function latestCompletedWeek(league: LeagueFile) {
  const weeks = league.teams.flatMap((team) => (team.weekly ?? []).filter((row) => !row.provisional).map((row) => row.week));
  if (!weeks.length) return null;
  return Math.max(...weeks);
}

test("normalizeRoastText uses the app abbreviations", () => {
  assert.equal(normalizeRoastText("Kabul and KBL lead, but JIGA is favored"), "Kabul FC and KAB lead, but JAH is favored");
  assert.equal(normalizeRoastText("Kabul FC's bench"), "Kabul FC's bench");
  assert.equal(normalizeRoastText(TEAM_7), TEAM_7);
});

test("a roast card is dropped when its score no longer matches the scoreboard", () => {
  assert.equal(roastMatchesScoreboard(114.92, 97.66, 114.92, 97.66), true);
  assert.equal(roastMatchesScoreboard(83.82, 79.96, 114.92, 97.66), false);
  assert.equal(roastMatchesScoreboard(179.26, 89.36, null, 89.36), false);
});

test("parseRoastTag splits Lock, Upset alert, and Toss-up", () => {
  assert.deepEqual(parseRoastTag("LOCK: favored by 27.3."), {
    kind: "lock",
    label: "Lock",
    detail: "favored by 27.3.",
  });
  assert.deepEqual(parseRoastTag("UPSET ALERT: JIGA is favored by 17.6."), {
    kind: "upset",
    label: "Upset alert",
    detail: "JAH is favored by 17.6.",
  });
  assert.deepEqual(parseRoastTag("TOSS-UP: Chewy's Warriors by 2.4."), {
    kind: "note",
    label: "Toss-up",
    detail: "Chewy's Warriors by 2.4.",
  });
});

test("week 8 roast cards stay on the app's names", () => {
  const roasts = JSON.parse(readFileSync(join(root, "data/week-roasts.json"), "utf8")) as RoastFile;
  const league = JSON.parse(readFileSync(join(root, "data/league-all-teams.json"), "utf8")) as LeagueFile;
  const completed = latestCompletedWeek(league);
  assert.ok(completed != null);
  assert.equal(roasts.week, completed);
  if (league.meta.weekInProgress?.final === true) assert.equal(roasts.week, league.meta.currentWeek);
  else assert.ok(roasts.week < league.meta.currentWeek);
  assert.equal(roasts.matchups.length, 5);
  const byId = new Map(league.teams.map((t) => [t.teamId, t]));
  for (const m of roasts.matchups) {
    for (const id of [m.homeTeamId, m.awayTeamId]) {
      const team = byId.get(id);
      assert.ok(team, `unknown team ${id}`);
      const name = franchiseName(team.teamId, team.displayName, team.espnName);
      const abbrev = franchiseAbbrev(team.teamId, team.displayAbbrev, team.espnAbbrev);
      assert.equal(hasOtherRawName(name) || hasOtherRawName(abbrev), false);
      if (id === 7) {
        assert.equal(name, TEAM_7);
        assert.equal(abbrev, "GOD");
      }
    }
    const blob = `${m.headline}\n${m.roast}\n${m.tag}`;
    assert.equal(hasOtherRawName(blob), false, blob);
    assert.equal(/\bJIGA\b|\bKBL\b/.test(blob), false, blob);
    assert.equal(/\bKabul\b(?! FC)/.test(normalizeRoastText(blob)), false, blob);
  }

  const games = league.schedule[`week${roasts.week}`];
  assert.ok(Array.isArray(games), `missing schedule week ${roasts.week}`);
  for (const row of roasts.matchups) {
    const game = games.find((entry) => entry.homeTeamId === row.homeTeamId && entry.awayTeamId === row.awayTeamId);
    assert.ok(game, `missing ${row.homeTeamId} vs ${row.awayTeamId}`);
    assert.equal(row.homePoints, game.homeCurrentPoints);
    assert.equal(row.awayPoints, game.awayCurrentPoints);
    assert.equal(row.projection.home, game.homeProjected);
    assert.equal(row.projection.away, game.awayProjected);
    const blob = `${row.headline}\n${row.roast}\n${row.tag}`;
    assert.equal(/83\.82|79\.96|39\.74|72\.34|still going|in progress|UNDECIDED|Scored 0/.test(blob), false, blob);
    const number = (value: number) => new RegExp(String(value).replace(/\./g, "\\."));
    assert.match(blob, number(row.homePoints));
    assert.match(blob, number(row.awayPoints));
  }
  if (roasts.week === 8) {
    const card = (home: number, away: number) => roasts.matchups.find((m) => m.homeTeamId === home && m.awayTeamId === away);
    const maye = card(7, 8);
    assert.ok(maye);
    assert.match(maye.roast, /favored by 6\.9/);
    assert.doesNotMatch(maye.roast, /lower projection/);
    assert.doesNotMatch(maye.roast, /Ninety/);
    const easy = card(11, 5);
    assert.ok(easy);
    assert.match(easy.roast, /scored 97\.66/);
    assert.doesNotMatch(easy.roast, /scored 97(?!\.)/);
    const bibi = card(3, 1);
    assert.ok(bibi);
    assert.match(bibi.roast, /31\.7/);
  }
});
