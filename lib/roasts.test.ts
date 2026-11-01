import assert from "node:assert/strict";
import test from "node:test";
import { TEAMS } from "./league";
import { seasonName } from "./h2h";
import { normalizeRoastText, parseRoastTag, WEEK_ROASTS } from "./roasts";

const BANNED = /blowj0b|cocknballs|fucking|wet ass pussy|ni66as/i;

test("normalizeRoastText uses the app names", () => {
  assert.equal(normalizeRoastText("Kabul and KBL lead, but JIGA is favored"), "Kabul FC and KAB lead, but JAH is favored");
  assert.equal(normalizeRoastText("Kabul FC's Thursday"), "Kabul FC's Thursday");
  assert.equal(normalizeRoastText("Maye i give you a blowj0b is 2-5"), "Maye Day is 2-5");
});

test("parseRoastTag splits Lock and Upset alert", () => {
  assert.deepEqual(parseRoastTag("LOCK: Maye Day, favored by 26.8."), {
    kind: "lock",
    label: "Lock",
    detail: "Maye Day, favored by 26.8.",
  });
  assert.deepEqual(parseRoastTag("UPSET ALERT: JIGA is favored by only 14.6."), {
    kind: "upset",
    label: "Upset alert",
    detail: "JAH is favored by only 14.6.",
  });
});

test("week 8 roast cards use directory names", () => {
  assert.ok(WEEK_ROASTS);
  assert.equal(WEEK_ROASTS.week, 8);
  assert.equal(WEEK_ROASTS.matchups.length, 5);
  const names = WEEK_ROASTS.matchups.flatMap((m) => [m.home.name, m.away.name]);
  assert.ok(names.includes("Kabul FC"));
  assert.ok(names.includes("Maye Day"));
  assert.ok(names.includes("Jahmyr I Go Again"));
  const abbrevs = WEEK_ROASTS.matchups.flatMap((m) => [m.home.abbrev, m.away.abbrev]);
  assert.ok(abbrevs.includes("KAB"));
  assert.ok(abbrevs.includes("JAH"));
  assert.ok(abbrevs.includes("MAYE"));
  assert.equal(abbrevs.includes("KBL"), false);
  assert.equal(abbrevs.includes("JIGA"), false);
  const labels = WEEK_ROASTS.matchups.map((m) => m.tag.label).sort();
  assert.deepEqual(labels, ["Lock", "Lock", "Lock", "Upset alert", "Upset alert"]);
  for (const m of WEEK_ROASTS.matchups) {
    const blob = `${m.headline} ${m.roast} ${m.projectionLine} ${m.tag.detail} ${m.home.name} ${m.away.name}`;
    assert.equal(BANNED.test(blob), false, blob);
    assert.match(m.projectionLine, /^ESPN projection: /);
    assert.match(m.home.record, /^\d+-\d+/);
    assert.match(m.away.record, /^\d+-\d+/);
  }
  const kabul = WEEK_ROASTS.matchups.find((m) => m.home.abbrev === "KAB");
  assert.equal(kabul?.home.points, 46.42);
  assert.equal(kabul?.away.points, 0);
  assert.match(kabul?.projectionLine ?? "", /Kabul FC 127\.7 vs Easy Peasy Lemon Squeezy 139\.1 \(current 46\.42-0\)/);
});

test("Gerrit's franchise displays as Maye Day", () => {
  const gerrit = TEAMS.find((t) => t.id === 7);
  assert.equal(gerrit?.name, "Maye Day");
  assert.equal(gerrit?.abbrev, "MAYE");
  for (const t of TEAMS) {
    assert.equal(BANNED.test(t.name), false, t.name);
    for (const season of t.history.seasons) assert.equal(BANNED.test(season.name), false, season.name);
  }
  for (const season of [2020, 2021, 2022, 2023, 2024, 2025, 2026]) {
    assert.equal(BANNED.test(seasonName(7, season)), false, seasonName(7, season));
  }
  assert.equal(seasonName(7, 2026), "Maye Day");
});
