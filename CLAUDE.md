# AI build-out dashboard

A static, single-page dashboard about the AI and compute build-out: hyperscaler capex, data-centre GW, neoclouds, training compute, token deflation, OpenAI/Anthropic revenue, METR time horizons, GPU rental rates, and CDS credit stress. You open `index.html` directly (`xdg-open index.html`). There is no build step, server or dependencies.

## Files

| File | What's in it |
|---|---|
| `data.js` | **Every number the charts use**, plus `UPDATED`, the `SECTIONS` registry (as-of date, refresh cadence, sources per card) and `EVENTS` (upcoming refresh triggers). |
| `index.html` | Layout, CSS and the **written text**: headline tiles, tables, notes, takeaways, sources. Tiles quote numbers too, so keep them in sync with `data.js`. |
| `charts.js` | SVG chart code, tooltips, and the "data as of" stamps. It should rarely need changing during a data refresh. |
| `check.sh` | Prints a freshness report, checks for JS errors, and writes light and dark screenshots to `.check/`. |
| `.claude/skills/update-dashboard/SKILL.md` | The refresh runbook. Use it whenever asked to "update the numbers". |

## Conventions

- Every card has `data-section="<id>"` matching a key in `SECTIONS`. When you refresh a card, set its `asOf` to the date you verified the data, not the source's date.
- Honesty over polish. Mark estimates, projections and single-source or derived figures, both in the data (`E` labels, hollow markers, `der` flags) and in the text. Never present a projection as a forecast. Flag source conflicts instead of picking silently.
- Prefer primary sources (filings, IR, METR and Epoch data files) over aggregators. If only a secondary source exists, say so in the card.
- Colours come from the existing palette variables (`--s1..--s4`, `--neutral`; status `--st-*` only for credit state, always with an icon and label). Don't invent hex values.
- After any change, run `./check.sh`, then look at `.check/light.png` and `.check/dark.png` (crop to the changed section) before reporting.
- Commit each refresh with git, one commit per refresh, with a message listing the sections touched and the headline changes.
