/** Public name for the user's franchise. Historical season names stay on their own aliases. */
export const USER_TEAM_ID = 7;
export const USER_PUBLIC_NAME = "Maye Day";
export const USER_PUBLIC_ABBREV = "MAYE";

/** Raw strings that must never be rendered. Keys are matched after whitespace is collapsed. */
const VULGAR_TO_CLEAN: { test: RegExp; clean: string }[] = [
  { test: /^maye i give you a blowj0b$/i, clean: USER_PUBLIC_NAME },
  { test: /^kabul cocknballs$/i, clean: "Kabul FC" },
  { test: /^the fucking letdowns$/i, clean: "The Letdowns" },
  { test: /^team wet ass pussy$/i, clean: "Team WAP" },
  { test: /^ni66as in trouble$/i, clean: "In Trouble" },
];

const RETIRED_SEASON_NAMES = new Set(["Black Lives"]);

export function collapseName(name: string) {
  return name.replace(/\s+/g, " ").trim();
}

/** Map a known vulgar franchise string onto the app's clean name. */
export function cleanName(name: string) {
  const trimmed = collapseName(name);
  return VULGAR_TO_CLEAN.find((row) => row.test.test(trimmed))?.clean ?? trimmed;
}

export function isRetiredSeasonName(name: string) {
  return RETIRED_SEASON_NAMES.has(collapseName(name));
}

/** A past season's display name, safe to render on its own. */
export function publicSeasonName(currentName: string, season: number, name: string) {
  const current = cleanName(currentName);
  const shown = cleanName(name);
  return isRetiredSeasonName(shown) ? `${current} (${season})` : shown;
}

/** Current franchise name. Team 7 is always Maye Day. */
export function franchiseName(teamId: number, displayName: string) {
  if (teamId === USER_TEAM_ID) return USER_PUBLIC_NAME;
  return cleanName(displayName);
}

/** Current franchise abbreviation. Team 7 is always MAYE. */
export function franchiseAbbrev(teamId: number, abbrev: string) {
  if (teamId === USER_TEAM_ID) return USER_PUBLIC_ABBREV;
  const trimmed = abbrev.trim();
  return trimmed.toUpperCase() === "NIGG" ? "KAB" : trimmed;
}
