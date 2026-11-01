import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { cleanName, franchiseAbbrev, franchiseName, publicSeasonName, USER_PUBLIC_ABBREV, USER_PUBLIC_NAME, USER_TEAM_ID } from "./names.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

/** Raw franchise strings. A rendered name, or any data file the UI reads, must not match these. */
const RAW_VULGAR = [
  /blowj0b/i,
  /cocknballs/i,
  /fucking letdowns/i,
  /wet ass pussy/i,
  /ni66as/i,
  /"espnAbbrev": "NIGG"/,
];

const NAME_KEYS = /name$|abbrev$|Name$|Abbrev$/;

function walkNames(value: unknown, path: string, hits: string[]) {
  if (typeof value === "string") {
    if (NAME_KEYS.test(path)) {
      for (const pattern of RAW_VULGAR) {
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

test("team 7 always renders as Maye Day", () => {
  assert.equal(franchiseName(USER_TEAM_ID, "Maye i give you a blowj0b"), USER_PUBLIC_NAME);
  assert.equal(franchiseName(USER_TEAM_ID, "something else"), USER_PUBLIC_NAME);
  assert.equal(franchiseAbbrev(USER_TEAM_ID, "GOD"), USER_PUBLIC_ABBREV);
  assert.equal(cleanName("Kabul Cocknballs"), "Kabul FC");
  assert.equal(cleanName("The Fucking Letdowns"), "The Letdowns");
  assert.equal(cleanName("Team Wet Ass Pussy"), "Team WAP");
  assert.equal(cleanName("Ni66as in  Trouble"), "In Trouble");
  assert.equal(franchiseAbbrev(11, "NIGG"), "KAB");
  assert.equal(publicSeasonName(USER_PUBLIC_NAME, 2020, "Black  Lives"), "Maye Day (2020)");
  assert.equal(publicSeasonName(USER_PUBLIC_NAME, 2024, "Mixon Impossible"), "Mixon Impossible");
});

test("rendered franchise fields and data files omit raw vulgar names", () => {
  const hits: string[] = [];
  for (const file of ["league-all-teams.json", "league-h2h-history.json", "league-trades.json"]) {
    const text = readFileSync(join(root, "data", file), "utf8");
    for (const pattern of RAW_VULGAR) {
      if (pattern.test(text)) hits.push(`${file} still contains ${pattern}`);
    }
    const data = JSON.parse(text) as { teams?: { teamId: number; displayName: string; displayAbbrev: string; history?: { seasons?: { season: number; displayName: string }[] } }[] };
    walkNames(data, file, hits);
    for (const team of data.teams ?? []) {
      const name = franchiseName(team.teamId, team.displayName);
      const abbrev = franchiseAbbrev(team.teamId, team.displayAbbrev);
      assert.equal(RAW_VULGAR.some((pattern) => pattern.test(name) || pattern.test(abbrev)), false, `${team.teamId} ${name}`);
      if (team.teamId === USER_TEAM_ID) {
        assert.equal(team.displayName, USER_PUBLIC_NAME);
        assert.equal(team.displayAbbrev, USER_PUBLIC_ABBREV);
        assert.equal(name, USER_PUBLIC_NAME);
        assert.equal(abbrev, USER_PUBLIC_ABBREV);
      }
      for (const season of team.history?.seasons ?? []) {
        const shown = publicSeasonName(name, season.season, season.displayName);
        assert.equal(RAW_VULGAR.some((pattern) => pattern.test(shown)), false, shown);
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
    for (const pattern of RAW_VULGAR) {
      if (pattern.test(text)) hits.push(`${path} matches ${pattern}`);
    }
  }

  assert.deepEqual(hits, []);
});
