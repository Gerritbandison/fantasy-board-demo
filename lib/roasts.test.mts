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

interface LeagueFile {
  meta: { currentWeek: number; weekInProgress?: { final?: boolean } };
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

  const card = (home: number, away: number) => roasts.matchups.find((m) => m.homeTeamId === home && m.awayTeamId === away);
  const finals: { home: number; away: number; homePoints: number; awayPoints: number; homeProj: number; awayProj: number }[] = [
    { home: 11, away: 5, homePoints: 114.92, awayPoints: 97.66, homeProj: 115.27, awayProj: 138.5 },
    { home: 10, away: 6, homePoints: 128.48, awayPoints: 95.1, homeProj: 130.11, awayProj: 109.5 },
    { home: 4, away: 2, homePoints: 120.64, awayPoints: 103.68, homeProj: 108.58, awayProj: 128.67 },
    { home: 3, away: 1, homePoints: 116.1, awayPoints: 147.78, homeProj: 137.72, awayProj: 131.05 },
    { home: 7, away: 8, homePoints: 179.26, awayPoints: 89.36, homeProj: 128.52, awayProj: 121.66 },
  ];
  for (const expected of finals) {
    const row = card(expected.home, expected.away);
    assert.ok(row, `missing ${expected.home} vs ${expected.away}`);
    assert.equal(row.homePoints, expected.homePoints);
    assert.equal(row.awayPoints, expected.awayPoints);
    assert.equal(row.projection.home, expected.homeProj);
    assert.equal(row.projection.away, expected.awayProj);
    const blob = `${row.headline}\n${row.roast}\n${row.tag}`;
    assert.equal(/83\.82|79\.96|39\.74|72\.34|still going|in progress|UNDECIDED|Scored 0/.test(blob), false, blob);
    assert.match(blob, new RegExp(expected.homePoints.toString()));
    assert.match(blob, new RegExp(expected.awayPoints.toString()));
  }
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
});
