/** Join class names. Client components use this so the Tailwind merge tables stay off the client. */
export function cx(...parts: Array<string | false | null | undefined>) {
  let out = "";
  for (const part of parts) if (part) out += (out ? " " : "") + part;
  return out;
}
