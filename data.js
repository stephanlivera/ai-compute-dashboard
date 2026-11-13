// =====================================================================
// AI build-out dashboard: ALL DATA LIVES HERE.
// To refresh: update the constants below, bump each touched section's
// `asOf` in SECTIONS, and set UPDATED. See CLAUDE.md and the
// update-dashboard skill (.claude/skills/update-dashboard/SKILL.md).
// Convention: estimates/projections are flagged in-data, never silently.
// =====================================================================

const UPDATED = "2026-11-10"; // date of the last full refresh (drives "today" markers + header)

// Section registry: when each section's data was last verified, how often it
// should be refreshed (days), and where the numbers come from. Rendered as a
// stamp on every card; `./check.sh` lists anything overdue.
const SECTIONS = {
  hero:          { title: "Headline tiles",             asOf: "2026-11-11", every: 90,  consts: ["(tiles in index.html)"], sources: ["Big 4 + Oracle + CoreWeave + Nvidia latest earnings/IR"] },
  capex:         { title: "Hyperscaler capex",          asOf: "2026-11-10", every: 90,  consts: ["CAPEX", "CAPEX_YEARS", "CAPEX_EST_FROM"], sources: ["10-Q/10-K cash flow statements", "earnings-call capex guidance"] },
  share:         { title: "2026 capex share + guides",  asOf: "2026-11-10", every: 90,  consts: ["CAPEX_GUIDES"], sources: ["earnings-call capex guidance"] },
  gw:            { title: "Data-centre GW",             asOf: "2026-11-10", every: 180, consts: ["GW_YEARS", "GW_AI", "GW_NONAI", "FORECASTS_2030"], sources: ["IEA Energy & AI", "McKinsey", "JLL", "Goldman Sachs Research"] },
  neoclouds:     { title: "Oracle & neoclouds table",   asOf: "2026-11-13", every: 30,  consts: ["(table in index.html)"], sources: ["Oracle, CoreWeave, Nebius IR / earnings", "OpenAI commitments: The Information (via SiliconANGLE)"] },
  oracle:        { title: "Oracle capex",               asOf: "2026-11-08", every: 90,  consts: ["ORCL"], sources: ["Oracle 10-Q/10-K, FY guide"] },
  flop:          { title: "Frontier training compute",  asOf: "2026-11-10", every: 90,  consts: ["FLOP", "FLOP_PROJ"], sources: ["https://epoch.ai/data/notable-ai-models"] },
  nvda:          { title: "Nvidia DC revenue",          asOf: "2026-11-13", every: 90,  consts: ["NVDA", "NVDA_Q"], sources: ["Nvidia CFO commentary, each quarter (FY ends late Jan)", "AMD / Broadcom 8-K releases", "TSMC monthly revenue", "SK hynix, Micron results"] },
  deflation:     { title: "Token deflation",            asOf: "2026-11-13", every: 180, consts: ["DEFL", "DEFL_END", "FRONTIER_PX", "(tiles in index.html)"], sources: ["https://epoch.ai/data-insights/llm-inference-price-trends (ends Feb 2025, not updated)", "https://epoch.ai/publications/the-plunging-price-of-thought", "https://artificialanalysis.ai", "provider pricing pages"] },
  "lab-revenue": { title: "OpenAI / Anthropic revenue", asOf: "2026-11-13", every: 30,  consts: ["LABS", "REV_PROJ", "(funding table in index.html)"], sources: ["https://epoch.ai/data-insights/anthropic-openai-revenue", "CNBC / Bloomberg / The Information / FT run-rate reports", "Anthropic S-1", "Bloomberg / Reuters funding-round reports"] },
  autonomy:      { title: "METR + Economic Index",      asOf: "2026-11-10", every: 60,  consts: ["METR", "METR_DOUBLING_DAYS", "AEI", "BENCH"], sources: ["https://metr.org/time-horizons", "https://metr.org/assets/benchmark_results_1_1.yaml", "https://metr.org/blog (model evaluations, Frontier Risk Report)", "https://www.anthropic.com/research (Economic Index)", "https://epoch.ai/benchmarks/eci", "https://labs.scale.com/leaderboard/rli", "OpenAI model launch pages (GDPval)"] },
  credit:        { title: "CDS credit monitor",         asOf: "2026-11-13", every: 7,   consts: ["CDS", "CDS_TS", "CDS_ASOF"], sources: ["Bloomberg/ICE terminal if available", "CNBC, WSJ (Solve data), Bloomberg press reports"] },
  power:         { title: "Power constraint",           asOf: "2026-11-11", every: 90,  consts: ["PJM", "PJM_UNCAPPED", "(tiles + forecast table in index.html)"], sources: ["PJM BRA reports", "Monitoring Analytics (PJM IMM)", "LBNL", "EPRI", "GE Vernova / Siemens Energy results", "EIA Electric Power Monthly", "ERCOT via Texas governor's office"] },
  gpu:           { title: "GPU rental rates",           asOf: "2026-11-13", every: 30,  consts: ["GPU", "GPU_RANGE", "GPU_RESTATE", "GPU_SNAP"], sources: ["https://www.silicondata.com/products/silicon-index/h100", "https://www.silicondata.com/blog", "Vast.ai public marketplace API (snapshot)"] },
  cloud:         { title: "Cloud backlog + demand",     asOf: "2026-11-07", every: 90,  consts: ["(tiles in index.html)"], sources: ["MSFT 10-Q, GOOGL / AMZN 8-K releases + Q3 calls"] },
  cashflow:      { title: "Can they pay for it?",       asOf: "2026-11-08", every: 90,  consts: ["CF_CO", "(tiles + tables in index.html)"], sources: ["10-K / 10-Q cash-flow statements via SEC XBRL (data.sec.gov companyfacts)", "Q3 2026 earnings releases and calls", "10-Q lease and guarantee notes", "S&P Global Ratings, BofA, Reuters/LSEG forecasts"] },
  demand:        { title: "Demand you can count",       asOf: "2026-11-13", every: 30,  consts: ["TOKENS", "ADOPT", "(tiles + users table in index.html)"], sources: ["Alphabet / Microsoft earnings releases and calls, Google I/O", "OpenRouter releases", "https://www.census.gov/hfp/btos/data_downloads", "https://ramp.com/data/ai-index", "FRED: RPSGENAIUSAGESHAREWORK", "OpenAI / Google / Microsoft user announcements", "Menlo Ventures enterprise reports"] },
  campuses:      { title: "GW-class campuses",          asOf: "2026-11-10", every: 90,  consts: ["(table in index.html)"], sources: ["company announcements", "Epoch AI frontier data centers", "Nvidia 8-K (SB Energy guarantees)"] },
  circular:      { title: "Circular deals map",         asOf: "2026-11-13", every: 30,  consts: ["FLOWS", "(side panel in index.html)"], sources: ["Anthropic S-1/A", "Amazon / Microsoft / Nvidia / AMD / Broadcom 10-Qs and 8-Ks", "company releases", "Bloomberg / CNBC / WSJ for reported items"] },
};

// Known upcoming events that should trigger a refresh (approximate; confirm dates).
const EVENTS = [
  { when: "16 Nov 2026",  what: "Lambda's higher GPU list prices take effect (8× B200 $7.69, H100 $4.59)", sections: ["gpu"] },
  { when: "17 Nov 2026",  what: "Nvidia Q3 FY27 results, its first under interim CEO Colette Kress (guide $108B ±2%; equity purchases, cloud agreements, any word on the board inquiry)", sections: ["nvda", "hero", "circular", "credit"] },
  { when: "18–19 Nov 2026", what: "Anthropic IPO prices on 18 Nov and starts trading on 19 Nov (Nasdaq: ANT; range $70–78), per its prospectus", sections: ["lab-revenue", "credit", "circular"] },
  { when: "19 Nov 2026", what: "Census BTOS biweekly release (collected 2–15 Nov)", sections: ["demand"] },
  { when: "before 26 Nov 2026", what: "Jensen Huang's testimony to Congress, as agreed per the House Foreign Affairs chair", sections: ["nvda", "credit"] },
  { when: "late Nov 2026", what: "OpenAI round final close (~$15B raised so far at $1.25T, per CNBC)", sections: ["lab-revenue", "neoclouds", "circular"] },
  { when: "1 Dec 2026", what: "Gemini 4 Argon and Carbon list prices double to $4 / $20", sections: ["deflation"] },
  { when: "8–9 Dec 2026", what: "Fed meeting, after a hot October CPI: the cost of debt for the build-out", sections: ["credit"] },
  { when: "~10 Dec 2026", what: "TSMC November revenue", sections: ["nvda"] },
  { when: "mid-Dec 2026", what: "Ramp AI Index (November data)", sections: ["demand"] },
  { when: "9–15 Dec 2026", what: "PJM capacity auction for 2029/30 (results expected ~22 Dec)", sections: ["power"] },
  { when: "mid-Dec 2026",  what: "Oracle Q2 FY27 results; date not yet announced (RPO, capex guide, free cash flow)", sections: ["neoclouds", "oracle", "hero", "credit", "cashflow"] },
  { when: "late Jan–early Feb 2027", what: "Big 4 Q4 results: first 2027 capex guides, cash flow, token and user updates", sections: ["capex", "share", "hero", "cashflow", "demand"] },
  { when: "Feb 2027", what: "Nebius Q4 results: did ARR pass $7B, two months later than first guided?", sections: ["neoclouds"] },
];

// ---------- Can they pay for it? ----------
// Operating cash flow (OCF) and capex, $B, from 10-K / 10-Q cash-flow statements (SEC XBRL), checked against each company's
// earnings releases. Capex = purchases of property and equipment (Amazon: net of proceeds and incentives, its FCF definition;
// Microsoft: cash additions, excluding finance leases; Meta: excluding finance-lease principal). FCF = OCF − capex (our calculation).
// Microsoft's fiscal year ends in June and Oracle's in May. x = middle of each period; the last row is the trailing 12 months.
// [label, x, OCF, capex]. netCash = cash + securities − debt at the latest quarter, $B. fcfTTM = the companies' own TTM FCF (unrounded inputs).
const CF_CO = [
  { name: "Microsoft", c: "--s1", fcfTTM: 60.0, netCash: 29.0, rows: [["FY16", 2016.0, 33.3, 8.3], ["FY17", 2017.0, 39.5, 8.1], ["FY18", 2018.0, 43.9, 11.6], ["FY19", 2019.0, 52.2, 13.9],
    ["FY20", 2020.0, 60.7, 15.4], ["FY21", 2021.0, 76.7, 20.6], ["FY22", 2022.0, 89.0, 23.9], ["FY23", 2023.0, 87.6, 28.1], ["FY24", 2024.0, 118.5, 44.5],
    ["FY25", 2025.0, 136.2, 64.6], ["FY26", 2026.0, 182.9, 115.9], ["12 mo. to Sep 2026", 2026.25, 195.9, 135.9]] },
  { name: "Alphabet", c: "--s2", fcfTTM: 19.7, netCash: 139.0, rows: [["2016", 2016.5, 36.0, 10.2], ["2017", 2017.5, 37.1, 13.2], ["2018", 2018.5, 48.0, 25.1], ["2019", 2019.5, 54.5, 23.5],
    ["2020", 2020.5, 65.1, 22.3], ["2021", 2021.5, 91.7, 24.6], ["2022", 2022.5, 91.5, 31.5], ["2023", 2023.5, 101.7, 32.3], ["2024", 2024.5, 125.3, 52.5],
    ["2025", 2025.5, 164.7, 91.4], ["12 mo. to Sep 2026", 2026.25, 179.6, 159.8]] },
  { name: "Amazon", c: "--s3", fcfTTM: -42.4, netCash: -66.1, rows: [["2016", 2016.5, 17.2, 6.7], ["2017", 2017.5, 18.4, 10.1], ["2018", 2018.5, 30.7, 11.3], ["2019", 2019.5, 38.5, 12.7],
    ["2020", 2020.5, 66.1, 35.0], ["2021", 2021.5, 46.3, 55.4], ["2022", 2022.5, 46.8, 58.3], ["2023", 2023.5, 84.9, 48.1], ["2024", 2024.5, 115.9, 77.7],
    ["2025", 2025.5, 139.5, 128.3], ["12 mo. to Sep 2026", 2026.25, 168.3, 210.7]] },
  { name: "Meta", c: "--s4", fcfTTM: 28.7, netCash: -1.2, rows: [["2016", 2016.5, 16.1, 4.5], ["2017", 2017.5, 24.2, 6.7], ["2018", 2018.5, 29.3, 13.9], ["2019", 2019.5, 36.3, 15.1],
    ["2020", 2020.5, 38.7, 15.1], ["2021", 2021.5, 57.7, 18.6], ["2022", 2022.5, 50.5, 31.2], ["2023", 2023.5, 71.1, 27.0], ["2024", 2024.5, 91.3, 37.3],
    ["2025", 2025.5, 115.8, 69.7], ["12 mo. to Sep 2026", 2026.25, 133.1, 104.4]] },
  { name: "Oracle", c: "--neutral", fcfTTM: -28.7, netCash: -88.3, rows: [["FY16", 2015.92, 13.7, 1.2], ["FY17", 2016.92, 14.1, 2.0], ["FY18", 2017.92, 15.4, 1.7], ["FY19", 2018.92, 14.6, 1.7],
    ["FY20", 2019.92, 13.1, 1.6], ["FY21", 2020.92, 15.9, 2.1], ["FY22", 2021.92, 9.5, 4.5], ["FY23", 2022.92, 17.2, 8.7], ["FY24", 2023.92, 18.7, 6.9],
    ["FY25", 2024.92, 20.8, 21.2], ["FY26", 2025.92, 32.0, 55.7], ["12 mo. to Aug 2026", 2026.17, 46.9, 75.7]] },
];

// Capex guidance strings shown in the "Who's spending" table (same order as COS).
const CAPEX_GUIDES = ["~$170B", "$195–205B", "~$220B", "$135–145B"];

const COS = [
  { name: "Microsoft", c: "--s1" },
  { name: "Alphabet",  c: "--s2" },
  { name: "Amazon",    c: "--s3" },
  { name: "Meta",      c: "--s4" },
];
const CAPEX_YEARS = [2016,2017,2018,2019,2020,2021,2022,2023,2024,2025,2026,2027];
const CAPEX = [ // $B, approx calendar year; 2026 = guide midpoint; 2027 = illustrative estimate
  [ 9,  8, 12, 14, 15, 21, 24, 41, 76, 118, 170, 210], // Microsoft (incl. finance leases from 2023)
  [10, 13, 25, 24, 22, 25, 31, 32, 53,  91, 200, 260], // Alphabet
  [ 7, 12, 13, 17, 40, 61, 64, 53, 83, 128, 220, 290], // Amazon (cash capex)
  [4.5, 7, 14, 15, 15, 19, 31, 28, 39,  72, 140, 180], // Meta
];
const CAPEX_EST_FROM = 2027;
const ORCL = { labels: ["FY21","FY22","FY23","FY24","FY25","FY26","FY27E"], vals: [2.1,4.5,8.7,6.9,21.2,55.7,92.5], est: 6 }; // 10-K cash capex; FY27E = guide midpoint
const NVDA = { labels: ["FY20","FY21","FY22","FY23","FY24","FY25","FY26"], vals: [3.0,6.7,10.6,15.0,47.5,115.2,193.7] }; // FY26 = sum of the four quarters below
// Nvidia data-centre revenue by quarter, $B, from its CFO commentary. [fiscal quarter, quarter end, total, compute, networking]
// Q2 FY27 has no compute / networking split (Nvidia switched to hyperscale $48.7B vs other $40.3B).
const NVDA_Q = [
  ["Q1 FY25", "Apr 24", 22.563, 19.392, 3.171], ["Q2 FY25", "Jul 24", 26.272, 22.604, 3.668], ["Q3 FY25", "Oct 24", 30.771, 27.644, 3.127],
  ["Q4 FY25", "Jan 25", 35.580, 32.556, 3.024], ["Q1 FY26", "Apr 25", 39.112, 34.155, 4.957], ["Q2 FY26", "Jul 25", 41.096, 33.844, 7.252],
  ["Q3 FY26", "Oct 25", 51.215, 43.028, 8.187], ["Q4 FY26", "Jan 26", 62.314, 51.334, 10.980], ["Q1 FY27", "Apr 26", 75.246, 60.4, 14.8],
  ["Q2 FY27", "Jul 26", 89.023, null, null],
];
const FLOP = [
  { m: "GNMT",           x: 2016.7, y: 6.6e21 },
  { m: "AlphaGo Zero",   x: 2017.8, y: 6.5e20 }, // Epoch now counts direct training compute only (was 3.4e23 with self-play data generation)
  { m: "GPT-3",          x: 2020.4, y: 3.1e23 },
  { m: "PaLM",           x: 2022.3, y: 2.5e24 },
  { m: "GPT-4",          x: 2023.2, y: 2.1e25 },
  { m: "Gemini 1.0 Ultra", x: 2023.9, y: 5.0e25, spec: 1 }, // Epoch confidence "Speculative"
  { m: "Llama 3.1 405B", x: 2024.6, y: 3.8e25 },
  { m: "Grok 3",         x: 2025.13, y: 3.5e26 },
  { m: "GPT-4.5",        x: 2025.16, y: 3.8e26 },
  { m: "Grok 4",         x: 2025.52, y: 5.0e26, spec: 1 }, // Epoch confidence "Speculative"
  { m: "GPT-6 Astra",    x: 2026.67, y: 9.4e26 },          // Epoch "Likely", CI ~5e26–2e27
];
// spec: 1 = Epoch rates the estimate "Speculative" (hollow marker). Values from Epoch's notable-models CSV, 10 Nov 2026.
const FLOP_PROJ = [{ x: 2025.13, y: 3.5e26 }, { x: 2030, y: 2e29 }];
// Global DC capacity, GW. 2015–2024 modeled (IEA TWh ÷ 8,760 h ÷ ~75% utilisation; AI share from IEA accelerated-server trend).
// 2025 & 2030 = McKinsey (AI 44→156, non-AI 38→64). 2026–2029 interpolated.
const GW_YEARS = [2015,2016,2017,2018,2019,2020,2021,2022,2023,2024,2025,2026,2027,2028,2029,2030];
const GW_AI    = [0.5,0.7,1,1.5,2,3,4,6,12,25,44,66,88,110,133,156];
const GW_NONAI = [30,31,32,32.5,33,34,35,36,36.5,37,38,42,47,52,58,64];
const GW_TODAY = 2026, GW_FORECAST_FROM = 2026;
const FORECASTS_2030 = [
  { who: "Goldman Sachs (capacity, Nov 2026; press reports)", gw: 273 }, // 2 Nov 2026 note, seen only in secondary write-ups; was 217 in Jul 2026
  { who: "McKinsey (capacity)", gw: 219 },
  { who: "JLL (capacity)", gw: 200 },
];
// PJM capacity auction (Base Residual Auction), RTO clearing price, $/MW-day (UCAP), by delivery year (June–May).
// [delivery year, $/MW-day, note, at price cap?, data-centre-attributable charges $bn per the Independent Market Monitor]
// The IMM's figures come from its own no-data-centre counterfactual, which PJM doesn't endorse. Collar runs through 2029/30.
const PJM = [
  ["2024/25", 28.92, "Results Feb 2023", 0, null],
  ["2025/26", 269.92, "Jul 2024. Zonal prices up to $466 (BGE) and $444 (Dominion)", 0, 9.33],
  ["2026/27", 329.17, "Jul 2025. Cleared at the price cap; 209 MW short of the reliability target", 1, 7.27],
  ["2027/28", 333.44, "Dec 2025. At the cap; ~6.5 GW short; $16.4bn total cost", 1, 6.50],
  ["2028/29", 325.00, "Jul 2026. At the cap in every zone; 6.8 GW short; $16.4bn total cost", 1, 6.27],
];
const PJM_UNCAPPED = 554.7; // 2028/29 clearing price without the collar (≈$29.7bn total), per the auction report / IMM
// METR Time Horizon 1.1 results file (benchmark_results_1_1.yaml). Minutes.
// [model, release date, p50, p50 CI low, p50 CI high, p80]
const METR = [
  ["GPT-2", "2019-02-14", 0.054, 0.010, 0.142, 0.0128],
  ["davinci-002 (GPT-3)", "2020-05-28", 0.144, 0.093, 0.221, 0.056],
  ["GPT-3.5 Turbo Instruct", "2022-03-15", 0.60, 0.26, 1.12, 0.255],
  ["GPT-4", "2023-03-14", 3.99, 1.93, 8.00, 0.89],
  ["GPT-4 (1106)", "2023-11-06", 4.04, 1.87, 8.44, 0.78],
  ["Claude 3 Opus", "2024-03-04", 3.95, 1.71, 8.76, 0.64],
  ["GPT-4 Turbo", "2024-04-09", 3.73, 1.98, 6.74, 0.93],
  ["GPT-4o", "2024-05-13", 6.99, 4.00, 12.91, 1.27],
  ["Claude 3.5 Sonnet (Jun)", "2024-06-20", 11.4, 5.49, 22.4, 1.67],
  ["o1-preview", "2024-09-12", 20.3, 11.7, 33.4, 4.42],
  ["Claude 3.5 Sonnet (Oct)", "2024-10-22", 20.5, 10.1, 40.8, 2.60],
  ["o1", "2024-12-05", 38.8, 21.2, 65.0, 7.09],
  ["Claude 3.7 Sonnet", "2025-02-24", 60.4, 33.0, 104.2, 12.1],
  ["o3", "2025-04-16", 119.7, 74.6, 190.9, 30.0],
  ["Claude 4 Opus", "2025-05-22", 100.4, 60.0, 163.5, 20.4],
  ["Claude 4.1 Opus", "2025-08-05", 100.5, 59.3, 159.5, 23.5],
  ["GPT-5", "2025-08-07", 203.0, 112.6, 405.6, 38.3],
  ["Gemini 3 Pro", "2025-11-18", 224.3, 139.6, 379.2, 54.1],
  ["GPT-5.1-Codex-Max", "2025-11-19", 223.7, 134.3, 396.2, 50.6],
  ["Claude Opus 4.5", "2025-11-24", 293.0, 161.7, 623.7, 49.4],
  ["GPT-5.2", "2025-12-11", 352.2, 198.1, 815.2, 66.0],
  ["GPT-5.3-Codex", "2026-02-05", 349.5, 194.9, 816.4, 54.7],
  ["Claude Opus 4.6", "2026-02-05", 718.8, 316.7, 3633.8, 69.9],
  ["Gemini 3.1 Pro", "2026-02-19", 384.1, 233.5, 694.8, 89.8],
  ["GPT-5.4", "2026-03-05", 341.7, 186.6, 768.8, 53.9],
  ["Claude Mythos Preview (early)", "2026-04-07", 1044.8, 508.9, 3304.3, 185.9],
];
const METR_DOUBLING_DAYS = 128.744; // METR, from 2023 on (excludes points above 16 h)
const AEI = { // Anthropic Economic Index: automation / augmentation / other, % of conversations
  chat: [["Automation", 45, "--s1"], ["Augmentation", 52, "--s3"], ["Other", 3, "--neutral"]],
  api:  [["Automation", 77, "--s1"], ["Augmentation", 12, "--s3"], ["Other", 11, "--neutral"]],
};
// After METR's TH1.1 saturated: two task-success series, % of tasks, best model at each date. [date, %, model / note, hollow?]
// GDPval (OpenAI): expert-graded work products from 44 occupations; % where the model's output wins or ties against an industry
// expert's. Sep 2025 figure is from the paper; later ones from OpenAI's own launch pages. OpenAI switched to Elo scores after GPT-5.5.
// Remote Labor Index (Scale AI + CAIS): % of 240 real freelance projects completed to a standard a client would accept (human-graded).
const BENCH = [
  { name: "GDPval", c: "--s1", pts: [
    ["2025-09-25", 47.6, "Claude Opus 4.1 (GPT-5: 39.0% in the paper)"], ["2025-12-11", 70.9, "GPT-5.2 Thinking (OpenAI launch page)"],
    ["2026-03-05", 83.0, "GPT-5.4 (OpenAI launch page)"], ["2026-04-23", 84.9, "GPT-5.5 (OpenAI launch page; Claude Opus 4.7 80.3% in OpenAI's table). OpenAI reports Elo instead from GPT-5.6 on"]] },
  { name: "Remote Labor Index", c: "--s2", pts: [
    ["2025-10-29", 2.5, "Manus, at launch"], ["2026-07-01", 15.8, "Claude Fable 5 (human-graded; Opus 4.8 8.3%, GPT-5.5 6.3%)"],
    ["2026-11-08", 21.25, "Claude Opus 5.5, leaderboard read 8 Nov (GPT-6 Astra 20.8%, Fable 5.1 17.9%, Gemini 4 Argon 17.1%)"],
    ["2026-11-09", 41.3, "Claude Fable 5.2 at its launch, leaderboard read 10 Nov (human-graded; Anthropic reports the same figure at High effort)"]] },
];
const BENCH_PARITY = 50; // GDPval: 50% wins-or-ties = on par with the experts

// ---------- CDS: update this block with terminal data ----------
// Latest 5y CDS, bps. bps: null = level not published. st = credit state (critical/serious/warning/good/none).
const CDS_ASOF = "2026-11-10";
const CDS = [
  { co: "CoreWeave", bps: 1152, d: "2026-11-10", src: "CNBC earnings preview, 10 Nov (vendor not named); before Q3 results", st: "critical", stLab: "Distress", chg: "~2.9× YoY (from ~393)", note: "Deutsche Bank had a record above 1,289 on 5 Nov (CNBC's 10 Nov piece says a 1,278 close) and ~1,155 on 6 Nov; Markit called 1,164.5 its all-time high. Vendors differ. 9.75% 2031 notes yielded 15.5% on 10 Nov (16.7% on 6 Nov). Q3 (10 Nov): revenue beat, guide raised; ~$46.9B of debt excl. leases ($47.5B principal per the 10-Q) and $4.1B cash at 30 Sep (was ~$35B / $5.5B at 30 Jun). After results: Bloomberg (12 Nov) says the CDS fell sharply but open sources give no level; the 2031 notes traded at 82.25 cents on 12 Nov; shares +24.7% on 11 Nov, −6.9% on 12 Nov" },
  { co: "Oracle", bps: 305, d: "2026-11-05", src: "S&P Global MI (via Benzinga)", st: "serious", stLab: "Priced like junk", chg: "~2.1× vs end-2025 (~145)", note: "CNBC had ~298 on 6 Nov (vendor not named). Solve/WSJ had 288 on 1 Nov; Bloomberg 274 on 28 Oct after Oracle capped outside funding at $20B. Raised the full $20B on 2–4 Nov. Fitch BBB and Moody's Baa2 affirmed 2 Nov; S&P BBB-" },
  { co: "Nvidia", bps: 139, d: "2026-11-06", src: "CNBC (vendor not named)", st: "warning", stLab: "Record, still IG", chg: "+76% in a month", note: "Solve/WSJ had 101 on 1 Nov and S&P GMI 127 in late Oct: vendors differ. Mostly hedging of the AI trade; little Nvidia debt. ICE (via Bloomberg, relayed secondhand) had an intraday high of 144.5 on 12 Nov, the day CEO Jensen Huang resigned after a board inquiry; no close published. Shares −4.3% that day" },
  { co: "Meta", bps: 125, d: "2026-11-03", src: "Yahoo Finance (vendor not named)", st: "warning", stLab: "Record, still IG", chg: "~3× vs end-2025 (~39)", note: "Markit record 114.5 on 22 Oct; Solve/WSJ 108 on 1 Nov. Sold $15B of dollar bonds (3 Nov) and a record €9B euro debut (4 Nov). S&P outlook negative" },
  { co: "Amazon", bps: 100, d: "2026-11-05", src: "S&P Global MI (via Benzinga)", st: "warning", stLab: "Record, still IG", chg: "~2× vs mid-April", note: "Barclays had 81 on 28 Oct" },
  { co: "Alphabet", bps: 92, d: "2026-11-05", src: "S&P Global MI (via Benzinga)", st: "warning", stLab: "Record, still IG", chg: "~2× vs mid-April (47)", note: "€6B euro bond on 2 Nov. Barclays had 80 on 28 Oct" },
  { co: "Microsoft", bps: 53, d: "2026-10-28", src: "Barclays (via Crypto Briefing)", st: "good", stLab: "Rising, strong IG", chg: "~2× over the year", note: "\"Under 60\" per Yahoo Finance on 3 Nov. First bond in nine years: $25B on 29 Oct, ~$115B of orders" },
  { co: "Nebius, IREN, others", bps: null, d: null, src: "", st: "none", stLab: "No liquid CDS reported", chg: "", note: "Watch bond / convertible yields. Shares fell 15–17% on 5 Nov" },
];
// Sparse time series of reported prints. [date, bps, hollow?, note]. Hollow = derived from a reported % change, or (with a note) undated.
// Prints come from different vendors (CNBC, Solve/WSJ, Bloomberg, Markit, S&P GMI), which differ by 10–30 bps.
const CDS_TS = [
  { co: "CoreWeave", c: "--s1", pts: [["2025-10-15", 393, 1], ["2026-07-29", 855], ["2026-10-08", 895, 1], ["2026-10-15", 1038], ["2026-10-16", 1104, 1], ["2026-10-19", 1082], ["2026-11-05", 1289], ["2026-11-06", 1155],
    ["2026-11-09", 1240, 1, "Reported by CNBC before the US open on 9 Nov; the print's date and vendor aren't given"], ["2026-11-10", 1152]] },
  { co: "Oracle", c: "--s2", pts: [["2025-10-19", 77, 1], ["2025-12-31", 145], ["2026-07-24", 215], ["2026-10-08", 256, 1], ["2026-10-15", 282], ["2026-10-19", 315], ["2026-10-28", 274], ["2026-11-01", 288], ["2026-11-05", 305]] },
  { co: "Meta", c: "--s3", pts: [["2025-12-31", 39, 1], ["2026-10-22", 114.5], ["2026-11-01", 108], ["2026-11-03", 125]] },
];

// Lab revenue run-rates, $B. [date, $B, source]. Through 2025 mostly Epoch AI's compiled dataset; 2026 from press reports.
// Anthropic counts gross revenue sold through cloud partners; OpenAI reports net of the partner share.
const REV_PROJ = { end: 2029.0, lo: 1.5, mid: 2, hi: 3 }; // illustrative growth multiples per year
const LABS = [
  { name: "OpenAI", c: "--s1", pts: [
    ["2023-08-29", 1, "The Information"], ["2023-10-10", 1.3, "The Information"], ["2023-12-31", 2, "FT"],
    ["2024-06-12", 3.4, "The Information"], ["2024-08-15", 3.6, "NYT"], ["2024-09-12", 4, "WSJ"], ["2024-12-31", 5.5, "CNBC"],
    ["2025-06-09", 10, "Company (CNBC)"], ["2025-07-30", 12, "Company (CNBC)"], ["2025-08-01", 13, "NYT"],
    ["2025-12-31", 20, "CFO Sarah Friar (Reuters)"], ["2026-02-28", 25, "The Information"], ["2026-06-30", 25, "Flat Feb–Jun (reports)"],
    ["2026-08-13", 40, "Bloomberg"], ["2026-09-30", 50, "FT / CNBC (net basis)"]],
    extra: [["2026-09-29", 70, "Axios/Reuters: ~$70B counted Anthropic's way (gross)"], ["2026-12-31", 70, "Company target: ≥$70B by year-end (Bloomberg)"]] },
  { name: "Anthropic", c: "--s2", pts: [
    ["2024-12-31", 1, "CNBC"], ["2025-03-01", 1.4, "The Information"], ["2025-03-31", 2, "Company (CNBC)"],
    ["2025-05-30", 3, "CNBC"], ["2025-07-01", 4, "The Information"], ["2025-07-29", 5, "Company (Bloomberg)"],
    ["2025-10-21", 7, "Company statement"], ["2025-12-31", 9, "Bloomberg"], ["2026-02-12", 14, "Company (Series G)"],
    ["2026-04-30", 30, "Press reports"], ["2026-05-29", 47, "Company statement"], ["2026-07-31", 65, "Bloomberg / CNBC (investor update)"],
    ["2026-09-30", 71, "Implied by the S-1/A of 10 Nov: the October figure is \"up $10 billion from September 30\""], ["2026-10-31", 81, "Company (S-1/A Amendment No. 2, 10 Nov): \"approximately $81 billion\""]],
    extra: [] },
];

// Token deflation: Epoch AI "LLM inference prices have fallen rapidly but unequally across tasks" (12 Mar 2025).
// Cheapest model at/above each threshold over time. [model, date, USD per 1M tokens (blended, as listed by Epoch)]
const DEFL_END = "2025-02-05"; // last observation in Epoch's dataset
const DEFL = [
  { lab: "Chat", task: "Chatbot Arena Elo ≥ 1186", lvl: "GPT-4 level", c: "--s1", pts: [
    ["GPT-4 (0314)", "2023-03-14", 37.5], ["GPT-4 Turbo", "2023-11-06", 15], ["Claude 3 Sonnet", "2024-03-04", 6],
    ["Llama 3 70B Instruct", "2024-04-18", 0.89], ["Gemini 1.5 Flash", "2024-05-10", 0.13], ["Gemini 1.5 Flash-8B", "2024-10-03", 0.07]] },
  { lab: "PhD science", task: "GPQA Diamond ≥ 33", lvl: "GPT-4 level", c: "--s2", pts: [
    ["GPT-4 (0314)", "2023-03-14", 37.5], ["GPT-4 Turbo", "2023-11-06", 15], ["Mistral Large", "2024-02-26", 6],
    ["Claude 3 Haiku", "2024-03-04", 0.5], ["Gemini 1.5 Flash", "2024-05-10", 0.13], ["Phi-4", "2024-12-13", 0.12]] },
  { lab: "Coding", task: "HumanEval ≥ 67", lvl: "GPT-4 level", c: "--s3", pts: [
    ["GPT-4 (0314)", "2023-03-14", 37.5], ["GPT-3.5 Turbo (0613)", "2023-06-13", 3.25], ["GPT-3.5 Turbo (1106)", "2023-11-06", 0.75],
    ["Claude 3 Haiku", "2024-03-04", 0.5], ["Gemma 2 27B", "2024-06-24", 0.26], ["Mistral NeMo", "2024-07-18", 0.13], ["Llama 3.1 8B Instruct", "2024-07-23", 0.10]] },
  { lab: "Knowledge", task: "MMLU ≥ 86", lvl: "GPT-4 level", c: "--s4", pts: [
    ["GPT-4 (0314)", "2023-03-14", 37.5], ["GPT-4 Turbo", "2023-11-06", 15], ["GPT-4o", "2024-05-13", 7.5],
    ["Gemini 1.5 Pro", "2024-05-23", 2.19], ["Gemini 2.0 Flash", "2025-02-05", 0.18]] },
  { lab: "GPT-3-level", task: "MMLU ≥ 43.9", lvl: "GPT-3 level", c: "--neutral", dash: true, pts: [
    ["GPT-3", "2021-11-20", 60], ["GPT-3 (price cut)", "2022-09-01", 20], ["GPT-3.5 Turbo", "2023-03-06", 2],
    ["Llama 2 Chat 13B", "2023-07-18", 0.56], ["Llama 2 7B", "2023-12-01", 0.20], ["Llama 2 7B", "2024-04-14", 0.13],
    ["Llama 3.1 8B Instruct", "2024-07-23", 0.10], ["Llama 3.2 3B Instruct", "2024-09-24", 0.08], ["Gemini 1.5 Flash-8B", "2024-10-03", 0.07]] },
];

// Flagship list prices at launch (and notable cuts), USD per 1M tokens as a 3:1 input:output blend (our calculation from
// list prices; providers don't publish a blend). [date, $/1M, model (input/output list price), hollow = gated / restricted access]
// Not a cost-per-task measure: newer models often use more tokens per task (and Claude 4.7+ counts ~30% more tokens per text).
const FRONTIER_PX = [
  { name: "OpenAI", c: "--s1", dots: 1, pts: [
    ["2023-03-14", 37.5, "GPT-4 ($30 / $60)"], ["2023-11-06", 15, "GPT-4 Turbo ($10 / $30)"], ["2024-05-13", 7.5, "GPT-4o ($5 / $15)"],
    ["2024-12-17", 26.25, "o1 ($15 / $60)"], ["2025-04-16", 17.5, "o3 ($10 / $40); cut 80% to $2 / $8 on 10 Jun 2025"], ["2025-08-07", 3.44, "GPT-5 ($1.25 / $10)"],
    ["2025-12-11", 4.81, "GPT-5.2 ($1.75 / $14)"], ["2026-03-05", 5.63, "GPT-5.4 ($2.50 / $15)"], ["2026-04-24", 11.25, "GPT-5.5 ($5 / $30)"],
    ["2026-09-03", 20, "GPT-6 Astra ($10 / $50). Epoch ECI 169.2, the top score until Claude Fable 5.2 on 9 Nov"], ["2026-09-29", 4, "GPT-6.1 Sol ($2 / $10). Epoch ECI 168.9, level with GPT-6 Astra"]] },
  { name: "Anthropic", c: "--s2", dots: 1, pts: [
    ["2024-03-04", 30, "Claude 3 Opus ($15 / $75)"], ["2025-08-05", 30, "Claude Opus 4.1 ($15 / $75)"], ["2025-11-24", 10, "Claude Opus 4.5 ($5 / $25), a 67% cut"],
    ["2026-04-07", 50, "Claude Mythos Preview ($25 / $125), gated access", 1], ["2026-06-09", 20, "Claude Fable 5 / Mythos 5 ($10 / $50)"],
    ["2026-09-22", 8, "Claude Opus 5.5 ($4 / $20)"], ["2026-11-09", 16, "Claude Fable 5.2 / Mythos 5.2 ($8 / $40), 20% below Fable 5.1. Epoch ECI 174.2, the top score"]] },
  { name: "Google", c: "--s3", dots: 1, pts: [
    ["2025-06-17", 3.44, "Gemini 2.5 Pro ($1.25 / $10, prompts ≤200K)"], ["2026-02-19", 4.5, "Gemini 3.1 Pro Preview ($2 / $12, prompts ≤200K)"],
    ["2026-10-13", 4, "Gemini 4 Argon, introductory ($2 / $10); rises to $4 / $20 on 1 Dec 2026"],
    ["2026-11-10", 4, "Gemini 4 Carbon, introductory ($2 / $10); rises to $4 / $20 on 1 Dec 2026. Gemini 4 Hydrogen (12 Nov) is $1.50 / $7.50"]] },
];

// ---------- Demand you can count ----------
// Tokens processed, trillions per month. [date, T/month, note, hollow = secondary / single-source]
// "Google, all surfaces" = company-stated monthly totals (I/O and earnings calls; not updated after May 2026).
// "Google model APIs" = its stated per-minute rate × 43,830 minutes a month, and OpenRouter = weekly volume × 4.35 (our conversions).
const TOKENS = [
  { name: "Google, all surfaces", c: "--s1", pts: [["2024-04-30", 9.7, "9.7T a month (I/O 2025, citing a year earlier)"], ["2025-05-20", 480, "~480T (I/O 2025)"],
    ["2025-07-23", 980, ">980T (Q2 2025 call)"], ["2025-10-29", 1300, ">1.3 quadrillion (Q3 2025 call)"], ["2026-05-19", 3200, ">3.2 quadrillion (I/O 2026). Google hasn't updated it since"]] },
  { name: "Google model APIs", c: "--s2", pts: [["2025-10-29", 306.8, "7B tokens a minute (Q3 2025)"], ["2026-02-04", 438.3, ">10B a minute (Q4 2025)"], ["2026-04-29", 701.3, ">16B a minute (Q1 2026)"],
    ["2026-07-22", 964.3, "~22B a minute (Q2 2026)"], ["2026-10-28", 1402.6, "Nearly 32B a minute (Q3 2026), >4× YoY"]] },
  { name: "OpenRouter", c: "--s3", pts: [["2025-06-15", 8.4, "8.4T a month (SiliconANGLE, citing the company)", 1], ["2025-11-15", 21.8, "~5T a week (implied by its May 2026 release)"],
    ["2026-05-26", 108.8, "25T a week (Series B release, 26 May 2026)"]] },
];
// Adoption, percent of each population. Three different measures: firms using AI (Census BTOS, biweekly; reworded from
// "in producing goods or services" to "in any of its business functions" in Nov 2025, which lifted the level ~7 points),
// businesses on Ramp paying for AI (card and bill-pay data, >85k firms, not a representative sample; monthly. Ramp restates
// the whole history with each release, by ~0.05–0.1 pt, so replace the full series from the JSON embedded in its page), and
// employed adults using generative AI for their job (St. Louis Fed Real-Time Population Survey, quarterly).
const ADOPT = [
  { name: "Ramp: businesses paying for AI", short: "Ramp, paying", c: "--s1", marks: "end", pts: [["2023-07-15", 24.49], ["2023-08-15", 25.33], ["2023-09-15", 26.42], ["2023-10-15", 27.19], ["2023-11-15", 28.1], ["2023-12-15", 29.35], ["2024-01-15", 30.31], ["2024-02-15", 30.56], ["2024-03-15", 31.1], ["2024-04-15", 30.71], ["2024-05-15", 31.06], ["2024-06-15", 31.3], ["2024-07-15", 31.77], ["2024-08-15", 31.99], ["2024-09-15", 32.84], ["2024-10-15", 33.45], ["2024-11-15", 34.1], ["2024-12-15", 34.44], ["2025-01-15", 35.49], ["2025-02-15", 36.58], ["2025-03-15", 37.41], ["2025-04-15", 38.92], ["2025-05-15", 40.21], ["2025-06-15", 41.12], ["2025-07-15", 42.47], ["2025-08-15", 43.43], ["2025-09-15", 43.72], ["2025-10-15", 43.54], ["2025-11-15", 44.35], ["2025-12-15", 44.42], ["2026-01-15", 45.44], ["2026-02-15", 47.67], ["2026-03-15", 50.08], ["2026-04-15", 51.93], ["2026-05-15", 53.18], ["2026-06-15", 53.92], ["2026-07-15", 54.77], ["2026-08-15", 55.17], ["2026-09-15", 55.83], ["2026-10-15", 56.8]] },
  { name: "Workers using generative AI for their job", short: "Workers", c: "--s3", pts: [["2024-08-15", 33.3], ["2024-11-15", 31.0], ["2025-02-15", 32.7], ["2025-05-15", 35.1], ["2025-08-15", 37.4], ["2025-11-15", 40.6], ["2026-02-15", 42.8], ["2026-05-15", 45.2], ["2026-08-15", 40.5]] },
  { name: "Census: firms using AI (old question)", short: "", c: "--s2", marks: "end", pts: [["2023-09-24", 3.7], ["2023-11-05", 3.9], ["2023-12-17", 4.9], ["2024-01-28", 5.3], ["2024-03-10", 4.3], ["2024-04-21", 4.8], ["2024-06-02", 4.6], ["2024-07-14", 5.0], ["2024-08-25", 5.5], ["2024-10-06", 6.0], ["2024-11-17", 6.1], ["2024-12-29", 6.3], ["2025-02-09", 6.8], ["2025-03-23", 7.8], ["2025-05-04", 8.7], ["2025-06-15", 9.2], ["2025-07-27", 9.4], ["2025-09-07", 9.1], ["2025-10-05", 10.0]] },
  { name: "Census: firms using AI", short: "Census, using", c: "--s2", marks: "end", pts: [["2025-11-30", 17.3], ["2025-12-14", 17.2], ["2025-12-28", 17.8], ["2026-01-11", 17.7], ["2026-01-25", 18.2], ["2026-02-08", 18.9], ["2026-02-22", 17.5], ["2026-03-08", 18.2], ["2026-03-22", 18.9], ["2026-04-05", 19.1], ["2026-04-19", 19.8], ["2026-05-03", 19.8], ["2026-05-17", 19.5], ["2026-05-31", 20.6], ["2026-06-14", 20.6], ["2026-06-28", 20.6], ["2026-07-12", 21.7], ["2026-07-26", 21.5], ["2026-08-09", 21.8], ["2026-08-23", 22.4], ["2026-09-06", 23.2], ["2026-09-20", 23.8], ["2026-10-04", 23.8], ["2026-10-18", 24.6], ["2026-11-01", 24.2, "First wave asking about \"Super Intelligence (formerly AI)\"; \"don't know\" rose 9.6% → 13.9%", 1]] },
];
const ADOPT_BREAK = "2025-11-17"; // Census rewords its AI question (no collection 6 Oct – 16 Nov 2025: government shutdown)

// ---------- Circular deals: who funds the labs, and who the labs pay ----------
// L → M: equity and financing into OpenAI / Anthropic from companies that also sell them compute.
// M → R: compute the labs have committed to buy. $B; v: null = no $ disclosed (vtxt shown instead).
// cond: 1 = conditional, "up to", cancellable, a guarantee or an undrawn facility (drawn hollow and dashed).
// Sources: SEC filings (Anthropic S-1/A 2 and 10 Nov 2026; Amazon, Microsoft, Nvidia, AMD, Broadcom 10-Qs and 8-Ks), company
// releases; "reported" = press only. Checked 13 Nov 2026. Financial investors (SoftBank, VCs) are left out on purpose.
const FLOWS = {
  h: 640, heads: ["Vendor money in", "The labs", "Compute committed"], subs: ["equity, financing, guarantees", "", "contracts and minimums"],
  aria: "Flow diagram: Amazon, Microsoft, Nvidia, AMD, Google and Broadcom put about $134B of firm equity (plus about $202B conditional) into OpenAI and Anthropic, while the two labs have committed about $1.15 trillion of firm compute purchases (plus about $226B conditional) to Oracle, Microsoft, Amazon, Google, Broadcom, CoreWeave, SpaceX and others",
  L: [{ id: "nvdaL", name: "Nvidia" }, { id: "amzL", name: "Amazon", circ: 1 }, { id: "msftL", name: "Microsoft", circ: 1 },
      { id: "amdL", name: "AMD", circ: 1 }, { id: "googL", name: "Google", circ: 1 }, { id: "avgoL", name: "Broadcom", circ: 1 }],
  M: [{ id: "oai", name: "OpenAI", c: "--s1" }, { id: "ant", name: "Anthropic", c: "--s2" }],
  R: [{ id: "orcl", name: "Oracle" }, { id: "crwv", name: "CoreWeave" }, { id: "cbrs", name: "Cerebras" }, { id: "msftR", name: "Microsoft", circ: 1 },
      { id: "amzR", name: "Amazon", circ: 1 }, { id: "amdR", name: "AMD", circ: 1 }, { id: "avgoR", name: "Broadcom", circ: 1 }, { id: "googR", name: "Google", circ: 1 },
      { id: "spx", name: "SpaceX (xAI)" }, { id: "nscale", name: "Nscale" }, { id: "lambda", name: "Lambda" }],
  flows: [
    { from: "nvdaL", to: "oai", v: 30, kind: "Equity (reported)", what: "~$30B of OpenAI's $122B round, closed 31 Mar 2026. Nvidia's filings don't name OpenAI; February reports said ~$20B", status: "Reported closed. The Sep 2025 \"up to $100B\" letter of intent never became definitive", src: "CNBC, Bloomberg (reported)" },
    { from: "nvdaL", to: "oai", v: 105, cond: 1, kind: "Lease guarantee", what: "Guarantees OpenAI's 20-year leases on SB Energy's 4.25 GW Ohio campus, which will host only Nvidia compute", status: "Signed Aug 2026, capped at $105B. Each guarantee starts with its lease (from 2028) and ends if OpenAI gets a satisfactory credit rating", src: "Nvidia 10-Q, 8-K" },
    { from: "nvdaL", to: "ant", v: 10, cond: 1, kind: "Equity (up to)", what: "Up to $10B (Nov 2025 partnership)", status: "A portion funded in the Feb 2026 Series G; amount not disclosed. Nvidia has also agreed to buy ~$10.0B of stock at the IPO price in a private placement that closes only if the IPO does (S-1/A, 10 Nov); not added here until it closes", src: "Anthropic release, S-1/A" },
    { from: "amzL", to: "oai", v: 50, kind: "Equity", what: "$50B of Series C preferred: $15B in Q1, $13.7B in Q2 and $21.3B in Q3 2026", status: "Fully funded", src: "Amazon 10-Q (Q3 2026)" },
    { from: "amzL", to: "ant", v: 18, kind: "Equity", what: "$8B of convertible notes (2023–25) and $10B of preferred stock in 2026", status: "Funded. Amazon now carries the stake at $238.7B", src: "Amazon 10-Q, S-1/A" },
    { from: "amzL", to: "ant", v: 15, cond: 1, kind: "Financing facility", what: "$15B released in $5B steps as compute-capacity milestones are met", status: "Conditional on milestones", src: "S-1/A" },
    { from: "msftL", to: "oai", v: 13, kind: "Equity", what: "$13.0B committed, $12.0B funded; ~24% stake on an as-converted basis", status: "Mostly funded", src: "Microsoft 10-Q (Sep 2026)" },
    { from: "msftL", to: "ant", v: 5, cond: 1, kind: "Equity (up to)", what: "Up to $5B (Nov 2025 partnership)", status: "A portion funded in the Series G; amount not disclosed. Microsoft is also buying ~$1.0B in the IPO private placement", src: "Anthropic release, S-1/A" },
    { from: "amdL", to: "oai", v: null, vtxt: "160M-share warrant", cond: 1, kind: "Warrant", what: "Warrant for up to 160M AMD shares at $0.01, vesting with MI450 deliveries and share-price targets (the last needs $600)", status: "No shares had vested at 26 Sep 2026", src: "AMD 8-K, 10-Q" },
    { from: "amdL", to: "ant", v: 5, cond: 1, kind: "Equity (up to)", what: "AMD buys up to $5.0B of Anthropic stock as MI450 delivery milestones are met", status: "Signed Jul 2026; conditional. $2.5B of it is to be bought in the IPO private placement instead, if the IPO closes", src: "S-1/A" },
    { from: "googL", to: "ant", v: 23.3, kind: "Equity", what: "$3.3B of notes (2023–25), then $10B (Mar 2026) and $10B (May 2026)", status: "Funded", src: "S-1/A" },
    { from: "googL", to: "ant", v: 20, cond: 1, kind: "Financing facility", what: "A further $20B, undrawn; draws depend on third-party compute conditions and revenue targets (14.99% ownership cap)", status: "Undrawn. Google has agreed to take $10.0B of it as stock in the IPO private placement, which cuts the facility by the same amount", src: "S-1/A" },
    { from: "avgoL", to: "ant", v: 42, cond: 1, kind: "Vendor financing", what: "$42B convertible-note facility to pay the TPU rack rent (9% interest paid in kind; converts at 90% of the share price). Broadcom also backstops up to ~$29B of a $35B tranche funded by a financial partner", status: "No notes issued yet. Broadcom is also buying ~$1.0B of stock in the IPO private placement", src: "S-1/A, Broadcom 10-Q" },
    { from: "oai", to: "orcl", v: 300, kind: "Compute purchase (reported)", what: "~$300B over ~5 years from 2027 (Stargate)", status: "Reported by the WSJ. Oracle doesn't name OpenAI; its total RPO is $664B", src: "WSJ via DCD (reported)" },
    { from: "oai", to: "msftR", v: 250, kind: "Compute purchase", what: "Incremental Azure commitment from the Oct 2025 restructuring", status: "Signed. Microsoft booked $24.1B of revenue from OpenAI in FY26 and $10.0B in Jul–Sep 2026", src: "Microsoft blog, 10-K, 10-Q" },
    { from: "oai", to: "amzR", v: 138, kind: "Compute purchase", what: "$38B AWS deal (Nov 2025), expanded by $100B over 8 years including AWS chips (Q1 2026)", status: "Signed", src: "Amazon 10-Q" },
    { from: "oai", to: "crwv", v: 22.4, kind: "Compute purchase", what: "Three 2025 orders: $11.9B, $4.0B and $6.5B", status: "Signed; runs to 2031", src: "CoreWeave filings" },
    { from: "oai", to: "cbrs", v: null, vtxt: "750 MW", kind: "Compute purchase", what: "750 MW of Cerebras compute. OpenAI also lent Cerebras ~$1.0B and holds a warrant for up to 33.4M shares", status: "Signed. Cerebras's $25.0B backlog is mostly OpenAI", src: "Cerebras 10-Q" },
    { from: "oai", to: "amdR", v: null, vtxt: "6 GW", kind: "Chip purchase", what: "6 GW of MI450 GPUs; the first 1 GW is binding", status: "First Helios racks shipped for revenue in Q3 2026", src: "AMD 8-K, Q3 call" },
    { from: "oai", to: "avgoR", v: null, vtxt: "10 GW", cond: 1, kind: "Chip purchase", what: "10 GW of custom accelerators, 2H 2026–2029", status: "Slipped: Broadcom sees ~1.3 GW in 2027 and \"less clarity\" on OpenAI", src: "OpenAI release, Broadcom Q3 call" },
    { from: "ant", to: "googR", v: 121.3, kind: "Compute purchase", what: "Google Cloud minimum, Apr 2026–Jul 2033", status: "Signed", src: "S-1/A" },
    { from: "ant", to: "avgoR", v: 161.2, kind: "TPU rack leases", what: "Finance leases for TPU racks in dedicated data centres: ~$161.2B of rent, payable as racks become ready", status: "Signed; ~1 GW deploying now, ~5 GW expected in 2027", src: "S-1/A" },
    { from: "ant", to: "amzR", v: 110, kind: "Compute purchase", what: "AWS minimum, May 2026–Apr 2036 (take-or-pay)", status: "Signed", src: "S-1/A, Amazon 10-Q" },
    { from: "ant", to: "msftR", v: 44.9, kind: "Compute purchase", what: "Azure minimum, Nov 2026–Jun 2033 (raised from $30B)", status: "Signed", src: "S-1/A" },
    { from: "ant", to: "spx", v: 120.5, cond: 1, kind: "Compute purchase (up to)", what: "Up to $120.5B of Nvidia-GPU compute into 2029, ~$3.1B a month at full delivery (expected Dec 2026). Nvidia owns $21.0B of SpaceX", status: "Non-cancellable only until Jan/Mar 2027; then either side can quit on 90 days' notice", src: "S-1/A, Nvidia 13F" },
    { from: "ant", to: "nscale", v: 44.6, cond: 1, kind: "Compute purchase (up to)", what: "Up to $44.6B. Nscale also sells up to $43.8B to Microsoft; Nvidia owns >5% and guarantees $860M of its leases", status: "Signed; Nscale's IPO is pending", src: "Nscale S-1" },
    { from: "ant", to: "lambda", v: 41.3, cond: 1, kind: "Compute purchase", what: "$41.3B through 2034", status: "$34.9B of it can be terminated if Lambda can't secure the facility lease", src: "S-1/A" },
    { from: "ant", to: "amdR", v: 20, cond: 1, kind: "Chip purchase", what: "Helios / MI450 systems from 2027, \"over $20B\" if fully bought (up to 2 GW)", status: "Conditional on deployment proposals", src: "S-1/A, AMD" },
  ],
};

// ---------- GPU rental rates ----------
// Silicon Data neocloud (non-hyperscaler) daily rental indices, $/GPU-hr (SDH100RT on Bloomberg etc.).
// Point: [date, $/GPU-hr, hollow?, note]. Hollow = read off Silicon Data's chart by eye, pre-restatement
// methodology, or a secondary source. Silicon Data reportedly restated H100/A100 history in early Dec 2025
// (secondary sources: H100 ~-4-6%, A100 ~+35-40%), so points before GPU_RESTATE aren't strictly comparable.
const GPU_RANGE = ["2025-05-01", "2026-11-20"];
const GPU_RESTATE = "2025-12-03";
const GPU_TICKS = [["2025-07-01", "Jul 25"], ["2025-10-01", "Oct"], ["2026-01-01", "Jan 26"], ["2026-04-01", "Apr"], ["2026-07-01", "Jul"], ["2026-10-01", "Oct"]];
const GPU = [
  { chip: "B300", c: "--s4", base: "2026-04-23", pts: [
    ["2026-04-23", 4.83, 1, "Index starts; level read off Silicon Data's chart"], ["2026-06-01", 5.15, 1, "Read off chart"], ["2026-07-10", 5.6, 1, "Read off chart"],
    ["2026-08-05", 7.1, 1, "Read off chart"], ["2026-10-10", 6.7, 1, "Read off chart (Sep–Oct dip)"], ["2026-11-06", 7.56, 0, "Silicon Data index page"], ["2026-11-09", 7.68, 0, "Index page. Its daily table gives 7.55 on 2 Nov (~+2% in a week); the page's \"7D\" figure (+15%) is really the change across its 30-day table (6.67 on 11 Oct)"], ["2026-11-12", 7.67, 0, "Index page daily table (7.68 on 10 Nov). 7.56 on 5 Nov, so ~+1.5% in a week"]] },
  { chip: "B200", c: "--s2", base: "2026-01-01", pts: [
    ["2025-11-05", 4.85, 1, "Read off Silicon Data's chart"], ["2026-01-01", 4.40, 0, "Opened 2026 (Silicon Data blog)"], ["2026-01-11", 4.29, 0, "Low"],
    ["2026-03-25", 6.11, 0, "Spike: +$0.96 on 23 Mar"], ["2026-03-30", 5.48, 0, ""], ["2026-07-27", 5.66, 0, ""], ["2026-09-07", 5.69, 0, "Term rates same day: 3-mo $5.73, 6-mo $5.64, 12-mo $5.39"],
    ["2026-11-06", 6.58, 0, "Index page; +11.9% in 7 days. The 5 Nov chart in Silicon Data's post shows $6.70"],
    ["2026-11-09", 6.84, 0, "Index page. Daily table: 6.50 on 2 Nov (~+5% in a week), 5.93 on 11 Oct (~+15% in four weeks)"], ["2026-11-12", 6.97, 0, "Index page daily table; a new high (6.97 on 10 Nov, 6.84 on 11 Nov). 6.70 on 5 Nov, so ~+4% in a week"]] },
  { chip: "H200", c: "--s3", base: "2026-05-04", pts: [
    ["2026-05-04", 2.70, 0, "Index starts"], ["2026-07-18", 3.10, 0, ""], ["2026-09-07", 3.29, 0, ""],
    ["2026-10-24", 3.48, 1, "Secondary source (explainx.ai)"], ["2026-11-06", 3.51, 0, "Index page (the daily table now shows 3.52)"], ["2026-11-08", 3.55, 0, "Index page"], ["2026-11-09", 3.48, 0, "Index page; −2% on the day"], ["2026-11-12", 3.52, 0, "Index page daily table (3.47 on 11 Nov)"]] },
  { chip: "H100", c: "--s1", base: "2025-12-09", pts: [
    ["2025-05-27", 2.37, 1, "Older method. IEEE Spectrum, at index launch"], ["2025-08-15", 2.24, 1, "Older method. Aug range $2.22–2.26"], ["2025-09-15", 2.13, 1, "Older method. Mid-Sep low"],
    ["2025-11-05", 1.98, 1, "Read off Silicon Data's chart (current method)"], ["2025-12-09", 2.00, 0, "Cycle low"], ["2026-01-06", 2.20, 0, "+10% in four weeks"],
    ["2026-04-01", 2.63, 0, ""], ["2026-04-08", 2.47, 0, ""], ["2026-05-04", 2.57, 0, ""], ["2026-05-31", 2.73, 0, ""], ["2026-06-05", 2.79, 0, "Mid-year high"],
    ["2026-07-27", 2.75, 0, ""], ["2026-09-07", 2.63, 0, ""], ["2026-10-08", 2.80, 0, ""], ["2026-10-22", 2.88, 0, ""], ["2026-11-06", 2.99, 0, "Index page (SDH100RT)"], ["2026-11-07", 3.04, 0, "Daily table; the high so far"], ["2026-11-09", 3.01, 0, "Index page; 2.94 on 2 Nov"], ["2026-11-12", 3.06, 0, "Index page daily table; 3.06 on 10, 11 and 12 Nov, a new high. 2.97 on 5 Nov, so ~+3% in a week"]] },
  { chip: "A100", c: "--neutral", base: "2025-11-05", pts: [
    ["2025-11-05", 1.38, 1, "Read off Silicon Data's chart"], ["2026-07-15", 1.65, 1, "Read off chart (peak)"], ["2026-11-06", 1.59, 0, "Index page (SDA100RT)"], ["2026-11-09", 1.59, 0, "Index page; unchanged"], ["2026-11-12", 1.60, 0, "Index page daily table"]] },
];
// The long view: SemiAnalysis "spot-contract composite" (public preview of gpu-index.semianalysis.com; the
// history table doesn't name the chip, but its H100 headline matches, so very likely H100). Different method
// from Silicon Data, so it's charted separately. [label, decimal-year midpoint, $/GPU-hr]
const GPU_LONG = [["2H23", 2023.75, 6.62], ["1Q24", 2024.125, 5.78], ["2Q24", 2024.375, 4.77], ["3Q24", 2024.625, 4.44], ["4Q24", 2024.875, 3.91],
  ["1Q25", 2025.125, 3.60], ["2Q25", 2025.375, 3.34], ["Jul 25", 2025.54, 2.79], ["Sep 25", 2025.71, 2.90], ["Nov 25", 2025.87, 2.80], ["Jan 26", 2026.04, 2.82], ["Mar 26", 2026.2, 2.80]];
// Same chip, different price: early Nov 2026 snapshot by source and method. $/GPU-hr; null = not listed.
const GPU_SNAP = [
  { src: "Vast.ai marketplace median", kind: "Marketplace, on-demand, all hosts (own API pull 10 Nov, 17–51 listings per chip; verified hosts only: H100 $3.41)", h100: 2.54, h200: 4.00, b200: 8.75 },
  { src: "Silicon Data index", kind: "Neocloud rental index (12 Nov)", h100: 3.06, h200: 3.52, b200: 6.97 },
  { src: "Ornn OCPI", kind: "Executed trades, volume-weighted (settled 12 Nov; moves ±10% a day)", h100: 3.39, h200: 7.12, b200: 9.78 },
  { src: "GetDeploying median", kind: "On-demand list, 22–44 providers per chip (wk of 9 Nov; H100 re-read 13 Nov at $3.93 across 44 providers, after a $3.73 reading on 10 Nov with fewer listed)", h100: 3.93, h200: 4.74, b200: 8.13 },
  { src: "Together AI", kind: "On-demand list (91–180-day reserved: H100 $3.19)", h100: 3.99, h200: 5.99, b200: 8.19 },
  { src: "Nebius", kind: "On-demand list", h100: 4.50, h200: 5.40, b200: 8.50 },
  { src: "Lambda", kind: "On-demand list, 8× node, effective 16 Nov", h100: 4.59, h200: null, b200: 7.69 },
  { src: "CoreWeave", kind: "On-demand list (GB200 $10.50)", h100: 6.16, h200: 6.31, b200: 8.60 },
  { src: "AWS p5", kind: "On-demand (spot $2.64–4.67; 3-yr plan $2.97)", h100: 6.88, h200: null, b200: null },
  { src: "Google a3-high / Azure ND H100 v5", kind: "On-demand list (aggregators)", h100: "11.06 / 12.29", h200: null, b200: null },
];
