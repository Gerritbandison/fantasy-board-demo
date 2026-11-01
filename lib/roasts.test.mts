import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { franchiseAbbrev, franchiseName, hasOtherRawName } from "./names.ts";
import { normalizeRoastText, parseRoastTag } from "./roast-copy.ts";

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
  meta: { currentWeek: number };
  teams: { teamId: number; displayName: string; displayAbbrev: string; espnName?: string; espnAbbrev?: string }[];
}

test("normalizeRoastText uses the app abbreviations", () => {
  assert.equal(normalizeRoastText("Kabul and KBL lead, but JIGA is favored"), "Kabul FC and KAB lead, but JAH is favored");
  assert.equal(normalizeRoastText("Kabul FC's Thursday"), "Kabul FC's Thursday");
  assert.equal(normalizeRoastText(TEAM_7), TEAM_7);
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
  assert.equal(roasts.week, league.meta.currentWeek);
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
  const kabul = card(11, 5);
  assert.match(kabul?.roast ?? "", /Jakobi Meyers was cleared/);
  assert.doesNotMatch(`${kabul?.roast} ${kabul?.tag}`, /Meyers both/);
  assert.equal(kabul?.projection.away, 139.1);

  const smert = card(10, 6);
  assert.match(smert?.roast ?? "", /Khalil Shakir/);
  assert.match(smert?.roast ?? "", /KC Concepcion/);
  assert.doesNotMatch(smert?.roast ?? "", /starting DeVonta Smith/);
  assert.equal(smert?.projection.away, 109.9);
  assert.match(smert?.tag ?? "", /15\.6/);

  const heart = card(4, 2);
  assert.match(heart?.roast ?? "", /Patrick Mahomes starts/);
  assert.doesNotMatch(`${heart?.roast} ${heart?.tag}`, /Mahomes on the bench|benched Patrick Mahomes/);
  assert.match(heart?.tag ?? "", /17\.6/);
  assert.equal(heart?.projection.home, 111.4);

  const chewy = card(3, 1);
  assert.doesNotMatch(chewy?.tag ?? "", /LOCK:/);
  assert.equal(chewy?.projection.home, 133.4);
  assert.equal(chewy?.projection.away, 131.0);
  assert.match(chewy?.tag ?? "", /133\.4 to 131\.0/);

  const home = card(7, 8);
  assert.match(home?.roast ?? "", /DJ Moore was cleared/);
  assert.doesNotMatch(`${home?.roast} ${home?.tag}`, /Moore starts as Questionable/);
  assert.equal(home?.projection.away, 115.4);
  assert.match(home?.tag ?? "", /27\.3/);
  assert.match(home?.roast ?? "", /23\.2/);
  assert.match(home?.roast ?? "", /20\.9/);
});
