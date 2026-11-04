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
   - Each team: `record`, `pointsFor`, `pointsAgainst`, `rank`, `playoffSeed`, the `weekly` row for that week, `week{N}` (opponent and projections), `roster` (starters, bench, IR, lineup slot, injury, bye), and `recentTransactions`.
   - Do not invent a result from a score that is still in progress. While `weekInProgress.final` is `false`, the live leader is provisional.

2. `data/league-h2h-history.json` — series, franchise records, and the scope label. Head-to-head pages read this file, not the scoreboard, so a new final has to land here in the same refresh.

3. `data/league-trades.json` — player lines on processed trades: `pointsForNewTeam`, side `pointsReceived` / `pointsGained`, and `meta.pointsThrough`. The trade desk must not still say "through Week 7" after the scoreboard has moved on. Offers, declines, and vetoes stay counts only.

4. `data/league-rosters.json`, `data/player-points-w4-7.json`, and `data/maye-byes.json` — team 7's roster outlook. Lineups and bye weeks live here, not in a component.

5. `data/playoff-model.json` — projections for every remaining week (weeks 9–14 until those weeks are played). Mark a finished game `counted: true` and set `homeCurrent` / `awayCurrent`. Update team `wins`, `losses`, and `pf`. Update `biasNote` when the sample window moves (it is the sentence on the simulator). Update `presets` when a named window such as "Weeks 4–7" is no longer the one on the slider. `source` stays the long method note.

6. `data/projected-standings.json` — playoff odds, expected record, expected points, average seed, and `asOf`. The playoff table and the odds-movement number read this file.

7. Transactions — `teams[].recentTransactions` inside `data/league-all-teams.json`. The waivers page is that list, newest first. Types are `waiver`, `add`, and `drop`. Do not add a second transactions file unless this array is removed in the same refresh.

8. `data/biggest-wins.json` and `data/top-scores.json` — all-time single-game lists. A new final that belongs on either list has to be written here or the history page lags the scoreboard. A week that is not final stays in `pending`.

9. `data/snapshots/<week>.json` — written at the **end** of the refresh, after the files above match the scoreboard. See below. The next refresh diffs against the newest numbered file. Until one exists, Scores, Playoffs, and power rankings say there is no earlier snapshot.

10. `data/week-roasts.json` — **Tuesday only**, when the week closes and the roast is approved. Set `week` to the week that just ended and include all five matchups. Other nights leave the previous file alone. The scores page hides a roast file whose `week` is not `meta.currentWeek`.

Team names in prose come from `lib/names.ts`. Team 7 stays `Maye i give you a blowj0b`. Do not put another franchise's raw ESPN name in a roast or a snapshot. Snapshots store team ids, not names.

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

## What a refresh does not change

Code, copy thresholds, and colors. If a label still has a week number baked into a component, move that string into one of the files above before the refresh. `biasNote`, `presets`, `meta.pointsThrough`, `meta.currentWeek`, and `meta.weekInProgress` are the ones that used to live in components.
