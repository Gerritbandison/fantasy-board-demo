/** Team 7 keeps ESPN's own name. These other raw strings still map to the app's clean names. */
export const USER_TEAM_ID = 7;

/** Raw strings for every franchise except team 7. Matched after whitespace is collapsed. */
const VULGAR_TO_CLEAN: { test: RegExp; clean: string }[] = [
  { test: /^kabul cocknballs$/i, clean: "Kabul FC" },
  { test: /^the fucking letdowns$/i, clean: "The Letdowns" },
  { test: /^team wet ass pussy$/i, clean: "Team WAP" },
  { test: /^ni66as in trouble$/i, clean: "In Trouble" },
];

const RETIRED_SEASON_NAMES = new Set(["Black Lives"]);

/** Raw strings for every franchise except team 7. */
const OTHER_RAW = [/cocknballs/i, /fucking letdowns/i, /wet ass pussy/i, /ni66as/i];

export function hasOtherRawName(value: string) {
  return OTHER_RAW.some((pattern) => pattern.test(value));
}

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

/**
 * Current franchise name. Team 7 uses ESPN's spelling when the pull includes it.
 * Every other franchise goes through the clean-name list.
 */
export function franchiseName(teamId: number, displayName: string, espnName?: string | null) {
  if (teamId === USER_TEAM_ID) {
    const espn = collapseName(espnName ?? "");
    if (espn) return espn;
  }
  return cleanName(displayName);
}

/**
 * Current franchise abbreviation. Team 7 stays MAYE when that is also ESPN's abbreviation,
 * and uses ESPN's own abbreviation when the two differ.
 */
export function franchiseAbbrev(teamId: number, abbrev: string, espnAbbrev?: string | null) {
  const shown = abbrev.trim();
  const espn = (espnAbbrev ?? "").trim();
  if (teamId === USER_TEAM_ID) {
    if (espn && espn.toUpperCase() !== "MAYE") return espn;
    return shown || "MAYE";
  }
  return shown.toUpperCase() === "NIGG" ? "KAB" : shown;
}
