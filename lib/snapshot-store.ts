import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { latestSnapshotName, type SnapshotFile } from "./snapshot.ts";

/** Newest `data/snapshots/<week>.json`, or null when the folder is missing or empty. */
export function loadLatestSnapshot(): SnapshotFile | null {
  const dir = join(process.cwd(), "data", "snapshots");
  let names: string[];
  try {
    names = readdirSync(dir);
  } catch {
    return null;
  }
  const name = latestSnapshotName(names);
  if (!name) return null;
  const raw = JSON.parse(readFileSync(join(dir, name), "utf8")) as SnapshotFile;
  if (!raw || !Array.isArray(raw.teams)) return null;
  return raw;
}
