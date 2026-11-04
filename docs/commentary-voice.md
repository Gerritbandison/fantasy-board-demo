# Commentary voice

Weekly copy is a sharp league member calling a week. It is pointed about the score, the record, and the projection. It is not corny, not cartoonish, and not a pile-on about anyone's life.

## Rules

- Open with a stat line. `2-6 and 95 points.` `179.26 to 89.36.`
- Keep the scores, margins, records, and projections. Frame them directly.
- Short declarative sentences. One cut per sentence.
- Roast the fantasy result. Do not use slurs, sexual jokes, emojis, or anything about a real person's life.
- Team names come from `lib/names.ts`. Team 7 stays `Maye i give you a blowj0b`. Use that name as the team name. Do not joke about it.
- Every number comes from the league files. If a rounded claim does not match the file, use the file.

## Branches

`lib/commentary.ts` picks one branch from the facts:

| Branch | When |
| --- | --- |
| projection-collapse | The favorite lost and scored at least 15 below their projection |
| blowout | Margin is at least 25 |
| high-score | Winner scored at least 160 and the margin is under 25 |
| losing-streak | The loser has dropped at least 3 straight and none of the above hit |
| upset | The lower projection won without a 15-point miss |
| close-game | Margin is under 6 |
| result | Anything left, including a game that has not started |

The seed changes the second sentence. It does not change the numbers. `resultCallout` is the line under a matchup score: for a final game it is the result against the projection, not "projected final by X".

## Week 8

`data/week-roasts.json` is the approved Week 8 copy. Two claims in the draft did not match the file and were corrected in that voice: Easy Peasy scored 97.66, not 97, and Maye was favored by 6.9 (128.52 to 121.66), not the lower projection. Bibi's margin is 31.7.

## Next week

Draft cards from the current league file without writing them:

```
node --experimental-strip-types scripts/write-week-roasts.mts
```

Add `--write` only when replacing `data/week-roasts.json` for a new week. Check every number against the scoreboard before committing.
