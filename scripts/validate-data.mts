/**
 * Fail a refresh when data/ disagrees with meta.currentWeek.
 * A missing team or lineup player is printed here, before a page throws.
 *
 *   npm run validate:data
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const REQUIRED = [
  "league-all-teams.json",
  "league-h2h-history.json",
  "league-trades.json",
  "league-rosters.json",
  "player-points-w4-7.json",
  "maye-byes.json",
  "playoff-model.json",
  "projected-standings.json",
  "biggest-wins.json",
  "top-scores.json",
  "week-roasts.json",
] as const;

export type DataFileName = (typeof REQUIRED)[number];
export type DataFiles = Partial<Record<DataFileName, unknown>>;

interface WeeklyRow {
  week?: number;
  provisional?: boolean;
  opponentTeamId?: number;
}

interface ScheduleGame {
  homeTeamId?: number;
  awayTeamId?: number;
  status?: string;
  winner?: string;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value == null || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function asArray(value: unknown): unknown[] | null {
  return Array.isArray(value) ? value : null;
}

function num(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function text(value: unknown) {
  return typeof value === "string" ? value : "";
}

function showPlayer(key: string) {
  const [name, pos, slot] = key.split("|");
  return `${name} (${pos}, ${slot})`;
}

function bagFrom(keys: string[]) {
  const bag = new Map<string, number>();
  for (const key of keys) bag.set(key, (bag.get(key) ?? 0) + 1);
  return bag;
}

function isFinalGame(game: ScheduleGame) {
  const status = (game.status ?? "").toLowerCase();
  const winner = game.winner ?? "";
  return status === "final" || winner === "HOME" || winner === "AWAY";
}

function lineupParts(player: Record<string, unknown>, source: "league" | "rosters") {
  return {
    name: text(player.name),
    pos: text(source === "league" ? player.position : player.pos),
    slot: text(source === "league" ? player.lineupSlot : player.slot),
  };
}

function collectLineup(players: unknown[], source: "league" | "rosters", teamId: number, file: string, errors: string[]) {
  const keys: string[] = [];
  for (const player of players) {
    const row = asRecord(player);
    if (!row) {
      errors.push(`team ${teamId} has a lineup entry that is not an object in data/${file}`);
      continue;
    }
    const parts = lineupParts(row, source);
    if (!parts.name || !parts.pos || !parts.slot) {
      errors.push(`team ${teamId} player ${parts.name || "(no name)"} is missing a name, position, or lineup slot in data/${file}`);
      continue;
    }
    keys.push(`${parts.name}|${parts.pos}|${parts.slot}`);
  }
  return keys;
}

function sameIds(label: string, got: number[], expected: Set<number>, errors: string[]) {
  const seen = new Set<number>();
  for (const id of got) {
    if (seen.has(id)) errors.push(`${label} lists team ${id} more than once`);
    seen.add(id);
    if (!expected.has(id)) errors.push(`${label} team ${id} is not in the league`);
  }
  for (const id of expected) {
    if (!seen.has(id)) errors.push(`${label} is missing team ${id}`);
  }
}

export function validateFiles(files: DataFiles): string[] {
  const errors: string[] = [];
  const present = new Map<DataFileName, unknown>();
  for (const name of REQUIRED) {
    const value = files[name];
    if (value == null) errors.push(`data/${name} is missing`);
    else present.set(name, value);
  }

  const league = asRecord(present.get("league-all-teams.json"));
  if (present.has("league-all-teams.json") && !league) {
    errors.push("data/league-all-teams.json must be a JSON object");
    return errors;
  }
  if (!league) return errors;

  const meta = asRecord(league.meta);
  const currentWeek = num(meta?.currentWeek);
  if (currentWeek == null || !Number.isInteger(currentWeek) || currentWeek < 1) {
    errors.push(`data/league-all-teams.json meta.currentWeek is ${String(meta?.currentWeek)}, expected a week number`);
    return errors;
  }
  const progress = asRecord(meta?.weekInProgress);
  if (!progress) {
    errors.push("data/league-all-teams.json meta.weekInProgress is missing");
    return errors;
  }
  if (progress.week !== currentWeek) {
    errors.push(`data/league-all-teams.json: weekInProgress.week is ${String(progress.week)} but meta.currentWeek is ${currentWeek}`);
  }
  const final = progress.final;
  if (typeof final !== "boolean") errors.push("data/league-all-teams.json weekInProgress.final must be true or false");
  if (typeof progress.label !== "string" || progress.label.trim() === "") {
    errors.push("data/league-all-teams.json weekInProgress.label is empty");
  }

  const teamRows = asArray(league.teams) ?? [];
  if (!asArray(league.teams)) errors.push("data/league-all-teams.json teams is missing");
  const teams: Record<string, unknown>[] = [];
  const teamIds = new Set<number>();
  for (const row of teamRows) {
    const team = asRecord(row);
    const id = num(team?.teamId);
    if (!team || id == null) {
      errors.push("data/league-all-teams.json has a team without a teamId");
      continue;
    }
    if (teamIds.has(id)) errors.push(`data/league-all-teams.json lists team ${id} more than once`);
    teamIds.add(id);
    teams.push(team);
  }

  const schedule = asRecord(league.schedule);
  const weekKey = `week${currentWeek}`;
  const games = asArray(schedule?.[weekKey]);
  if (!schedule || !games || games.length === 0) {
    errors.push(`data/league-all-teams.json: schedule.${weekKey} is missing or empty`);
  }
  const appearances = new Map<number, number>();
  for (const id of teamIds) appearances.set(id, 0);
  const pairing = new Map<number, number>();
  for (const row of games ?? []) {
    const game = asRecord(row) as ScheduleGame | null;
    if (!game) {
      errors.push(`data/league-all-teams.json schedule.${weekKey} has a game that is not an object`);
      continue;
    }
    const home = num(game.homeTeamId);
    const away = num(game.awayTeamId);
    for (const id of [home, away]) {
      if (id == null || !teamIds.has(id)) {
        errors.push(`data/league-all-teams.json schedule.${weekKey} references unknown team ${String(id)}`);
        continue;
      }
      appearances.set(id, (appearances.get(id) ?? 0) + 1);
    }
    if (home != null && away != null) {
      pairing.set(home, away);
      pairing.set(away, home);
    }
    if (typeof final === "boolean") {
      const decided = isFinalGame(game);
      if (final && !decided) {
        errors.push(`data/league-all-teams.json schedule.${weekKey} home ${String(home)} vs away ${String(away)} is not final while weekInProgress.final is true`);
      }
      if (!final && decided) {
        errors.push(`data/league-all-teams.json schedule.${weekKey} home ${String(home)} vs away ${String(away)} is final while weekInProgress.final is false`);
      }
    }
  }
  if (games && games.length > 0) {
    for (const [id, count] of appearances) {
      if (count !== 1) errors.push(`data/league-all-teams.json schedule.${weekKey} lists team ${id} ${count} times`);
    }
  }

  const completedByTeam = new Map<number, number | null>();
  for (const team of teams) {
    const id = num(team.teamId);
    if (id == null) continue;
    const side = asRecord(team[weekKey]);
    const opponent = num(side?.opponentTeamId);
    if (!side || opponent == null) {
      errors.push(`team ${id} has no ${weekKey} opponent in data/league-all-teams.json`);
    } else if (!teamIds.has(opponent)) {
      errors.push(`team ${id} ${weekKey} opponent ${opponent} is not in the league`);
    } else if (pairing.get(id) != null && pairing.get(id) !== opponent) {
      errors.push(`team ${id} ${weekKey} opponent is ${opponent} but schedule.${weekKey} has them against ${pairing.get(id)}`);
    }

    const weekly = asArray(team.weekly) ?? [];
    let completedHere = 0;
    let latest: number | null = null;
    for (const row of weekly) {
      const week = asRecord(row) as WeeklyRow | null;
      const weekNo = num(week?.week);
      if (weekNo == null) continue;
      const opponentId = num(week?.opponentTeamId);
      if (opponentId != null && !teamIds.has(opponentId)) {
        errors.push(`team ${id} weekly Week ${weekNo} opponent ${opponentId} is not in the league`);
      }
      if (week?.provisional === true) {
        if (final === true && weekNo === currentWeek) {
          errors.push(`team ${id} still marks Week ${currentWeek} provisional while weekInProgress.final is true`);
        }
        continue;
      }
      if (weekNo > currentWeek) errors.push(`team ${id} has a completed weekly row for Week ${weekNo}, after meta.currentWeek ${currentWeek}`);
      if (weekNo === currentWeek) completedHere += 1;
      if (latest == null || weekNo > latest) latest = weekNo;
    }
    completedByTeam.set(id, latest);
    if (final === true && completedHere === 0) {
      errors.push(`team ${id} has no completed weekly row for Week ${currentWeek} while weekInProgress.final is true`);
    }
    if (final === true && completedHere > 1) {
      errors.push(`team ${id} has ${completedHere} completed weekly rows for Week ${currentWeek}`);
    }
    if (final === false && completedHere > 0) {
      errors.push(`team ${id} has a completed weekly row for Week ${currentWeek} while weekInProgress.final is false`);
    }
  }

  const latestValues = [...completedByTeam.values()];
  const latest = latestValues.find((week) => week != null) ?? null;
  for (const [id, week] of completedByTeam) {
    if (week !== latest) {
      errors.push(`team ${id} latest completed week is ${week ?? "none"} but the latest completed week is ${latest ?? "none"}`);
    }
  }

  const rosters = asRecord(present.get("league-rosters.json"));
  if (present.has("league-rosters.json") && !rosters) errors.push("data/league-rosters.json must be a JSON object");
  if (rosters) {
    for (const key of Object.keys(rosters)) {
      const id = Number(key);
      if (!Number.isInteger(id) || !teamIds.has(id)) errors.push(`data/league-rosters.json team ${key} is not in the league`);
    }
    for (const team of teams) {
      const id = num(team.teamId);
      if (id == null) continue;
      const listed = asArray(rosters[String(id)]);
      if (!listed) {
        errors.push(`data/league-rosters.json has no roster for team ${id}`);
        continue;
      }
      const rosterBag = bagFrom(collectLineup(listed, "rosters", id, "league-rosters.json", errors));
      const leaguePlayers = [
        ...(asArray(asRecord(team.roster)?.starters) ?? []),
        ...(asArray(asRecord(team.roster)?.bench) ?? []),
        ...(asArray(asRecord(team.roster)?.ir) ?? []),
      ];
      const leagueBag = bagFrom(collectLineup(leaguePlayers, "league", id, "league-all-teams.json", errors));
      const names = new Set([...rosterBag.keys(), ...leagueBag.keys()]);
      for (const key of names) {
        const inRoster = rosterBag.get(key) ?? 0;
        const inLeague = leagueBag.get(key) ?? 0;
        for (let extra = inRoster; extra < inLeague; extra += 1) {
          errors.push(`team ${id} lineup for Week ${currentWeek}: data/league-rosters.json is missing ${showPlayer(key)} from data/league-all-teams.json`);
        }
        for (let extra = inLeague; extra < inRoster; extra += 1) {
          errors.push(`team ${id} lineup for Week ${currentWeek}: data/league-rosters.json lists ${showPlayer(key)}, who is not in data/league-all-teams.json`);
        }
      }
    }
  }

  const model = asRecord(present.get("playoff-model.json"));
  if (present.has("playoff-model.json") && !model) errors.push("data/playoff-model.json must be a JSON object");
  let focusId: number | null = null;
  if (model) {
    focusId = num(model.focusId);
    if (model.currentWeek !== currentWeek) {
      errors.push(`data/playoff-model.json currentWeek is ${String(model.currentWeek)} but meta.currentWeek is ${currentWeek}`);
    }
    if (typeof final === "boolean" && model.currentWeekFinal !== final) {
      errors.push(`data/playoff-model.json currentWeekFinal is ${String(model.currentWeekFinal)} but weekInProgress.final is ${final}`);
    }
    const modelTeams = asArray(model.teams) ?? [];
    const modelIds: number[] = [];
    for (const row of modelTeams) {
      const id = num(asRecord(row)?.id);
      if (id == null) errors.push("data/playoff-model.json has a team without an id");
      else modelIds.push(id);
    }
    sameIds("data/playoff-model.json", modelIds, teamIds, errors);
    if (focusId == null || !teamIds.has(focusId)) {
      errors.push(`data/playoff-model.json focusId ${String(model.focusId)} is not a league team`);
    }
    const modelIdSet = new Set(modelIds);
    for (const row of asArray(model.games) ?? []) {
      const game = asRecord(row);
      const week = num(game?.week);
      for (const id of [num(game?.homeId), num(game?.awayId)]) {
        if (id == null || !teamIds.has(id)) {
          errors.push(`data/playoff-model.json Week ${String(week)} game references team ${String(id)}, which is not in the league`);
        } else if (!modelIdSet.has(id)) {
          errors.push(`data/playoff-model.json Week ${String(week)} game references team ${id}, which is not in playoff-model teams`);
        }
      }
    }
  }

  const byes = asRecord(present.get("maye-byes.json"));
  if (present.has("maye-byes.json") && !byes) errors.push("data/maye-byes.json must be a JSON object");
  if (byes && rosters && focusId != null && teamIds.has(focusId)) {
    const listed = asArray(rosters[String(focusId)]) ?? [];
    const names = new Set(listed.map((player) => text(asRecord(player)?.name)).filter((name) => name !== ""));
    const weeks = asRecord(byes.byes) ?? {};
    for (const [week, value] of Object.entries(weeks)) {
      const namesThisWeek = asArray(value);
      if (!namesThisWeek) {
        errors.push(`data/maye-byes.json Week ${week} is not a list of names`);
        continue;
      }
      for (const name of namesThisWeek) {
        if (typeof name !== "string" || !names.has(name)) {
          errors.push(`data/maye-byes.json Week ${week} lists ${String(name)}, who is not on team ${focusId}'s roster`);
        }
      }
    }
  }

  const roasts = asRecord(present.get("week-roasts.json"));
  if (present.has("week-roasts.json") && !roasts) errors.push("data/week-roasts.json must be a JSON object");
  if (roasts) {
    const roastWeek = num(roasts.week);
    if (latest != null && roastWeek !== latest) {
      errors.push(`data/week-roasts.json week is ${String(roasts.week)} but the latest completed week is ${latest}`);
    }
    for (const row of asArray(roasts.matchups) ?? []) {
      const matchup = asRecord(row);
      for (const id of [num(matchup?.homeTeamId), num(matchup?.awayTeamId)]) {
        if (id == null || !teamIds.has(id)) {
          errors.push(`data/week-roasts.json Week ${String(roastWeek)} matchup references team ${String(id)}, which is not in the league`);
        }
      }
    }
  }

  const standings = asRecord(present.get("projected-standings.json"));
  if (present.has("projected-standings.json") && !standings) errors.push("data/projected-standings.json must be a JSON object");
  if (standings) {
    const ids: number[] = [];
    for (const row of asArray(standings.standings) ?? []) {
      const id = num(asRecord(row)?.teamId);
      if (id == null) errors.push("data/projected-standings.json has a row without a teamId");
      else ids.push(id);
    }
    sameIds("data/projected-standings.json", ids, teamIds, errors);
  }

  const points = present.get("player-points-w4-7.json");
  if (points != null && (typeof points !== "object" || Array.isArray(points))) {
    errors.push("data/player-points-w4-7.json must be an object of player scoring lines");
  }
  for (const name of ["league-h2h-history.json", "league-trades.json", "biggest-wins.json", "top-scores.json"] as const) {
    const value = present.get(name);
    if (value != null && (typeof value !== "object" || value == null)) {
      errors.push(`data/${name} must be a JSON object`);
    }
  }

  return errors;
}

function readJson(root: string, name: string): { value: unknown } | { error: string } {
  const path = join(root, "data", name);
  if (!existsSync(path)) return { error: `data/${name} is missing` };
  try {
    return { value: JSON.parse(readFileSync(path, "utf8")) as unknown };
  } catch (error) {
    const detail = error instanceof Error ? error.message : "parse error";
    return { error: `data/${name} is not valid JSON (${detail})` };
  }
}

export function validateData(root: string): string[] {
  const errors: string[] = [];
  const files: DataFiles = {};
  for (const name of REQUIRED) {
    const loaded = readJson(root, name);
    if ("error" in loaded) errors.push(loaded.error);
    else files[name] = loaded.value;
  }
  if (errors.length > 0) return errors;
  errors.push(...validateFiles(files));

  const snapDir = join(root, "data", "snapshots");
  if (!existsSync(snapDir)) return errors;
  const league = asRecord(files["league-all-teams.json"]);
  const teamIds = new Set(
    (asArray(league?.teams) ?? [])
      .map((row) => num(asRecord(row)?.teamId))
      .filter((id): id is number => id != null),
  );
  for (const name of readdirSync(snapDir)) {
    if (!/^\d+\.json$/.test(name)) {
      errors.push(`data/snapshots/${name} is not a week-number file`);
      continue;
    }
    const loaded = readJson(root, join("snapshots", name));
    if ("error" in loaded) {
      errors.push(loaded.error);
      continue;
    }
    const snapshot = asRecord(loaded.value);
    const ids = [
      ...(asArray(snapshot?.teams) ?? []).map((row) => num(asRecord(row)?.teamId)),
      ...(asArray(snapshot?.results) ?? []).flatMap((row) => [num(asRecord(row)?.homeId), num(asRecord(row)?.awayId)]),
      ...(asArray(snapshot?.adds) ?? []).map((row) => num(asRecord(row)?.teamId)),
    ];
    for (const id of ids) {
      if (id != null && !teamIds.has(id)) errors.push(`data/snapshots/${name} references team ${id}, which is not in the league`);
    }
  }
  return errors;
}

function main() {
  const errors = validateData(process.cwd());
  if (errors.length === 0) {
    console.log("data/ matches meta.currentWeek");
    return;
  }
  console.error(`data/ is inconsistent (${errors.length}):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
}

const entry = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : "";
if (import.meta.url === entry) main();
