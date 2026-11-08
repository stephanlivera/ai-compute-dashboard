# AI compute dashboard

A single-page, static dashboard about the AI and compute build-out. It covers:

- hyperscaler capex and cloud backlog
- can they pay for it: capex against operating cash flow, free cash flow, depreciation and leases
- data-centre gigawatts
- Oracle and the neoclouds
- frontier training compute
- Nvidia data-centre revenue by quarter, and its rivals
- token deflation and frontier list prices
- demand you can count: tokens processed, users, business adoption
- OpenAI and Anthropic revenue
- METR time horizons and the benchmarks after it
- GPU rental rates
- CDS credit stress
- the circular-deals map: vendor money into the labs vs the compute they've committed to buy
- the power constraint: PJM capacity prices, turbines, queues

Live at https://stephanlivera.github.io/ai-compute-dashboard/ (GitHub Pages, redeploys on every push to `master`). To view it locally, open `index.html` in a browser. There's no build step and nothing to install.

- `data.js` holds every number, plus a per-section "as of" date and its sources.
- `charts.js` draws the SVG charts.
- `check.sh` reports which sections are stale and takes screenshots (it needs Chromium).

Every card shows when its data was last checked. Estimates, projections, single-source figures and values read off charts are marked as such. This is not investment advice. Check the primary sources before quoting a figure.
