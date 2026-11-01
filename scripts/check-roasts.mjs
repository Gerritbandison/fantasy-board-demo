import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const BANNED = /blowj0b|cocknballs|fucking|wet ass pussy|ni66as/i;
const DISPLAY_KEY = /(?:displayName|DisplayName|seasonName)$|^(?:names|teams|tiedWith)$/;

function load(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function walk(value, key, file, hits) {
  if (Array.isArray(value)) {
    value.forEach((item) => walk(item, key, file, hits));
    return;
  }
  if (value && typeof value === "object") {
    for (const [childKey, child] of Object.entries(value)) walk(child, childKey, file, hits);
    return;
  }
  if (typeof value !== "string" || !BANNED.test(value)) return;
  const espnKey = key && /espn/i.test(key);
  const displayKey = key && DISPLAY_KEY.test(key) && !espnKey;
  if (displayKey) hits.push(`${file} ${key}: ${value}`);
}

const dataFiles = ["data/league-all-teams.json", "data/league-h2h-history.json", "data/league-trades.json"];
const displayHits = [];
for (const file of dataFiles) walk(load(file), null, file, displayHits);
assert.deepEqual(displayHits, [], `vulgar display names:\n${displayHits.join("\n")}`);

const league = load("data/league-all-teams.json");
assert.equal(league.teamIndex["7"].displayName, "Maye Day");
assert.equal(league.teamIndex["7"].abbrev, "MAYE");
assert.equal(league.teamIndex["11"].displayName, "Kabul FC");
assert.equal(league.teamIndex["11"].abbrev, "KAB");
assert.equal(league.teamIndex["2"].displayName, "Jahmyr I Go Again");
assert.equal(league.teamIndex["2"].abbrev, "JAH");
const team7 = league.teams.find((t) => t.teamId === 7);
assert.equal(team7.displayName, "Maye Day");
assert.equal(team7.displayAbbrev, "MAYE");

const roasts = load("data/week-roasts.json");
assert.equal(roasts.week, league.meta.currentWeek);
assert.equal(roasts.matchups.length, 5);

const byId = new Map(league.teams.map((t) => [t.teamId, t]));
const seen = new Set();
let locks = 0;
let upsets = 0;
for (const m of roasts.matchups) {
  assert.equal(seen.has(m.matchupId), false);
  seen.add(m.matchupId);
  for (const id of [m.homeTeamId, m.awayTeamId]) assert.ok(byId.has(id), `unknown team ${id}`);
  const blob = `${m.headline}\n${m.roast}\n${m.tag}`;
  assert.equal(BANNED.test(blob), false, blob);
  assert.equal(/\bJIGA\b|\bKBL\b/.test(blob), false, blob);
  assert.equal(/\bKabul\b(?! FC)/.test(blob), false, blob);
  if (/^LOCK:/i.test(m.tag)) locks += 1;
  else if (/^UPSET ALERT:/i.test(m.tag)) upsets += 1;
  else assert.fail(`tag must be LOCK or UPSET ALERT: ${m.tag}`);
  assert.equal(typeof m.projection.home, "number");
  assert.equal(typeof m.projection.away, "number");
  assert.equal(typeof m.homePoints, "number");
  assert.equal(typeof m.awayPoints, "number");
}
assert.equal(locks, 3);
assert.equal(upsets, 2);

const pairs = roasts.matchups.map((m) => `${m.homeTeamId}v${m.awayTeamId}`).sort();
assert.deepEqual(pairs, ["10v6", "11v5", "3v1", "4v2", "7v8"]);

console.log("roast checks passed");
