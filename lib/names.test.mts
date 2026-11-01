import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { cleanName, franchiseAbbrev, franchiseName, publicSeasonName, USER_TEAM_ID } from "./names.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

/** ESPN's exact spelling for team 7. This name is supposed to render. */
const TEAM_7_ESPN_NAME = "Maye i give you a blowj0b";

/** Raw strings for the other franchises. Team 7 is not in this list. */
const OTHER_RAW = [/cocknballs/i, /fucking letdowns/i, /wet ass pussy/i, /ni66as/i, /"espnAbbrev": "NIGG"/];

const NAME_KEYS = /name$|abbrev$|Name$|Abbrev$/;

interface TeamFile {
  teams?: {
    teamId: number;
    displayName: string;
    displayAbbrev: string;
    espnName?: string;
    espnAbbrev?: string;
    history?: { seasons?: { season: number; displayName: string }[] };
  }[];
}

function walkNames(value: unknown, path: string, hits: string[]) {
  if (typeof value === "string") {
    if (NAME_KEYS.test(path)) {
      for (const pattern of OTHER_RAW) {
        if (pattern.test(value)) hits.push(`${path}: ${value}`);
      }
    }
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => walkNames(item, `${path}[${index}]`, hits));
    return;
  }
  if (value && typeof value === "object") {
    for (const [key, item] of Object.entries(value)) walkNames(item, `${path}.${key}`, hits);
  }
}

test("team 7 renders ESPN's name, and the abbreviation follows ESPN when it is not MAYE", () => {
  assert.equal(franchiseName(USER_TEAM_ID, "Maye Day", TEAM_7_ESPN_NAME), TEAM_7_ESPN_NAME);
  assert.equal(franchiseName(USER_TEAM_ID, TEAM_7_ESPN_NAME, TEAM_7_ESPN_NAME), TEAM_7_ESPN_NAME);
  assert.equal(cleanName(TEAM_7_ESPN_NAME), TEAM_7_ESPN_NAME);
  assert.equal(franchiseAbbrev(USER_TEAM_ID, "MAYE", "GOD"), "GOD");
  assert.equal(franchiseAbbrev(USER_TEAM_ID, "MAYE", "MAYE"), "MAYE");
  assert.equal(franchiseAbbrev(USER_TEAM_ID, "MAYE"), "MAYE");
  assert.equal(cleanName("Kabul Cocknballs"), "Kabul FC");
  assert.equal(cleanName("The Fucking Letdowns"), "The Letdowns");
  assert.equal(cleanName("Team Wet Ass Pussy"), "Team WAP");
  assert.equal(cleanName("Ni66as in  Trouble"), "In Trouble");
  assert.equal(franchiseAbbrev(11, "NIGG"), "KAB");
  assert.equal(publicSeasonName("Jahmyr I Go Again", 2020, "Black  Lives"), "Jahmyr I Go Again (2020)");
  assert.equal(publicSeasonName(TEAM_7_ESPN_NAME, 2024, "Mixon Impossible"), "Mixon Impossible");
});

test("other franchises keep their clean names", () => {
  const hits: string[] = [];
  for (const file of ["league-all-teams.json", "league-h2h-history.json", "league-trades.json"]) {
    const text = readFileSync(join(root, "data", file), "utf8");
    for (const pattern of OTHER_RAW) {
      if (pattern.test(text)) hits.push(`${file} still contains ${pattern}`);
    }
    const data = JSON.parse(text) as TeamFile;
    walkNames(data, file, hits);
    for (const team of data.teams ?? []) {
      const name = franchiseName(team.teamId, team.displayName, team.espnName);
      const abbrev = franchiseAbbrev(team.teamId, team.displayAbbrev, team.espnAbbrev);
      if (team.teamId === USER_TEAM_ID) {
        assert.equal(team.displayName, TEAM_7_ESPN_NAME);
        assert.equal(team.espnName, TEAM_7_ESPN_NAME);
        assert.equal(name, TEAM_7_ESPN_NAME);
        assert.equal(abbrev, "GOD");
        continue;
      }
      assert.equal(OTHER_RAW.some((pattern) => pattern.test(name) || pattern.test(abbrev)), false, `${team.teamId} ${name}`);
      for (const season of team.history?.seasons ?? []) {
        const shown = publicSeasonName(name, season.season, season.displayName);
        assert.equal(OTHER_RAW.some((pattern) => pattern.test(shown)), false, shown);
      }
    }
  }

  const skip = new Set(["names.ts", "names.test.mts", "node_modules", ".next"]);
  const files: string[] = [];
  const walkDir = (dir: string) => {
    for (const entry of readdirSync(dir)) {
      if (skip.has(entry)) continue;
      const path = join(dir, entry);
      if (statSync(path).isDirectory()) walkDir(path);
      else if (/\.(json|tsx?|md|mjs|mts)$/.test(entry)) files.push(path);
    }
  };
  for (const dir of ["app", "components", "data", "lib"]) walkDir(join(root, dir));
  files.push(join(root, "README.md"));
  for (const path of files) {
    if (path.endsWith("names.ts") || path.endsWith("names.test.mts")) continue;
    const text = readFileSync(path, "utf8");
    for (const pattern of OTHER_RAW) {
      if (pattern.test(text)) hits.push(`${path} matches ${pattern}`);
    }
  }

  assert.deepEqual(hits, []);
});
