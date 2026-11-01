/** File abbrevs from outside the app directory, rewritten to the ones the app already uses. */
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
