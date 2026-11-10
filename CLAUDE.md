# AI build-out dashboard

A static, single-page dashboard about the AI and compute build-out: hyperscaler capex, cloud backlog, capex against cash flow, data-centre GW, neoclouds, training compute, Nvidia and its rivals, token deflation, measured demand (tokens, users, adoption), OpenAI/Anthropic revenue, METR time horizons and newer benchmarks, GPU rental rates, CDS credit stress, the circular-deals map, and the power constraint. You open `index.html` directly (`xdg-open index.html`). There is no build step, server or dependencies (the three typefaces are bundled in `fonts/`).

## Files

| File | What's in it |
|---|---|
| `data.js` | **Every number the charts use**, plus `UPDATED`, the `SECTIONS` registry (as-of date, refresh cadence, sources per card) and `EVENTS` (upcoming refresh triggers, also shown on the page as the "Coming up" strip, so write them for readers). |
| `index.html` | Layout and the **written text**: headline tiles, tables, notes, takeaways, sources. Tiles quote numbers too, so keep them in sync with `data.js`. |
| `styles.css` | All styling: colour and type tokens in `:root` (light and dark), then the components. |
| `fonts/` | Newsreader (headlines), Inter (text, figures, charts) and JetBrains Mono (small labels), as latin-subset woff2 files with their OFL licences. |
| `charts.js` | SVG chart code, tooltips, the "data as of" stamps and the page wiring (theme toggle, chapter nav, the hero spark, the "Coming up" strip). Generic `lineChart()` and `columnChart()` helpers cover most new charts; `drawFlows()` draws the circular-deals map from `FLOWS`. It should rarely need changing during a data refresh. |
| `check.sh` | Prints a freshness report, checks for JS errors, lists chart labels that run outside their chart or overlap each other, and writes `light.png`, `dark.png` (1280 px wide) and `mobile.png` (500 px, the narrowest headless Chromium lays out) to `.check/`. Set `SHOT_H` / `SHOT_H_MOBILE` if the page outgrows the screenshots. |
| `.claude/skills/update-dashboard/SKILL.md` | The refresh runbook. Use it whenever asked to "update the numbers". |

## Conventions

- Every card has `data-section="<id>"` matching a key in `SECTIONS`. When you refresh a card, set its `asOf` to the date you verified the data, not the source's date.
- Honesty over polish. Mark estimates, projections and single-source or derived figures, both in the data (`E` labels, hollow markers, `der` flags) and in the text. Never present a projection as a forecast. Flag source conflicts instead of picking silently.
- Prefer primary sources (filings, IR, METR and Epoch data files) over aggregators. If only a secondary source exists, say so in the card.
- Colours come from the tokens at the top of `styles.css` (`--s1..--s4`, `--neutral` for data; status `--st-*` only for credit state, always with an icon and label; text and surface tokens for everything else). Don't invent hex values, and don't change the series, status or `--surface-1` colours without re-validating the palette in both themes. The page chrome stays neutral so colour belongs to the data.
- Page structure: numbered chapters (`<header class="chapter">` followed by a `.grid` of cards). Inside a card: `h3.card-title`, `p.dek` under a heading, `.kpis` for a strip of stat tiles, `.cols` for a two-column row, `h4` for sub-headings, `ul.note` for commentary, `p.fine` for caveats under a chart or table. Use these classes instead of inline styles (swatch colours are the only inline styles). Figures stay in the sans; the serif is for headlines only.
- After any change, run `./check.sh`. It must report no JS errors and no chart-label problems. Then look at `.check/light.png` and `.check/dark.png` (crop to the changed section) before reporting, and at `.check/mobile.png` after layout changes.
- Commit each refresh with git, one commit per refresh, with a message listing the sections touched and the headline changes.
