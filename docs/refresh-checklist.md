# Refresh checklist

A refresh is a data-only change. Edit files under `data/` and open a PR. Do not push straight to `main`. Vercel deploys production from `main`.

The assistant runs this five times a week:

| Night | What changed on the field |
| --- | --- |
| Thursday | Thursday games have started or finished. Current-week scores and projections move. Rosters may already have the Sunday lineup. |
| Sunday | The slate is live. Scores, live projections, and lineups move. |
| Monday | Monday night is live or just finished. Scores and the provisional label move. |
| Tuesday | The week is final. Box scores, records, roasts. |
| Wednesday | Waivers have processed. Adds, drops, and FAAB move. |

Every one of those refreshes updates the files below **together**. A page that reads an old file will disagree with the scoreboard.

## Files every refresh updates

1. `data/league-all-teams.json` — the scoreboard.
   - `meta.currentWeek`
   - `meta.weekInProgress`: `week`, `final`, `label`, `asOf`
   - `meta.generatedAt` and `meta.updatedAt`
   - `schedule.week{currentWeek}` for the week on the scoreboard. Each game has `homeProjected`, `awayProjected`, `homeCurrentPoints`, `awayCurrentPoints` (a real `0` is a zero), `status` (`in-progress` or `final`), and `winner` (`HOME`, `AWAY`, or `UNDECIDED`).
   - `schedule.week{currentWeek + 1}` when next week's pairings are known. If that key is absent, the scoreboard uses the uncounted games for that week in `data/playoff-model.json`. Do not leave a stale `week8` key in place of the current week. A missing `schedule.week{N}` shows an empty week, not an older week.
   - When the week is final, copy it into `schedule.completed` (or `schedule.weeks1to7`) so the record book includes it, and set `weekInProgress.final` to `true`.
   - Each team: `record`, `pointsFor`, `pointsAgainst`, `rank`, `playoffSeed`, the `weekly` row for that week, `week{N}` (opponent and projections), `roster` (starters, bench, IR, lineup slot, injury, bye, `percentOwnedEspnWide`), and `recentTransactions`.
   - Optional roster fields the lineup table already reads, when the pull has them: `projection`, `score`, `opponent`, `gameStatus`, `opponentRank`, `percentStarted`, `seasonRank`, `seasonPoints`, `seasonAverage`, `lastPoints`, and `playerId`. Leave a field off rather than inventing it. The table prints `--` until it arrives. `percentOwnedEspnWide` is the ESPN-wide roster rate.
   - Do not invent a result from a score that is still in progress. While `weekInProgress.final` is `false`, the live leader is provisional.

2. `data/league-h2h-history.json` — series, franchise records, and the scope label. Head-to-head pages read this file, not the scoreboard, so a new final has to land here in the same refresh.

3. `data/league-trades.json` — player lines on processed trades: `pointsForNewTeam`, `whoWonIt.bySide` week rows, side `pointsReceived` / `pointsGained`, and `meta.pointsThrough`. Recompute `pointsGained` from the two sides' `totalPointsForNewTeam` in the same refresh. Do not leave a `spanNote` or `week8Take` that describes a partial week after that week's rows are in the file. The app grades who won from `whoWonIt.bySide` totals (even inside 10 points) and ignores a stale `pointsGained`. Offers, declines, and vetoes stay counts only. Only `accepted`, `processed`, and `upheld` rows are completed trades.

4. `data/league-rosters.json`, `data/player-points-w4-7.json`, and `data/maye-byes.json` — the roster outlook, together with each team's `roster` in `data/league-all-teams.json`.
   - The team page does not show a Weeks 4–7 player grade or points-per-game list. Do not put that sample back on the roster outlook. The rest-of-season letter is the ESPN team projection, not that file.
   - For every team, `league-rosters.json` and `roster` (starters, bench, and IR) list the same players for `meta.currentWeek`: the same name, position, and lineup slot.
   - Every name in `maye-byes.json` is still on the focus roster (team 7). Remove a name when that player is dropped.

5. `data/playoff-model.json` — projections for every remaining week (weeks 9–14 until those weeks are played). Mark a finished game `counted: true` and set `homeCurrent` / `awayCurrent`. Update team `wins`, `losses`, and `pf`. Update `biasNote` when the sample window moves (it is the sentence on the simulator). Update `presets` when a named window such as "Weeks 4–7" is no longer the one on the slider. `source` stays the long method note.

6. `data/projected-standings.json` — playoff odds, expected record, expected points, average seed, and `asOf`. The playoff table and the odds-movement number read this file.

7. Transactions — `teams[].recentTransactions` inside `data/league-all-teams.json`. The waivers page is that list, newest first. Types are `waiver`, `add`, and `drop`. Do not add a second transactions file unless this array is removed in the same refresh.

8. `data/biggest-wins.json` and `data/top-scores.json` — all-time single-game lists. A new final that belongs on either list has to be written here or the history page lags the scoreboard. A week that is not final stays in `pending`.

9. `data/snapshots/<week>.json` — written at the **end** of the refresh, after the files above match the scoreboard. See below. The next refresh diffs against the newest numbered file. Until one exists, Scores, Playoffs, and power rankings say there is no earlier snapshot.

10. `data/week-roasts.json` — Tuesday, when the week closes and the roast is approved. Set `week` to that completed week and include every matchup. Other nights leave the file. Its `week` stays the latest completed week, which is behind `meta.currentWeek` until `weekInProgress.final` is `true`. The scores page hides a roast whose `week` is not `meta.currentWeek`.

Team names in prose come from `lib/names.ts`. Team 7 stays `Maye i give you a blowj0b`. Do not put another franchise's raw ESPN name in a roast or a snapshot. Snapshots store team ids, not names.

## Current week

`meta.currentWeek` is the week on the scoreboard. `meta.weekInProgress` describes that same week:

- `week` equals `meta.currentWeek`.
- `final` is `true` only after the week is closed, and `false` while it is unplayed or live.
- `label` is a non-empty sentence, such as `Week 9 not started` or `Week 8 final`.

`data/playoff-model.json` uses the same pair: `currentWeek` and `currentWeekFinal`.

While `final` is `false`:

- `schedule.week{currentWeek}` is that week's slate. A game that is not over keeps `winner` as `UNDECIDED`.
- No team has a completed `weekly` row for `currentWeek`. A `provisional: true` row is allowed while the week is live.
- `week-roasts.json` stays on the latest completed week.

When `final` is `true`:

- Every game in `schedule.week{currentWeek}` is final.
- Every team has one completed `weekly` row for `currentWeek`.
- That week is also in `schedule.completed` once it is no longer the current week (weeks 1–7 stay in `schedule.weeks1to7`).
- `week-roasts.json` `week` is `currentWeek`.

Every team id in the playoff model, the roast file, the projected standings, and `schedule.week{currentWeek}` is a team in `league-all-teams.json`. Every league team appears once on that schedule and has a `week{currentWeek}` opponent who is the team on the other side of that game.

## How to write a snapshot

A snapshot is the board you just published. It is not a guess at last week.

From the repo root, after the data files are saved:

```bash
node --experimental-strip-types scripts/write-snapshot.mts
```

That writes `data/snapshots/<meta.currentWeek>.json`. The block below is the shape. The script fills every value from the files. Do not copy these sample numbers into a snapshot:

```json
{
  "week": 8,
  "asOf": "2026-11-03T09:09:25-05:00",
  "teams": [
    { "teamId": 1, "projectedRank": 1, "playoffOdds": 0.9996, "powerRank": 2 }
  ],
  "results": [
    { "week": 8, "homeId": 7, "awayId": 8, "winnerId": 7 }
  ],
  "adds": [
    { "teamId": 1, "date": "2026-10-31", "type": "waiver", "added": ["Player (POS, NFL)"], "dropped": ["Player (POS, NFL)"] }
  ]
}
```

- `teams` is every franchise: projected rank and playoff odds from `data/projected-standings.json`, power rank from the all-play order.
- `results` is every final already on the scoreboard (`winnerId` set).
- `adds` is the waiver and add feed (`waiver` and `add` only).
- The file name is the week number: `8.json`, not `week-8.json`. The highest number is the one the app diffs against.
- Do not hand-edit a rank or an odds figure. If the script is wrong, fix the data file it reads and run it again.

The following refresh updates the live files first, so the app can show who moved, which finals are new, and which adds were not on this snapshot. Then it writes a new snapshot for the week it just published.

## Verify

From the repo root, before opening the data PR:

```bash
npm run validate:data
npm run lint
npm test
npm run build
```

`npm run validate:data` checks the files above against `meta.currentWeek`. It prints the file, the week, and the team or player that does not match. A missing lineup player, an unknown team in the playoff model or a roast, or a bye name who was dropped stops here instead of a 500 on `/teams/7`.

`npm test` reads `meta.currentWeek` from these files. `/teams/7` must return 200 with the current roster grade. Fix any line `validate:data` prints and run it again. Production deploys from `main`.

## What a refresh does not change

Code, copy thresholds, and colors. If a label still has a week number baked into a component, move that string into one of the files above before the refresh. `biasNote`, `presets`, `meta.pointsThrough`, `meta.currentWeek`, and `meta.weekInProgress` are the ones that used to live in components.
