// =====================================================================
// AI build-out dashboard: ALL DATA LIVES HERE.
// To refresh: update the constants below, bump each touched section's
// `asOf` in SECTIONS, and set UPDATED. See CLAUDE.md and the
// update-dashboard skill (.claude/skills/update-dashboard/SKILL.md).
// Convention: estimates/projections are flagged in-data, never silently.
// =====================================================================

const UPDATED = "2026-11-07"; // date of the last full refresh (drives "today" markers + header)

// Section registry: when each section's data was last verified, how often it
// should be refreshed (days), and where the numbers come from. Rendered as a
// stamp on every card; `./check.sh` lists anything overdue.
const SECTIONS = {
  hero:          { title: "Headline tiles",             asOf: "2026-11-07", every: 90,  consts: ["(tiles in index.html)"], sources: ["Big 4 + Oracle + CoreWeave + Nvidia latest earnings/IR"] },
  capex:         { title: "Hyperscaler capex",          asOf: "2026-11-07", every: 90,  consts: ["CAPEX", "CAPEX_YEARS", "CAPEX_EST_FROM"], sources: ["10-Q/10-K cash flow statements", "earnings-call capex guidance"] },
  share:         { title: "2026 capex share + guides",  asOf: "2026-11-07", every: 90,  consts: ["CAPEX_GUIDES"], sources: ["earnings-call capex guidance"] },
  gw:            { title: "Data-centre GW",             asOf: "2026-11-06", every: 180, consts: ["GW_YEARS", "GW_AI", "GW_NONAI", "FORECASTS_2030"], sources: ["IEA Energy & AI", "McKinsey", "JLL", "Goldman Sachs Research"] },
  neoclouds:     { title: "Oracle & neoclouds table",   asOf: "2026-11-07", every: 30,  consts: ["(table in index.html)"], sources: ["Oracle, CoreWeave, Nebius IR / earnings", "OpenAI commitments: The Information (via SiliconANGLE)"] },
  oracle:        { title: "Oracle capex",               asOf: "2026-11-06", every: 90,  consts: ["ORCL"], sources: ["Oracle 10-Q/10-K, FY guide"] },
  flop:          { title: "Frontier training compute",  asOf: "2026-11-07", every: 90,  consts: ["FLOP", "FLOP_PROJ"], sources: ["https://epoch.ai/data/notable-ai-models"] },
  nvda:          { title: "Nvidia DC revenue",          asOf: "2026-11-07", every: 90,  consts: ["NVDA"], sources: ["Nvidia quarterly results (FY ends late Jan)"] },
  deflation:     { title: "Token deflation",            asOf: "2026-11-06", every: 180, consts: ["DEFL", "DEFL_END"], sources: ["https://epoch.ai/data-insights/llm-inference-price-trends"] },
  "lab-revenue": { title: "OpenAI / Anthropic revenue", asOf: "2026-11-07", every: 30,  consts: ["LABS", "REV_PROJ", "(funding table in index.html)"], sources: ["https://epoch.ai/data-insights/anthropic-openai-revenue", "CNBC / Bloomberg / The Information / FT run-rate reports", "Anthropic S-1", "Bloomberg / Reuters funding-round reports"] },
  autonomy:      { title: "METR + Economic Index",      asOf: "2026-11-06", every: 60,  consts: ["METR", "METR_DOUBLING_DAYS", "AEI"], sources: ["https://metr.org/time-horizons", "https://metr.org/assets/benchmark_results_1_1.yaml", "https://www.anthropic.com/research (Economic Index)"] },
  credit:        { title: "CDS credit monitor",         asOf: "2026-11-07", every: 7,   consts: ["CDS", "CDS_TS", "CDS_ASOF"], sources: ["Bloomberg/ICE terminal if available", "CNBC, WSJ (Solve data), Bloomberg press reports"] },
  power:         { title: "DC power demand",            asOf: "2026-11-06", every: 180, consts: ["PWR"], sources: ["Goldman Sachs Research", "IEA"] },
  gpu:           { title: "GPU rental rates",           asOf: "2026-11-06", every: 30,  consts: ["GPU", "GPU_RANGE", "GPU_RESTATE", "GPU_SNAP"], sources: ["https://www.silicondata.com/products/silicon-index/h100", "https://www.silicondata.com/blog", "Vast.ai public marketplace API (snapshot)"] },
  cloud:         { title: "Cloud backlog + demand",     asOf: "2026-11-07", every: 90,  consts: ["(tiles in index.html)"], sources: ["MSFT 10-Q, GOOGL / AMZN 8-K releases + Q3 calls"] },
  campuses:      { title: "GW-class campuses",          asOf: "2026-11-07", every: 90,  consts: ["(table in index.html)"], sources: ["company announcements"] },
};

// Known upcoming events that should trigger a refresh (approximate; confirm dates).
const EVENTS = [
  { when: "10 Nov 2026",  what: "CoreWeave Q3 results (backlog, contracted GW)", sections: ["neoclouds", "credit", "hero"] },
  { when: "12 Nov 2026",  what: "Nebius Q3 results (contracted power vs 5 GW target, ARR)", sections: ["neoclouds"] },
  { when: "17 Nov 2026",  what: "Nvidia Q3 FY27 results (guide $108B ±2%)", sections: ["nvda", "hero"] },
  { when: "~19–20 Nov 2026", what: "Anthropic IPO pricing (Nasdaq: ANT; reported): valuation, Oct run-rate", sections: ["lab-revenue", "credit"] },
  { when: "late Nov–Dec 2026", what: "OpenAI round final close (~$20B expected at $1.25T)", sections: ["lab-revenue", "neoclouds"] },
  { when: "mid-Dec 2026",  what: "Oracle Q2 FY27 results (RPO, capex guide)", sections: ["neoclouds", "oracle", "hero", "credit"] },
  { when: "late Jan–early Feb 2027", what: "Big 4 Q4 results + first 2027 capex guides", sections: ["capex", "share", "hero"] },
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
const ORCL = { labels: ["FY21","FY22","FY23","FY24","FY25","FY26","FY27E"], vals: [1.8,4.5,8.7,6.9,21.2,50,92.5], est: 6 };
const NVDA = { labels: ["FY20","FY21","FY22","FY23","FY24","FY25","FY26"], vals: [3.0,6.7,10.6,15.0,47.5,115.2,190] };
const FLOP = [
  { m: "GNMT",           x: 2016.7, y: 6.9e21 },
  { m: "AlphaGo Zero",   x: 2017.8, y: 3.4e23 },
  { m: "GPT-3",          x: 2020.4, y: 3.1e23 },
  { m: "PaLM",           x: 2022.3, y: 2.5e24 },
  { m: "GPT-4",          x: 2023.2, y: 2.1e25 },
  { m: "Gemini 1.0 Ultra", x: 2023.9, y: 5.0e25 },
  { m: "Llama 3.1 405B", x: 2024.6, y: 3.8e25 },
  { m: "Grok 3",         x: 2025.13, y: 3.5e26 },
  { m: "GPT-4.5",        x: 2025.16, y: 3.8e26 },
  { m: "Grok 4",         x: 2025.52, y: 5.0e26, spec: 1 }, // Epoch confidence "Speculative"
  { m: "GPT-6 Astra",    x: 2026.67, y: 9.4e26 },          // Epoch "Likely", CI ~5e26–2e27
];
// spec: 1 = Epoch rates the estimate "Speculative" (hollow marker). Values from Epoch's notable-models CSV, 7 Nov 2026.
const FLOP_PROJ = [{ x: 2025.13, y: 3.5e26 }, { x: 2030, y: 2e29 }];
// Global DC capacity, GW. 2015–2024 modeled (IEA TWh ÷ 8,760 h ÷ ~75% utilisation; AI share from IEA accelerated-server trend).
// 2025 & 2030 = McKinsey (AI 44→156, non-AI 38→64). 2026–2029 interpolated.
const GW_YEARS = [2015,2016,2017,2018,2019,2020,2021,2022,2023,2024,2025,2026,2027,2028,2029,2030];
const GW_AI    = [0.5,0.7,1,1.5,2,3,4,6,12,25,44,66,88,110,133,156];
const GW_NONAI = [30,31,32,32.5,33,34,35,36,36.5,37,38,42,47,52,58,64];
const GW_TODAY = 2026, GW_FORECAST_FROM = 2026;
const FORECASTS_2030 = [
  { who: "McKinsey (capacity)", gw: 219 },
  { who: "JLL (capacity)", gw: 200 },
  { who: "Goldman Sachs (power demand)", gw: 122 },
];
const PWR = [{ x: 2023, y: 55 }, { x: 2027, y: 84 }, { x: 2030, y: 122 }];
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

// ---------- CDS: update this block with terminal data ----------
// Latest 5y CDS, bps. bps: null = level not published. st = credit state (critical/serious/warning/good/none).
const CDS_ASOF = "2026-11-06";
const CDS = [
  { co: "CoreWeave", bps: 1155, d: "2026-11-06", src: "CNBC (Deutsche Bank)", st: "critical", stLab: "Distress", chg: "~2.9× YoY (from ~393)", note: "Record above 1,289 on 5 Nov, the day of the post-midterm selloff. 9.625% 2032 bond yielded >16% (6 Nov); 2031 notes traded as low as 79.5c (4 Nov)" },
  { co: "Oracle", bps: 305, d: "2026-11-05", src: "S&P Global MI (via Benzinga)", st: "serious", stLab: "Priced like junk", chg: "~2.1× vs end-2025 (~145)", note: "Solve/WSJ had 288 on 1 Nov; Bloomberg 274 on 28 Oct after Oracle capped outside funding at $20B. Raised the full $20B on 2–4 Nov. Fitch BBB and Moody's Baa2 affirmed 2 Nov; S&P BBB-" },
  { co: "Nvidia", bps: 139, d: "2026-11-06", src: "CNBC (vendor not named)", st: "warning", stLab: "Record, still IG", chg: "+76% in a month", note: "Solve/WSJ had 101 on 1 Nov and S&P GMI 127 in late Oct: vendors differ. Mostly hedging of the AI trade; little Nvidia debt" },
  { co: "Meta", bps: 125, d: "2026-11-03", src: "Yahoo Finance (vendor not named)", st: "warning", stLab: "Record, still IG", chg: "~3× vs end-2025 (~39)", note: "Markit record 114.5 on 22 Oct; Solve/WSJ 108 on 1 Nov. Sold $15B of dollar bonds (3 Nov) and a record €9B euro debut (4 Nov). S&P outlook negative" },
  { co: "Amazon", bps: 100, d: "2026-11-05", src: "S&P Global MI (via Benzinga)", st: "warning", stLab: "Record, still IG", chg: "~2× vs mid-April", note: "Barclays had 81 on 28 Oct" },
  { co: "Alphabet", bps: 92, d: "2026-11-05", src: "S&P Global MI (via Benzinga)", st: "warning", stLab: "Record, still IG", chg: "~2× vs mid-April (47)", note: "€6B euro bond on 2 Nov. Barclays had 80 on 28 Oct" },
  { co: "Microsoft", bps: 53, d: "2026-10-28", src: "Barclays (via Crypto Briefing)", st: "good", stLab: "Rising, strong IG", chg: "~2× over the year", note: "\"Under 60\" per Yahoo Finance on 3 Nov. First bond in nine years: $25B on 29 Oct, ~$115B of orders" },
  { co: "Nebius, IREN, others", bps: null, d: null, src: "", st: "none", stLab: "No liquid CDS reported", chg: "", note: "Watch bond / convertible yields. Shares fell 15–17% on 5 Nov" },
];
// Sparse time series of reported prints. der = derived from a reported % change (hollow marker).
// Prints come from different vendors (CNBC, Solve/WSJ, Bloomberg, Markit, S&P GMI), which differ by 10–30 bps.
const CDS_TS = [
  { co: "CoreWeave", c: "--s1", pts: [["2025-10-15", 393, 1], ["2026-07-29", 855], ["2026-10-08", 895, 1], ["2026-10-15", 1038], ["2026-10-16", 1104, 1], ["2026-10-19", 1082], ["2026-11-05", 1289], ["2026-11-06", 1155]] },
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
    ["2026-04-30", 30, "Press reports"], ["2026-05-29", 47, "Company statement"], ["2026-07-31", 65, "Bloomberg / CNBC (investor update)"]],
    extra: [["2026-10-31", 80, "Crypto Briefing citing a WSJ source: \"topped $80B in October\". The S-1/A leaves the 31 Oct run-rate blank"]] },
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
    ["2026-08-05", 7.1, 1, "Read off chart"], ["2026-10-10", 6.7, 1, "Read off chart (Sep–Oct dip)"], ["2026-11-06", 7.56, 0, "Silicon Data index page; +13% in 7 days"]] },
  { chip: "B200", c: "--s2", base: "2026-01-01", pts: [
    ["2025-11-05", 4.85, 1, "Read off Silicon Data's chart"], ["2026-01-01", 4.40, 0, "Opened 2026 (Silicon Data blog)"], ["2026-01-11", 4.29, 0, "Low"],
    ["2026-03-25", 6.11, 0, "Spike: +$0.96 on 23 Mar"], ["2026-03-30", 5.48, 0, ""], ["2026-07-27", 5.66, 0, ""], ["2026-09-07", 5.69, 0, "Term rates same day: 3-mo $5.73, 6-mo $5.64, 12-mo $5.39"],
    ["2026-11-06", 6.58, 0, "Index page; +11.9% in 7 days. The 5 Nov chart in Silicon Data's post shows $6.70"]] },
  { chip: "H200", c: "--s3", base: "2026-05-04", pts: [
    ["2026-05-04", 2.70, 0, "Index starts"], ["2026-07-18", 3.10, 0, ""], ["2026-09-07", 3.29, 0, ""],
    ["2026-10-24", 3.48, 1, "Secondary source (explainx.ai)"], ["2026-11-06", 3.51, 0, "Index page; +5.7% in 7 days"]] },
  { chip: "H100", c: "--s1", base: "2025-12-09", pts: [
    ["2025-05-27", 2.37, 1, "Older method. IEEE Spectrum, at index launch"], ["2025-08-15", 2.24, 1, "Older method. Aug range $2.22–2.26"], ["2025-09-15", 2.13, 1, "Older method. Mid-Sep low"],
    ["2025-11-05", 1.98, 1, "Read off Silicon Data's chart (current method)"], ["2025-12-09", 2.00, 0, "Cycle low"], ["2026-01-06", 2.20, 0, "+10% in four weeks"],
    ["2026-04-01", 2.63, 0, ""], ["2026-04-08", 2.47, 0, ""], ["2026-05-04", 2.57, 0, ""], ["2026-05-31", 2.73, 0, ""], ["2026-06-05", 2.79, 0, "Mid-year high"],
    ["2026-07-27", 2.75, 0, ""], ["2026-09-07", 2.63, 0, ""], ["2026-10-08", 2.80, 0, ""], ["2026-10-22", 2.88, 0, ""], ["2026-11-06", 2.99, 0, "Index page (SDH100RT)"]] },
  { chip: "A100", c: "--neutral", base: "2025-11-05", pts: [
    ["2025-11-05", 1.38, 1, "Read off Silicon Data's chart"], ["2026-07-15", 1.65, 1, "Read off chart (peak)"], ["2026-11-06", 1.59, 0, "Index page (SDA100RT)"]] },
];
// The long view: SemiAnalysis "spot-contract composite" (public preview of gpu-index.semianalysis.com; the
// history table doesn't name the chip, but its H100 headline matches, so very likely H100). Different method
// from Silicon Data, so it's charted separately. [label, decimal-year midpoint, $/GPU-hr]
const GPU_LONG = [["2H23", 2023.75, 6.62], ["1Q24", 2024.125, 5.78], ["2Q24", 2024.375, 4.77], ["3Q24", 2024.625, 4.44], ["4Q24", 2024.875, 3.91],
  ["1Q25", 2025.125, 3.60], ["2Q25", 2025.375, 3.34], ["Jul 25", 2025.54, 2.79], ["Sep 25", 2025.71, 2.90], ["Nov 25", 2025.87, 2.80], ["Jan 26", 2026.04, 2.82], ["Mar 26", 2026.2, 2.80]];
// Same chip, different price: early Nov 2026 snapshot by source and method. $/GPU-hr; null = not listed.
const GPU_SNAP = [
  { src: "Vast.ai marketplace median", kind: "Marketplace, on-demand (own API pull 6 Nov, 8–37 listings per chip)", h100: 2.39, h200: 4.37, b200: 9.69 },
  { src: "Silicon Data index", kind: "Neocloud rental index (6 Nov)", h100: 2.99, h200: 3.51, b200: 6.58 },
  { src: "Ornn OCPI", kind: "Executed trades, volume-weighted (5 Nov; moves ±10% a day)", h100: 3.13, h200: 6.45, b200: 9.46 },
  { src: "GetDeploying median", kind: "On-demand list, 46 providers (wk of 2 Nov)", h100: 3.92, h200: null, b200: null },
  { src: "Together AI", kind: "On-demand list (91–180-day reserved: H100 $3.19)", h100: 3.99, h200: 5.99, b200: 8.19 },
  { src: "Nebius", kind: "On-demand list", h100: 4.50, h200: 5.40, b200: 8.50 },
  { src: "Lambda", kind: "On-demand list, 8× node, effective 16 Nov", h100: 4.59, h200: null, b200: 7.69 },
  { src: "CoreWeave", kind: "On-demand list (GB200 $10.50)", h100: 6.16, h200: 6.31, b200: 8.60 },
  { src: "AWS p5", kind: "On-demand (spot $2.64–4.67; 3-yr plan $2.97)", h100: 6.88, h200: null, b200: null },
  { src: "Google a3-high / Azure ND H100 v5", kind: "On-demand list (aggregators)", h100: "11.06 / 12.29", h200: null, b200: null },
];
