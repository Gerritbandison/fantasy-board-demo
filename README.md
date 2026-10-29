# Chicken League · Week 8

**Live:** [https://fantasy-board-demo.vercel.app](https://fantasy-board-demo.vercel.app). Share that link. It's public, needs no login, and works on iPhone.

**Chicken League** is the fantasy football hub for the private ESPN **Chicken** league (2026, week 8). It has matchup previews, standings, power rankings, luck, a record book, and the league's title history. Everything is prerendered from committed JSON, so it deploys to Vercel with **zero secrets**.

| Gerrit's matchup (`/`) | Insights | History | Standings |
| --- | --- | --- | --- |
| ![Maye i give you a blowj0b matchup on iPhone](docs/mobile-home.png) | ![Insights on iPhone](docs/mobile-insights.png) | ![History on iPhone](docs/mobile-history.png) | ![Standings on iPhone](docs/mobile-standings.png) |

![Maye i give you a blowj0b matchup on desktop](docs/desktop-home.png)

## Pages

| Route | What it shows |
| --- | --- |
| `/` | Gerrit's **Maye i give you a blowj0b** (team 7, shown under its real ESPN name) vs Dimes McSorley. A projected **scorecard** comes first, then the **matchup preview** (story, must-win, key edges, history note) and a **tale of the tape**. The tape compares projection, points for, PF rank, weekly average, last-3 average, best and worst week, weekly swing, points against, and close-game record. Below that are **weekly scoring** (weeks 1–7 plus a dashed week 8 projection, with the opponent overlaid), team story and scouting report, the starters' injury report, head-to-head lineups, and bench/IR. |
| `/bibis` | Kyle's (KASE) **Bibi's Boys** vs Chewy's Warriors, same layout. |
| `/standings` | League table with record, PF/PA, differential, PF rank, and a **luck** badge (Lucky / Even / Unlucky). A labelled playoff line sits after seed 8. |
| `/insights` | League hub with week 8 previews, **storylines** (league pulse), **power rankings**, the **luck meter**, points-for and **toughest-schedule** (points against) bars, and a **record book**. The record book has high scores, closest games, bad beats, and close-game records. Last come **boom or bust** (weekly low/median/high) and team form cards with last-3 averages. |
| `/history` | The **mid-seed champions** pattern with each champion's seed, a **title timeline** for 2022–2025, the **trophy case** (titles and finals), and **franchise arcs** for Maye i give you a blowj0b, Bibi, Chewy and Dimes with a season-by-season strip. |
| `/matchups` | "Scores": the featured week 8 games with projections. It's in the desktop nav only. |
| `/live` | The original polling board, which can read a public ESPN league (optional, not in the nav). |

On phones the nav is a five-tab bottom bar (Maye · Bibi · Standings · Insights · History) that respects iPhone safe areas. From `md` up it moves into the navy top bar. On `lg` screens the matchup pages offer **TV mode**, which goes full screen. Layouts are checked for horizontal overflow at 320, 390, and 1440 px.

## Design system

- **Palette:** light field background (`field`), white cards, a navy app bar and scorecard (`navy`), turf green as the primary (`turf`), gold for leaders and champions (`gold`), and red for losses and injuries (`loss`). Each team has its own avatar color. The tokens are in `app/globals.css`, and the team colors are in `lib/intel.ts`.
- **Type:** Barlow Condensed for scores, headings, and numbers. Barlow for text. Team names are never upper-cased, so the `0` in `blowj0b` stays distinct from an `O`.
- **Primitives:** `components/league/ui.tsx` holds `Card`, `PageHeader`, `SectionHeading`, `TeamAvatar`, `Pill`, `Stat`, `LuckBadge`, and `ResultChip`. `components/league/trail.tsx` holds `ScoreTrail`, `WeekStrip`, and `MiniTrail`. Every trail shares one y-scale, so they compare directly.

## Data

Two committed files. Other teams use sanitized display names (keep them that way). Gerrit's team 7 uses its real ESPN name, `Maye i give you a blowj0b`, at the owner's request:

- [`data/league-snapshot.json`](data/league-snapshot.json) holds the current week's standings, the two featured matchups with starters and bench, and the power list.
- [`data/league-intel.json`](data/league-intel.json) holds champions, the all-time list, franchise arcs with `weekly2026` scores, the luck index, matchup briefs, league pulse, and week 8 projections.

How the code uses them:

- `lib/league.ts` types the snapshot and maps each matchup page to its focus team (`BOARDS`).
- `lib/intel.ts` types the intel and derives the rest: abbreviations and team colors, trail stats (average, median, best, worst, weekly swing), and the de-duplicated game list from the four weekly logs. That game list drives high scores, closest games, bad beats, and close-game records. It also derives the title board, champion seeds, and per-franchise archive hits. Intel's short names, like "Easy Peasy", resolve to snapshot team ids.
- The record book only covers games that appear in the committed weekly logs (24 of the 35 league games through week 7: every game involving the four tracked franchises), and the page says so.
- `GET /api/league` returns the snapshot plus `intel`.
- `GET /api/matchup/golden-goose` and `GET /api/matchup/bibis` return one matchup (the slugs are stable URL ids, not display names) with its `focus` and `opponent` sides. Unknown slugs return `404`.

To roll to a new week, replace both JSON files and redeploy.

### Optional ESPN live path

`/live` and `GET /api/fantasy` keep the original ESPN adapter (`lib/espn.ts`). It defaults to built-in demo data. Set `MOCK_FANTASY=0` with `ESPN_LEAGUE_ID` and `ESPN_TEAM_ID` to read a league that is **viewable to public**. Private leagues need ESPN cookies, which this app never asks for. See `.env.example`. None of this affects the snapshot pages.

## Run locally

```bash
npm i && npm run dev     # http://localhost:43123
npm run build && npm start
```

## Deploy to Vercel

**Production URL:** [https://fantasy-board-demo.vercel.app](https://fantasy-board-demo.vercel.app)

No environment variables are needed. The app is deployed on Vercel under project `fantasy-board-demo` (Hobby team). That project isn't connected to this GitHub repo, so pushes don't redeploy it. Redeploy by uploading a new build (`npx vercel --prod` from a linked checkout). Alternatively, grant the Vercel GitHub app access to `fantasy-board-demo` and link the repo so pushes to `main` redeploy automatically.

## Project structure

```
app/
  layout.tsx                 fonts, metadata, viewport (safe-area aware)
  (league)/layout.tsx        app chrome: navy top bar, bottom tab bar
  (league)/page.tsx          / — Gerrit's matchup (team 7)
  (league)/bibis/            /bibis — Bibi's Boys matchup
  (league)/standings/        /standings
  (league)/insights/         /insights
  (league)/history/          /history
  (league)/matchups/         /matchups (Scores)
  live/                      optional ESPN polling board
  api/league/                GET /api/league
  api/matchup/[slug]/        GET /api/matchup/:slug
  api/fantasy/               optional ESPN/mock feed for /live
components/league/           nav, UI primitives, score charts, matchup page, TV mode
data/league-snapshot.json    week snapshot (lineups, standings)
data/league-intel.json       league intel (history, weekly scores, luck, briefs, pulse)
lib/league.ts                snapshot types + helpers
lib/intel.ts                 intel types + derived stats
lib/espn.ts                  optional public ESPN adapter
```
