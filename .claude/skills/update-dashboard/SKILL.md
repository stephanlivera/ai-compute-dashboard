---
name: update-dashboard
description: Refresh the numbers and statistics in the AI build-out dashboard (~/Work/AI-Compute-Dashboard). Use when asked to update, refresh, or check the dashboard's data, or a specific section of it (capex, GPU rental rates, CDS/credit, lab revenue, METR, token prices, Nvidia, Oracle, neoclouds, GW, power).
---

# Refreshing the AI build-out dashboard

The project is at `~/Work/AI-Compute-Dashboard`. Read `CLAUDE.md` there first for the file layout and conventions.

## 1. Triage: what needs updating

```bash
cd ~/Work/AI-Compute-Dashboard && ./check.sh --quick
```

This lists every section by how overdue it is, along with the upcoming `EVENTS` such as earnings dates. If the user named specific sections, do those. Otherwise refresh everything marked **STALE** or **due soon**, plus any section whose `EVENTS` trigger has passed. Tell the user the plan, with a section list and a rough size, before researching. A full refresh is a big job.

## 2. Research, per section

For each section, check the sources listed in `SECTIONS[id].sources` in `data.js` first, then search for anything newer. Fetch pages in parallel with web-fetch agents, grouped by section. Ask each agent for exact dated figures, the original outlet, and conflicts between sources. What to look for:

| Section | What changes | Where |
|---|---|---|
| `capex`, `share`, `hero` | Latest quarter's capex for MSFT/GOOGL/AMZN/META, full-year guides, first next-year guides (these replace the "E" estimate) | 10-Q, earnings releases and calls |
| `neoclouds`, `oracle` | Oracle RPO, OCI revenue, capex guide. CoreWeave backlog and contracted/active GW. Nebius contracted capacity | IR pages, earnings |
| `nvda` | Append the latest quarter to `NVDA_Q` (and the fiscal year to `NVDA` once complete); AMD, Broadcom AI, TSMC and memory lines in the notes | Nvidia CFO commentary each quarter (FY ends late Jan), AMD/Broadcom 8-Ks, TSMC monthly revenue, SK hynix/Micron results |
| `flop` | New frontier training runs | Epoch "notable AI models" data |
| `deflation` | Epoch's 2025 per-token dataset ends Feb 2025 and isn't updated; refresh the tiles from Epoch's cost-per-question work, Artificial Analysis cost per task, and new flagship launches in `FRONTIER_PX` (3:1 blend of list prices) | epoch.ai/publications/the-plunging-price-of-thought, artificialanalysis.ai, provider pricing pages |
| `lab-revenue` | New run-rate prints, booked revenue (S-1/10-Q once Anthropic is public), company targets | Epoch revenue insight, CNBC/Bloomberg/The Information/FT, SEC filings |
| `autonomy` | METR's TH1.1 page stopped updating in Sep 2026; check for a successor. Append new best results to `BENCH` (GDPval wins + ties, Remote Labor Index); update the ECI table and any new Anthropic Economic Index report | metr.org/blog, epoch.ai/benchmarks/eci, labs.scale.com/leaderboard/rli, OpenAI launch pages, anthropic.com/research |
| `credit` | 5y CDS for CoreWeave, Oracle, Meta, Nvidia, Amazon, Alphabet, Microsoft; CoreWeave bond yields; rating actions | Terminal data if the user provides it; otherwise CNBC, WSJ (Solve), Bloomberg press |
| `gpu` | Silicon Data index levels (append new dated prints to `GPU`, keep history), Ornn OCPI, neocloud/hyperscaler list prices in `GPU_SNAP`, tile figures and hike list; re-pull Vast.ai medians from `console.vast.ai/api/v0/bundles/` (query each `gpu_name` separately, e.g. "H100 SXM", "H100 PCIE", "H100 NVL", "H200", "H200 NVL", "B200", with `type: on-demand`, `rentable: true`, a `limit`, and `verified: {}` for all hosts; take the median of `dph_total / num_gpus` and state the filter and listing counts in the row) | silicondata.com/products/silicon-index/h100 + blog, data.ornn.com, getdeploying.com/gpu-price-trends, provider pricing pages |
| `gw` | Revised 2030 global forecasts | IEA, McKinsey, JLL, Goldman Sachs |
| `power` | Each new PJM auction (append to `PJM`; next: 2029/30, Dec 2026), IMM data-centre cost share, GE Vernova / Siemens turbine backlog, LBNL/EPRI US share, ERCOT large-load queue, EIA retail prices, ballot measures and moratoria | pjm.com BRA reports, monitoringanalytics.com, GE Vernova and Siemens Energy results, eta-publications.lbl.gov, EIA Electric Power Monthly |
| `cashflow` | Append each quarter: update the trailing-12-month row in `CF_CO` (OCF and capex from the cash-flow statement, the companies' own FCF in `fcfTTM`, net cash), the tiles, lease-not-commenced totals, depreciation growth, buybacks and debt raised | SEC XBRL `data.sec.gov/api/xbrl/companyfacts/CIK…json`, 10-Q cash-flow statements and lease/guarantee notes |
| `demand` | Append new Google token figures and OpenRouter volumes to `TOKENS`, Census BTOS (biweekly) and Ramp (monthly) points to `ADOPT`, user milestones in the table | Alphabet releases and calls, census.gov/hfp/btos, ramp.com/data/ai-index, FRED `RPSGENAIUSAGESHAREWORK`, company announcements |
| `circular` | New or revised vendor-lab deals in `FLOWS` (equity in, compute commitments out, status), Nvidia's equity purchases and guarantees from its 10-Q | Anthropic/OpenAI filings, Amazon/Microsoft/Nvidia/AMD/Broadcom 10-Qs and 8-Ks |
| `campuses` | New or resized GW-class campuses | Company announcements |

Hard rules:
- **Don't invent numbers.** If nothing newer can be verified, leave the data alone and say so.
- **Keep the history.** Append new points to the time series (`LABS`, `CDS_TS`, `METR`, `FLOP`) instead of overwriting old ones.
- **Mark weak data.** A single-source figure goes in `extra` (lab revenue) or gets `der: 1` (CDS) or a caveat. When two sources conflict, keep the better-sourced number and note the other.
- **Replace estimates with actuals when they land**, for example `CAPEX` 2026 → actual, or a new 2027 guide replacing the illustrative 2027E. Update `CAPEX_EST_FROM` and labels to match.

## 3. Edit

1. Update the constants in `data.js`.
2. Update the matching written text in `index.html`: tiles, tables, notes, the takeaways list and sources. Search `index.html` for the old figure (for example `grep -n '1,080\|1,082' index.html`) to find every place it's quoted.
3. Set `SECTIONS[id].asOf` to today for each section you verified, and set `UPDATED` to today if this was a full refresh.
4. Update `EVENTS`: drop past events and add the next known triggers. The list is shown on the page as the "Coming up" strip, so word each entry for readers.
5. Add any new source links to the Sources card.

## 4. Verify

```bash
./check.sh
```

It must report no JS errors, and its chart-label check must print "none" (it lists labels that run outside a chart or overlap another label; it can't see a label sitting on a line or a dot). View `.check/light.png` and `.check/dark.png`, cropping to each changed section with `magick .check/light.png -crop 1280xH+0+Y out.png`. Check that labels don't sit on marks, axes still fit the new values (for example a CDS above 1,200, a METR horizon above 1 week, or revenue above $1T), and that tiles agree with the charts. Adjust axis ranges in `charts.js` only if values no longer fit.

## 5. Commit and report

```bash
git add -A && git commit -m "Refresh <sections>: <headline changes>"
```

Then give the user a short changelog: each section touched with old → new headline figures, anything checked but unchanged, conflicts or weak sources, and sections still waiting on an event. Include source links. Finally, open the page: `xdg-open index.html`.
