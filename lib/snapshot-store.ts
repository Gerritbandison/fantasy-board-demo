import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { latestSnapshotName, priorSnapshotName, type SnapshotFile } from "./snapshot.ts";

function readSnapshot(dir: string, name: string | null): SnapshotFile | null {
  if (!name) return null;
  try {
    const raw = JSON.parse(readFileSync(join(dir, name), "utf8")) as SnapshotFile;
    if (!raw || !Array.isArray(raw.teams)) return null;
    return raw;
  } catch {
    return null;
  }
}

/** Newest `data/snapshots/<week>.json`, or null when the folder is missing or empty. */
export function loadLatestSnapshot(): SnapshotFile | null {
  const dir = join(process.cwd(), "data", "snapshots");
  try {
    return readSnapshot(dir, latestSnapshotName(readdirSync(dir)));
  } catch {
    return null;
  }
}

/**
 * Prior snapshot for week-over-week movement. Prefers `week < currentWeek`, and ignores
 * a fallback file whose `asOf` matches `currentAsOf` (an identical snapshot of the live board).
 */
export function loadPriorSnapshot(currentWeek: number, currentAsOf?: string): SnapshotFile | null {
  const dir = join(process.cwd(), "data", "snapshots");
  let names: string[];
  try {
    names = readdirSync(dir);
  } catch {
    return null;
  }
  const snap = readSnapshot(dir, priorSnapshotName(names, currentWeek));
  if (!snap) return null;
  if (currentAsOf && snap.week === currentWeek && snap.asOf === currentAsOf) return null;
  return snap;
}
