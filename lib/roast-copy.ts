/** File abbrevs from outside the app directory, rewritten to the ones the app already uses. */
/** A roast card is stale when its score no longer matches the scoreboard. */
export function roastMatchesScoreboard(
  cardHome: number,
  cardAway: number,
  boardHome: number | null | undefined,
  boardAway: number | null | undefined,
) {
  if (boardHome == null || boardAway == null) return false;
  return Math.abs(cardHome - boardHome) < 0.02 && Math.abs(cardAway - boardAway) < 0.02;
}

export function normalizeRoastText(text: string) {
  return text
    .replace(/\bJIGA\b/g, "JAH")
    .replace(/\bKBL\b/g, "KAB")
    .replace(/\bKabul\b(?! FC)/g, "Kabul FC");
}

export type RoastTagKind = "lock" | "upset" | "note";

export interface RoastTag {
  kind: RoastTagKind;
  label: string;
  detail: string;
}

export function parseRoastTag(tag: string): RoastTag {
  const text = normalizeRoastText(tag).trim();
  const lock = /^LOCK:\s*/i.exec(text);
  if (lock) return { kind: "lock", label: "Lock", detail: text.slice(lock[0].length).trim() };
  const upset = /^UPSET ALERT:\s*/i.exec(text);
  if (upset) return { kind: "upset", label: "Upset alert", detail: text.slice(upset[0].length).trim() };
  const toss = /^TOSS-UP:\s*/i.exec(text);
  if (toss) return { kind: "note", label: "Toss-up", detail: text.slice(toss[0].length).trim() };
  return { kind: "note", label: "Note", detail: text };
}
