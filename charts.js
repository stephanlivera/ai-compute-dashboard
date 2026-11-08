// ---------- HELPERS ----------
const NS = "http://www.w3.org/2000/svg";
const css = v => getComputedStyle(document.querySelector(".viz-root")).getPropertyValue(v).trim();
function el(tag, attrs = {}, parent) {
  const e = document.createElementNS(NS, tag);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(e);
  return e;
}
function niceMax(v, steps = 4) {
  const raw = v / steps, mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const n = [1, 2, 2.5, 5, 10].find(s => s * mag >= raw) * mag;
  return { max: n * steps, step: n };
}
const fmt$ = v => "$" + (v >= 100 ? Math.round(v) : v.toFixed(v < 10 ? 1 : 0)) + "B";
// Column path: square at baseline, 4px rounded data-end
function colPath(x, y, w, h, r = 4) {
  if (h <= 0) return "";
  r = Math.min(r, h, w / 2);
  return `M${x},${y + h}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h}Z`;
}
const tip = document.getElementById("tip");
function showTip(evt, html) {
  tip.innerHTML = html; tip.style.display = "block";
  const pad = 14, r = tip.getBoundingClientRect();
  let x = evt.clientX + pad, y = evt.clientY + pad;
  if (x + r.width > innerWidth - 8) x = evt.clientX - r.width - pad;
  if (y + r.height > innerHeight - 8) y = evt.clientY - r.height - pad;
  tip.style.left = x + "px"; tip.style.top = y + "px";
}
const hideTip = () => (tip.style.display = "none");
const row = (label, val, color, kind = "sw") =>
  `<div class="r"><span>${color ? `<i class="sw" style="background:var(${color})"></i>` : ""}${label}</span><span>${val}</span></div>`;

function yAxis(svg, m, W, H, max, step, fmt) {
  for (let v = 0; v <= max + 1e-9; v += step) {
    const y = m.t + H - (v / max) * H;
    el("line", { x1: m.l, x2: m.l + W, y1: y, y2: y, stroke: v === 0 ? css("--axis") : css("--grid"), "stroke-width": 1, "shape-rendering": "crispEdges" }, svg);
    el("text", { x: m.l - 8, y: y + 4, "text-anchor": "end", class: "tick" }, svg).textContent = fmt(v);
  }
}

// ---------- CHART: stacked columns ----------
function drawCapex() {
  const host = document.getElementById("c-capex"); host.innerHTML = "";
  const VW = 760, VH = 340, m = { t: 24, r: 8, b: 28, l: 52 };
  const W = VW - m.l - m.r, H = VH - m.t - m.b;
  const svg = el("svg", { viewBox: `0 0 ${VW} ${VH}`, role: "img", "aria-label": "Stacked column chart of hyperscaler capex by company, 2016 to 2027 estimate" }, host);
  const totals = CAPEX_YEARS.map((_, i) => CAPEX.reduce((s, r) => s + r[i], 0));
  const { max, step } = niceMax(Math.max(...totals));
  yAxis(svg, m, W, H, max, step, v => "$" + v + "B");
  const band = W / CAPEX_YEARS.length, bw = Math.min(24, band * 0.6), gap = 2;
  CAPEX_YEARS.forEach((yr, i) => {
    const cx = m.l + band * i + band / 2, x = cx - bw / 2;
    const est = yr >= CAPEX_EST_FROM;
    const g = el("g", { opacity: est ? 0.45 : 1 }, svg);
    let acc = 0;
    CAPEX.forEach((r, s) => {
      const v = r[i], h = (v / max) * H, yTop = m.t + H - ((acc + v) / max) * H;
      const isTop = s === CAPEX.length - 1;
      const hh = Math.max(0, h - (s > 0 ? gap : 0));
      if (isTop) el("path", { d: colPath(x, yTop, bw, hh), fill: css(COS[s].c) }, g);
      else el("rect", { x, y: yTop, width: bw, height: hh, fill: css(COS[s].c) }, g);
      acc += v;
    });
    // total label on selected columns only
    if ([0, 7, 9, 10, 11].includes(i)) {
      el("text", { x: cx, y: m.t + H - (totals[i] / max) * H - 6, "text-anchor": "middle", class: i === 10 ? "dlabel strong" : "dlabel" }, svg)
        .textContent = (est ? "~" : "") + fmt$(totals[i]) + (est ? " est." : "");
    }
    el("text", { x: cx, y: VH - 8, "text-anchor": "middle", class: "tick" }, svg).textContent = est ? yr + "E" : yr;
    // hit target: full band
    const hit = el("rect", { x: m.l + band * i, y: m.t, width: band, height: H, fill: "transparent" }, svg);
    hit.addEventListener("mousemove", e => showTip(e,
      `<div class="t">${yr}${est ? " (estimate)" : ""}</div>` +
      CAPEX.map((r, s) => row(COS[s].name, fmt$(r[i]), COS[s].c)).reverse().join("") +
      `<div class="r" style="border-top:1px solid var(--grid);margin-top:4px;padding-top:4px"><span>Total</span><span><b>${fmt$(totals[i])}</b></span></div>`));
    hit.addEventListener("mouseleave", hideTip);
  });
  document.getElementById("lg-capex").innerHTML = COS.map(c => `<span><i class="sw" style="background:var(${c.c})"></i>${c.name}</span>`).join("");
  document.getElementById("t-capex").innerHTML = table(["Year", ...COS.map(c => c.name), "Total"],
    CAPEX_YEARS.map((y, i) => [y >= CAPEX_EST_FROM ? y + "E" : y, ...CAPEX.map(r => fmt$(r[i])), fmt$(totals[i])]));
}

// ---------- CHART: simple columns ----------
function drawColumns(hostId, data, color, aria, tblId, tblHead) {
  const host = document.getElementById(hostId); host.innerHTML = "";
  const VW = 460, VH = 260, m = { t: 22, r: 8, b: 26, l: 46 };
  const W = VW - m.l - m.r, H = VH - m.t - m.b;
  const svg = el("svg", { viewBox: `0 0 ${VW} ${VH}`, role: "img", "aria-label": aria }, host);
  const { max, step } = niceMax(Math.max(...data.vals));
  yAxis(svg, m, W, H, max, step, v => "$" + v + "B");
  const band = W / data.labels.length, bw = Math.min(24, band * 0.55);
  data.labels.forEach((lab, i) => {
    const v = data.vals[i], cx = m.l + band * i + band / 2, h = (v / max) * H, y = m.t + H - h;
    const est = data.est === i;
    el("path", { d: colPath(cx - bw / 2, y, bw, h), fill: css(color), opacity: est ? 0.45 : 1 }, svg);
    if (i === data.labels.length - 1 || i === data.labels.length - 2)
      el("text", { x: cx, y: y - 6, "text-anchor": "middle", class: i === data.labels.length - 1 ? "dlabel strong" : "dlabel" }, svg).textContent = (est ? "~" : "") + fmt$(v);
    el("text", { x: cx, y: VH - 8, "text-anchor": "middle", class: "tick" }, svg).textContent = lab;
    const hit = el("rect", { x: m.l + band * i, y: m.t, width: band, height: H, fill: "transparent" }, svg);
    hit.addEventListener("mousemove", e => showTip(e, `<div class="t">${lab}${est ? " (guide midpoint)" : ""}</div>` + row(tblHead, fmt$(v), color)));
    hit.addEventListener("mouseleave", hideTip);
  });
  document.getElementById(tblId).innerHTML = table(["Period", tblHead], data.labels.map((l, i) => [l, fmt$(data.vals[i])]));
}

// ---------- CHART: log-scale training compute ----------
function drawFlop() {
  const host = document.getElementById("c-flop"); host.innerHTML = "";
  const VW = 680, VH = 320, m = { t: 16, r: 16, b: 28, l: 52 };
  const W = VW - m.l - m.r, H = VH - m.t - m.b;
  const svg = el("svg", { viewBox: `0 0 ${VW} ${VH}`, role: "img", "aria-label": "Log-scale scatter of frontier AI training compute 2016 to 2030" }, host);
  const x0 = 2016, x1 = 2030.3, lo = 21, hi = 30;
  const sx = x => m.l + ((x - x0) / (x1 - x0)) * W;
  const sy = v => m.t + H - ((Math.log10(v) - lo) / (hi - lo)) * H;
  for (let p = lo; p <= hi; p++) {
    const y = sy(Math.pow(10, p));
    el("line", { x1: m.l, x2: m.l + W, y1: y, y2: y, stroke: p === lo ? css("--axis") : css("--grid"), "shape-rendering": "crispEdges" }, svg);
    if (p % 1 === 0) el("text", { x: m.l - 8, y: y + 4, "text-anchor": "end", class: "tick" }, svg).textContent = "1e" + p;
  }
  for (let yr = 2016; yr <= 2030; yr += 2)
    el("text", { x: sx(yr), y: VH - 8, "text-anchor": "middle", class: "tick" }, svg).textContent = yr;
  // "today" marker
  const tx = sx(TODAY);
  el("line", { x1: tx, x2: tx, y1: m.t, y2: m.t + H, stroke: css("--axis") }, svg);
  el("text", { x: tx + 4, y: m.t + 10, class: "tick" }, svg).textContent = "today";
  // projection
  const [a, b] = FLOP_PROJ;
  el("line", { x1: sx(a.x), y1: sy(a.y), x2: sx(b.x), y2: sy(b.y), stroke: css("--text-muted"), "stroke-width": 2, "stroke-dasharray": "4 4", "stroke-linecap": "round" }, svg);
  el("text", { x: sx(b.x) - 10, y: sy(b.y) + 26, "text-anchor": "end", class: "dlabel" }, svg).textContent = "~2e29 FLOP by 2030";
  el("circle", { cx: sx(b.x), cy: sy(b.y), r: 4, fill: css("--surface-1"), stroke: css("--text-muted"), "stroke-width": 2 }, svg);
  // points
  const labelled = new Set(["GPT-3", "GPT-4", "Grok 3", "AlphaGo Zero", "GPT-6 Astra"]);
  FLOP.forEach(d => {
    const cx = sx(d.x), cy = sy(d.y);
    el("circle", { cx, cy, r: 5, fill: d.spec ? css("--surface-1") : css("--s1"), stroke: d.spec ? css("--s1") : css("--surface-1"), "stroke-width": 2 }, svg);
    // label placement: left of the point for the crowded 2025–26 cluster, right otherwise
    const LP = { "Grok 3": [-8, 4, "end"], "GPT-6 Astra": [-6, -10, "end"] }, [dx, dy, anc] = LP[d.m] || [8, 4, "start"];
    if (labelled.has(d.m)) el("text", { x: cx + dx, y: cy + dy, "text-anchor": anc, class: "dlabel" }, svg).textContent = d.m;
    const hit = el("circle", { cx, cy, r: 14, fill: "transparent" }, svg);
    hit.addEventListener("mousemove", e => showTip(e, `<div class="t">${d.m}</div>` + row("Year", Math.floor(d.x)) + row("Training compute", d.y.toExponential(1) + " FLOP") + (d.spec ? `<div class="muted">Epoch rates this estimate "speculative"</div>` : "")));
    hit.addEventListener("mouseleave", hideTip);
  });
  document.getElementById("t-flop").innerHTML = table(["Model", "Year", "Training FLOP"],
    [...FLOP.map(d => [d.m, Math.floor(d.x), d.y.toExponential(1)]), ["Projection (Epoch feasibility)", 2030, "2e+29"]]);
}

// ---------- CHART: PJM capacity auction prices ----------
function drawPjm() {
  const bars = PJM.map(([lab, v, n, cap, dc]) => ({ lab, v, c: "--s1", label: 1, strong: lab === "2028/29",
    n: n + (dc ? `. Data-centre load: $${dc.toFixed(2)}bn of the charges (IMM)` : "") }));
  const r = columnChart({ host: "c-pjm", aria: "Column chart of PJM capacity auction clearing prices: $28.92 per MW-day for 2024/25, then $270 to $333 for 2025/26 to 2028/29, the last three at the price cap; 2028/29 would have cleared about $555 uncapped",
    VW: 680, VH: 300, m: { t: 26, r: 12, b: 28, l: 52 }, bars, max: 600, step: 150, bw: 40, fmt: v => "$" + (v < 100 ? v.toFixed(2) : Math.round(v)), yfmt: v => "$" + v, valLabel: "$ per MW-day" });
  // cap markers, and the uncapped 2028/29 price as a dashed outline above its bar
  PJM.forEach(([lab, v, , cap], i) => {
    if (!cap) return;
    const cx = r.m.l + r.band * i + r.band / 2, y = r.m.t + r.H - (v / r.max) * r.H;
    el("text", { x: cx, y: y + 16, "text-anchor": "middle", class: "tick", fill: "#fff", style: "fill:#fff" }, r.svg).textContent = "cap";
  });
  const iL = PJM.length - 1, cx = r.m.l + r.band * iL + r.band / 2, yC = r.m.t + r.H - (PJM[iL][1] / r.max) * r.H, yU = r.m.t + r.H - (PJM_UNCAPPED / r.max) * r.H;
  el("rect", { x: cx - 20, y: yU, width: 40, height: yC - yU - 22, fill: "none", stroke: css("--s1"), "stroke-width": 1.5, "stroke-dasharray": "4 3", rx: 4 }, r.svg);
  el("text", { x: cx - 26, y: yU + 10, "text-anchor": "end", class: "dlabel" }, r.svg).textContent = "≈$555 without the cap";
  document.getElementById("t-pjm").innerHTML = table(["Delivery year", "$/MW-day", "At cap", "Data-centre charges (IMM)", "Note"],
    PJM.map(([lab, v, n, cap, dc]) => [lab, "$" + v.toFixed(2), cap ? "yes" : "no", dc ? "$" + dc.toFixed(2) + "bn" : "—", n]).concat([["2028/29 uncapped", "≈$" + PJM_UNCAPPED.toFixed(1), "", "", "Without the price collar"]]));
}

// ---------- SEGMENTED BAR + GUIDE TABLE ----------
function drawShare() {
  const i26 = CAPEX_YEARS.indexOf(2026), i25 = i26 - 1;
  const tot = CAPEX.reduce((s, r) => s + r[i26], 0);
  const seg = document.getElementById("seg26");
  seg.innerHTML = ""; seg.setAttribute("role", "img");
  seg.setAttribute("aria-label", COS.map((c, s) => `${c.name} ${Math.round(CAPEX[s][i26] / tot * 100)}%`).join(", "));
  COS.forEach((c, s) => {
    const v = CAPEX[s][i26], pct = Math.round(v / tot * 100);
    const d = document.createElement("div");
    d.style.flex = v; d.style.background = `var(${c.c})`;
    if (c.c === "--s4") d.className = "dark-ink";
    d.textContent = pct + "%";
    d.addEventListener("mousemove", e => showTip(e, `<div class="t">${c.name}</div>` + row("2026 capex", fmt$(v), c.c) + row("Share", pct + "%")));
    d.addEventListener("mouseleave", hideTip);
    seg.appendChild(d);
  });
  document.getElementById("lg-seg").innerHTML = COS.map(c => `<span><i class="sw" style="background:var(${c.c})"></i>${c.name}</span>`).join("");
  const guides = CAPEX_GUIDES;
  document.getElementById("guide-body").innerHTML = COS.map((c, s) =>
    `<tr><td><i class="sw" style="background:var(${c.c});margin-right:6px"></i>${c.name}</td><td class="num">${guides[s]}</td><td class="num">+${Math.round((CAPEX[s][i26] / CAPEX[s][i25] - 1) * 100)}%</td></tr>`).join("");
}

// ---------- CHART: GW stacked (AI vs non-AI) ----------
function drawGW() {
  const host = document.getElementById("c-gw"); host.innerHTML = "";
  const VW = 760, VH = 320, m = { t: 26, r: 8, b: 28, l: 52 };
  const W = VW - m.l - m.r, H = VH - m.t - m.b;
  const svg = el("svg", { viewBox: `0 0 ${VW} ${VH}`, role: "img", "aria-label": "Stacked column chart of global data-centre capacity in GW, AI vs non-AI, 2015 to 2030" }, host);
  const tot = GW_YEARS.map((_, i) => GW_AI[i] + GW_NONAI[i]);
  const { max, step } = niceMax(Math.max(...tot), 5);
  yAxis(svg, m, W, H, max, step, v => v + " GW");
  const band = W / GW_YEARS.length, bw = Math.min(24, band * 0.6);
  // era divider: ChatGPT launch (end-2022)
  const divX = m.l + band * GW_YEARS.indexOf(2023);
  el("line", { x1: divX, x2: divX, y1: m.t - 10, y2: m.t + H, stroke: css("--axis") }, svg);
  el("text", { x: divX - 6, y: m.t - 2, "text-anchor": "end", class: "tick" }, svg).textContent = "← pre-AI era";
  el("text", { x: divX + 6, y: m.t - 2, class: "tick" }, svg).textContent = "ChatGPT (Nov 2022) → AI era";
  GW_YEARS.forEach((yr, i) => {
    const cx = m.l + band * i + band / 2, x = cx - bw / 2;
    const fc = yr > GW_FORECAST_FROM, interp = yr > 2025 && yr < 2030;
    const g = el("g", { opacity: interp ? 0.5 : (fc ? 0.75 : 1) }, svg);
    const hN = (GW_NONAI[i] / max) * H, hA = (GW_AI[i] / max) * H;
    const yN = m.t + H - hN;
    el("rect", { x, y: yN, width: bw, height: hN, fill: css("--neutral") }, g);
    const hAg = Math.max(0, hA - 2);
    if (hAg > 0.5) el("path", { d: colPath(x, yN - hA, bw, hAg), fill: css("--s1") }, g);
    if ([0, 9, 11, 15].includes(i))
      el("text", { x: cx, y: m.t + H - (tot[i] / max) * H - 6, "text-anchor": "middle", class: yr === GW_TODAY ? "dlabel strong" : "dlabel" }, svg)
        .textContent = "~" + Math.round(tot[i]) + " GW";
    el("text", { x: cx, y: VH - 8, "text-anchor": "middle", class: "tick" }, svg).textContent = (i % 2 === 1 || yr === 2030) ? yr : "";
    const hit = el("rect", { x: m.l + band * i, y: m.t, width: band, height: H, fill: "transparent" }, svg);
    const tag = yr <= 2024 ? "modeled estimate" : yr === 2025 || yr === 2030 ? "McKinsey" : "interpolated";
    hit.addEventListener("mousemove", e => showTip(e,
      `<div class="t">${yr} <span class="muted">(${tag})</span></div>` +
      row("AI", GW_AI[i] + " GW", "--s1") + row("Non-AI", GW_NONAI[i] + " GW", "--neutral") +
      `<div class="r" style="border-top:1px solid var(--grid);margin-top:4px;padding-top:4px"><span>Total · AI share</span><span><b>${Math.round(tot[i])} GW</b> · ${Math.round(GW_AI[i] / tot[i] * 100)}%</span></div>`));
    hit.addEventListener("mouseleave", hideTip);
  });
  document.getElementById("t-gw").innerHTML = table(["Year", "AI GW", "Non-AI GW", "Total GW", "AI share"],
    GW_YEARS.map((y, i) => [y, GW_AI[i], GW_NONAI[i], Math.round(tot[i]), Math.round(GW_AI[i] / tot[i] * 100) + "%"]));

  // forecast comparison: horizontal bars
  const fh = document.getElementById("c-fc"); fh.innerHTML = "";
  const FW = 360, rowH = 34, FH = FORECASTS_2030.length * rowH + 4, lw = 0;
  const fs = el("svg", { viewBox: `0 0 ${FW} ${FH}`, role: "img", "aria-label": "2030 data-centre GW forecasts by forecaster" }, fh);
  const fmax = 250;
  FORECASTS_2030.forEach((f, i) => {
    const y = i * rowH;
    el("text", { x: 0, y: y + 11, class: "tick" }, fs).textContent = f.who;
    const w = (f.gw / fmax) * (FW - 60);
    // horizontal bar: square at baseline (left), rounded at data end (right)
    const r = 4, h = 12, by = y + 16;
    el("path", { d: `M0,${by}H${w - r}Q${w},${by} ${w},${by + r}V${by + h - r}Q${w},${by + h} ${w - r},${by + h}H0Z`, fill: css("--neutral") }, fs);
    el("text", { x: w + 6, y: by + 10, class: "dlabel" }, fs).textContent = f.gw + " GW";
  });
}

// ---------- CHART: token deflation (log-scale step lines) ----------
const decYear = s => { const d = Date.parse(s + "T00:00:00Z"), y = new Date(d).getUTCFullYear(); return y + (d - Date.UTC(y, 0, 1)) / (365.25 * 864e5); };
const fmtP = v => "$" + v.toFixed(2);
const mon = s => new Date(s + "T00:00:00Z").toLocaleDateString("en-GB", { month: "short", year: "numeric", timeZone: "UTC" });
function deflStats(s) {
  const a = s.pts[0], b = s.pts[s.pts.length - 1];
  const total = a[2] / b[2], yrs = decYear(b[1]) - decYear(a[1]);
  return { a, b, total, perYr: Math.pow(total, 1 / yrs) };
}
function drawDefl() {
  const host = document.getElementById("c-defl"); host.innerHTML = "";
  const VW = 760, VH = 340, m = { t: 18, r: 168, b: 28, l: 56 };
  const W = VW - m.l - m.r, H = VH - m.t - m.b;
  const svg = el("svg", { viewBox: `0 0 ${VW} ${VH}`, role: "img", "aria-label": "Log-scale step chart of the cheapest price per million tokens to reach fixed benchmark scores, 2021 to 2025, by task" }, host);
  const endX = decYear(DEFL_END), x0 = 2021.75, x1 = endX + 0.04, lo = Math.log10(0.04), hi = 2;
  const sx = x => m.l + ((x - x0) / (x1 - x0)) * W;
  const sy = v => m.t + H - ((Math.log10(v) - lo) / (hi - lo)) * H;
  el("line", { x1: m.l, x2: m.l + W, y1: m.t + H, y2: m.t + H, stroke: css("--axis"), "shape-rendering": "crispEdges" }, svg);
  [0.1, 1, 10, 100].forEach(v => {
    el("line", { x1: m.l, x2: m.l + W, y1: sy(v), y2: sy(v), stroke: css("--grid"), "shape-rendering": "crispEdges" }, svg);
    el("text", { x: m.l - 8, y: sy(v) + 4, "text-anchor": "end", class: "tick" }, svg).textContent = v < 1 ? "$0.10" : "$" + v;
  });
  for (let yr = 2022; yr <= 2025; yr++)
    el("text", { x: sx(yr), y: VH - 8, "text-anchor": "middle", class: "tick" }, svg).textContent = yr;

  const series = DEFL.map(s => ({ ...s, P: s.pts.map(p => ({ m: p[0], d: p[1], x: decYear(p[1]), y: p[2] })), st: deflStats(s) }));
  // draw neutral reference first so coloured lines sit on top
  [...series].sort((a, b) => (b.dash ? 1 : 0) - (a.dash ? 1 : 0)).forEach(s => {
    const P = s.P;
    let d = `M${sx(P[0].x)},${sy(P[0].y)}`;
    for (let i = 1; i < P.length; i++) d += `H${sx(P[i].x)}V${sy(P[i].y)}`;
    d += `H${sx(endX)}`;
    el("path", { d, fill: "none", stroke: css(s.c), "stroke-width": 2, "stroke-linejoin": "round", "stroke-linecap": "round", ...(s.dash ? { "stroke-dasharray": "5 4" } : {}) }, svg);
    P.forEach(p => el("circle", { cx: sx(p.x), cy: sy(p.y), r: 4, fill: css(s.c), stroke: css("--surface-1"), "stroke-width": 2 }, svg));
  });
  // start annotations
  el("text", { x: sx(decYear("2023-03-14")) + 8, y: sy(37.5) - 8, class: "dlabel strong" }, svg).textContent = "GPT-4 launch: $37.50";
  el("text", { x: sx(decYear("2021-11-20")) + 8, y: sy(60) - 8, class: "dlabel" }, svg).textContent = "GPT-3: $60";
  // end labels, de-collided
  const ends = series.map(s => ({ s, y: sy(s.P[s.P.length - 1].y) })).sort((a, b) => a.y - b.y);
  const gap = 14;
  for (let i = 1; i < ends.length; i++) if (ends[i].y - ends[i - 1].y < gap) ends[i].y = ends[i - 1].y + gap;
  const overflow = ends[ends.length - 1].y - (m.t + H + 4);
  if (overflow > 0) ends.forEach(e => (e.y -= overflow));
  ends.forEach(e => {
    const ly = sy(e.s.P[e.s.P.length - 1].y);
    el("line", { x1: sx(endX) + 3, x2: sx(endX) + 10, y1: ly, y2: e.y, stroke: css("--axis") }, svg);
    const t = el("text", { x: sx(endX) + 14, y: e.y + 4, class: "dlabel" }, svg);
    t.textContent = `${e.s.lab}: ${Math.round(e.s.st.total)}× cheaper`;
  });
  // crosshair + tooltip
  const cross = el("line", { y1: m.t, y2: m.t + H, stroke: css("--axis"), "stroke-width": 1, visibility: "hidden" }, svg);
  const hit = el("rect", { x: m.l, y: m.t, width: sx(endX) - m.l, height: H, fill: "transparent" }, svg);
  hit.addEventListener("mousemove", e => {
    const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
    const px = pt.matrixTransform(svg.getScreenCTM().inverse()).x;
    const t = x0 + ((px - m.l) / W) * (x1 - x0);
    cross.setAttribute("x1", px); cross.setAttribute("x2", px); cross.setAttribute("visibility", "visible");
    const yr = Math.floor(t), mo = Math.min(11, Math.floor((t - yr) * 12));
    const when = new Date(Date.UTC(yr, mo, 1)).toLocaleDateString("en-GB", { month: "short", year: "numeric", timeZone: "UTC" });
    showTip(e, `<div class="t">Cheapest at the bar, ${when}</div>` + series.map(s => {
      const cur = [...s.P].reverse().find(p => p.x <= t);
      return row(`${s.lab} <span class="muted">(${s.lvl})</span>`, cur ? `${fmtP(cur.y)} · ${cur.m}` : "not yet reached", s.c);
    }).join(""));
  });
  hit.addEventListener("mouseleave", () => { hideTip(); cross.setAttribute("visibility", "hidden"); });

  document.getElementById("lg-defl").innerHTML = series.map(s =>
    `<span><i class="sw line" style="background:var(${s.c})${s.dash ? ";opacity:.8" : ""}"></i>${s.lab}: ${s.task}${s.dash ? " (GPT-3 level)" : ""}</span>`).join("");
  document.getElementById("defl-body").innerHTML = series.map(s =>
    `<tr><td><i class="sw" style="background:var(${s.c});margin-right:6px"></i>${s.lab}<div class="muted">${s.task} · ${mon(s.st.a[1])} → ${mon(s.st.b[1])}</div></td>` +
    `<td class="num">${Math.round(s.st.total)}×</td><td class="num"><b>~${Math.round(s.st.perYr)}×</b></td></tr>`).join("");
  document.getElementById("t-defl").innerHTML = table(["Task (threshold)", "Model", "Date", "USD / 1M tokens"],
    series.flatMap(s => s.P.map(p => [`${s.lab}: ${s.task}`, p.m, p.d, fmtP(p.y)])));
}

// ---------- CHART: lab revenue run-rate (log) + projection fans ----------
const fmtB = v => v >= 1000 ? "$" + (v / 1000).toFixed(1) + "T" : v >= 10 ? "$" + Math.round(v) + "B" : "$" + v.toFixed(1) + "B";
function drawRev() {
  const host = document.getElementById("c-rev"); host.innerHTML = "";
  const VW = 760, VH = 360, m = { t: 18, r: 150, b: 28, l: 52 };
  const W = VW - m.l - m.r, H = VH - m.t - m.b;
  const svg = el("svg", { viewBox: `0 0 ${VW} ${VH}`, role: "img", "aria-label": "Log-scale line chart of OpenAI and Anthropic annualised revenue run-rate, 2023 to 2026, with illustrative projection ranges to 2028" }, host);
  const x0 = 2023.5, x1 = REV_PROJ.end, lo = Math.log10(0.6), hi = Math.log10(1500);
  const sx = x => m.l + ((x - x0) / (x1 - x0)) * W;
  const sy = v => m.t + H - ((Math.log10(v) - lo) / (hi - lo)) * H;
  el("line", { x1: m.l, x2: m.l + W, y1: m.t + H, y2: m.t + H, stroke: css("--axis"), "shape-rendering": "crispEdges" }, svg);
  [1, 10, 100, 1000].forEach(v => {
    el("line", { x1: m.l, x2: m.l + W, y1: sy(v), y2: sy(v), stroke: css("--grid"), "shape-rendering": "crispEdges" }, svg);
    el("text", { x: m.l - 8, y: sy(v) + 4, "text-anchor": "end", class: "tick" }, svg).textContent = v >= 1000 ? "$1T" : "$" + v + "B";
  });
  for (let yr = 2024; yr <= 2028; yr++)
    el("text", { x: sx(yr), y: VH - 8, "text-anchor": "middle", class: "tick" }, svg).textContent = yr;
  const tx = sx(TODAY);
  el("line", { x1: tx, x2: tx, y1: m.t, y2: m.t + H, stroke: css("--axis") }, svg);
  el("text", { x: tx + 4, y: m.t + 10, class: "tick" }, svg).textContent = "today · projections →";

  const labs = LABS.map(L => {
    const P = L.pts.map(p => ({ x: decYear(p[0]), d: p[0], v: p[1], s: p[2] }));
    const last = P[P.length - 1];
    const proj = r => last.v * Math.pow(r, x1 - last.x);
    return { ...L, P, last, X: L.extra.map(p => ({ x: decYear(p[0]), d: p[0], v: p[1], s: p[2] })), end: { lo: proj(REV_PROJ.lo), mid: proj(REV_PROJ.mid), hi: proj(REV_PROJ.hi) } };
  });
  // fans first, under the lines
  labs.forEach(L => {
    const a = [sx(L.last.x), sy(L.last.v)];
    el("path", { d: `M${a}L${sx(x1)},${sy(L.end.hi)}L${sx(x1)},${sy(L.end.lo)}Z`, fill: css(L.c), opacity: 0.12 }, svg);
    el("line", { x1: a[0], y1: a[1], x2: sx(x1), y2: sy(L.end.mid), stroke: css(L.c), "stroke-width": 2, "stroke-dasharray": "5 4", "stroke-linecap": "round" }, svg);
  });
  labs.forEach(L => {
    el("path", { d: L.P.map((p, i) => (i ? "L" : "M") + sx(p.x) + "," + sy(p.v)).join(""), fill: "none", stroke: css(L.c), "stroke-width": 2, "stroke-linejoin": "round", "stroke-linecap": "round" }, svg);
    L.P.forEach(p => el("circle", { cx: sx(p.x), cy: sy(p.v), r: 4, fill: css(L.c), stroke: css("--surface-1"), "stroke-width": 2 }, svg));
    L.X.forEach(p => el("circle", { cx: sx(p.x), cy: sy(p.v), r: 4, fill: css("--surface-1"), stroke: css(L.c), "stroke-width": 2 }, svg));
    const oa = L.name === "OpenAI";
    el("text", { x: sx(L.last.x) + (oa ? 6 : -10), y: sy(L.last.v) + (oa ? 22 : -10), "text-anchor": oa ? "start" : "end", class: "dlabel strong" }, svg).textContent = `${L.name} ${fmtB(L.last.v)}`;
  });
  // end labels for midlines, de-collided
  const ends = labs.map(L => ({ L, y: sy(L.end.mid) })).sort((a, b) => a.y - b.y);
  if (ends[1].y - ends[0].y < 28) ends[1].y = ends[0].y + 28;
  ends.forEach(e => {
    el("text", { x: sx(x1) + 8, y: e.y, class: "dlabel strong" }, svg).textContent = `${e.L.name} ~${fmtB(e.L.end.mid)}`;
    el("text", { x: sx(x1) + 8, y: e.y + 13, class: "tick" }, svg).textContent = `${fmtB(e.L.end.lo)}–${fmtB(e.L.end.hi)} by end-2028`;
  });
  // crosshair tooltip
  const cross = el("line", { y1: m.t, y2: m.t + H, stroke: css("--axis"), visibility: "hidden" }, svg);
  const hit = el("rect", { x: m.l, y: m.t, width: W, height: H, fill: "transparent" }, svg);
  hit.addEventListener("mousemove", e => {
    const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
    const px = pt.matrixTransform(svg.getScreenCTM().inverse()).x;
    const t = x0 + ((px - m.l) / W) * (x1 - x0);
    cross.setAttribute("x1", px); cross.setAttribute("x2", px); cross.setAttribute("visibility", "visible");
    const yr = Math.floor(t), mo = Math.min(11, Math.floor((t - yr) * 12));
    const when = new Date(Date.UTC(yr, mo, 1)).toLocaleDateString("en-GB", { month: "short", year: "numeric", timeZone: "UTC" });
    let html = `<div class="t">${when}</div>`;
    labs.forEach(L => {
      if (t <= L.last.x) {
        const cur = [...L.P].reverse().find(p => p.x <= t);
        html += row(L.name, cur ? `${fmtB(cur.v)} <span class="muted">(${mon(cur.d)}, ${cur.s})</span>` : "no data yet", L.c);
      } else {
        const dt = t - L.last.x, f = r => fmtB(L.last.v * Math.pow(r, dt));
        html += row(L.name + " <span class=\"muted\">(illustrative)</span>", `~${f(REV_PROJ.mid)} <span class="muted">(${f(REV_PROJ.lo)}–${f(REV_PROJ.hi)})</span>`, L.c);
      }
      L.X.filter(p => Math.abs(p.x - t) < 0.06).forEach(p => html += `<div class="muted" style="margin-top:2px">○ ${fmtB(p.v)}: ${p.s}</div>`);
    });
    showTip(e, html);
  });
  hit.addEventListener("mouseleave", () => { hideTip(); cross.setAttribute("visibility", "hidden"); });

  document.getElementById("lg-rev").innerHTML = labs.map(L => `<span><i class="sw" style="background:var(${L.c})"></i>${L.name}</span>`).join("") +
    `<span><i class="sw" style="background:transparent;border:2px solid var(--text-muted);border-radius:50%"></i>Estimate / target / unconfirmed</span>` +
    `<span><i class="sw line" style="background:var(--text-muted)"></i>Illustrative path (2×/yr, band 1.5–3×)</span>`;
  const rows = [];
  labs.forEach(L => {
    L.P.forEach(p => rows.push([L.name, p.d, fmtB(p.v), p.s]));
    L.X.forEach(p => rows.push([L.name, p.d, fmtB(p.v) + " ○", p.s]));
    rows.push([L.name, "end-2028 (illustrative)", `~${fmtB(L.end.mid)}`, `${fmtB(L.end.lo)}–${fmtB(L.end.hi)} at 1.5–3×/yr from ${fmtB(L.last.v)} (${mon(L.last.d)})`]);
  });
  document.getElementById("t-rev").innerHTML = table(["Company", "Date", "Run-rate", "Source / note"], rows);
}

// ---------- CHART: METR time horizon (log) ----------
const fmtDur = mins => {
  if (mins < 1) return Math.round(mins * 60) + " sec";
  if (mins < 60) return (mins < 10 ? mins.toFixed(1) : Math.round(mins)) + " min";
  const h = mins / 60; return (h < 10 ? h.toFixed(1) : Math.round(h)) + " h";
};
function drawMetr() {
  const host = document.getElementById("c-metr"); host.innerHTML = "";
  const VW = 760, VH = 360, m = { t: 18, r: 20, b: 28, l: 64 };
  const W = VW - m.l - m.r, H = VH - m.t - m.b;
  const svg = el("svg", { viewBox: `0 0 ${VW} ${VH}`, role: "img", "aria-label": "Log-scale scatter of METR 50% time horizon by model release date, 2019 to 2026, rising from seconds to about 17 hours" }, host);
  const x0 = 2019, x1 = 2027.1, lo = Math.log10(0.02), hi = Math.log10(4800);
  const sx = x => m.l + ((x - x0) / (x1 - x0)) * W;
  const sy = v => m.t + H - ((Math.log10(v) - lo) / (hi - lo)) * H;
  el("line", { x1: m.l, x2: m.l + W, y1: m.t + H, y2: m.t + H, stroke: css("--axis"), "shape-rendering": "crispEdges" }, svg);
  // unreliable zone above 16 h
  const y16 = sy(16 * 60);
  el("rect", { x: m.l, y: m.t, width: W, height: y16 - m.t, fill: css("--neutral"), opacity: 0.08 }, svg);
  el("text", { x: m.l + 6, y: m.t + 12, class: "tick" }, svg).textContent = "above 16 h: METR says its task suite can't measure reliably";
  [[1 / 6, "10 sec"], [1, "1 min"], [10, "10 min"], [60, "1 hour"], [480, "8 h (workday)"], [2400, "1 week (40 h)"]].forEach(([v, lab]) => {
    el("line", { x1: m.l, x2: m.l + W, y1: sy(v), y2: sy(v), stroke: css("--grid"), "shape-rendering": "crispEdges" }, svg);
    el("text", { x: m.l - 8, y: sy(v) + 4, "text-anchor": "end", class: "tick" }, svg).textContent = lab;
  });
  for (let yr = 2019; yr <= 2027; yr++)
    el("text", { x: sx(yr), y: VH - 8, "text-anchor": "middle", class: "tick" }, svg).textContent = yr;

  const P = METR.map(r => ({ m: r[0], d: r[1], x: decYear(r[1]), v: r[2], lo: r[3], hi: r[4], p80: r[5] })).sort((a, b) => a.x - b.x);
  let best = 0; P.forEach(p => { p.frontier = p.v > best; if (p.frontier) best = p.v; });
  // trend: METR's post-2023 doubling time, intercept fit by least squares on post-2023 points ≤ 16 h
  const slope = 365.25 / METR_DOUBLING_DAYS; // doublings per year
  const fitPts = P.filter(p => p.x >= 2023 && p.v <= 960);
  const b = fitPts.reduce((s, p) => s + Math.log2(p.v) - slope * p.x, 0) / fitPts.length;
  const trend = x => Math.pow(2, b + slope * x);
  const lastX = P[P.length - 1].x;
  el("line", { x1: sx(2023), y1: sy(trend(2023)), x2: sx(lastX), y2: sy(trend(lastX)), stroke: css("--text-muted"), "stroke-width": 2, "stroke-linecap": "round" }, svg);
  el("line", { x1: sx(lastX), y1: sy(trend(lastX)), x2: sx(2027), y2: sy(trend(2027)), stroke: css("--text-muted"), "stroke-width": 2, "stroke-dasharray": "4 4", "stroke-linecap": "round" }, svg);
  document.getElementById("metr-trend-note").textContent = `(dashed: ~${fmtDur(trend(2027))} by Jan 2027 if it holds)`;
  // "today"
  const tx = sx(TODAY);
  el("line", { x1: tx, x2: tx, y1: y16, y2: m.t + H, stroke: css("--axis") }, svg);
  el("text", { x: tx - 4, y: m.t + H - 6, "text-anchor": "end", class: "tick" }, svg).textContent = "today";
  // points: others first, frontier on top
  [...P.filter(p => !p.frontier), ...P.filter(p => p.frontier)].forEach(p => {
    el("circle", { cx: sx(p.x), cy: sy(p.v), r: p.frontier ? 5 : 4, fill: css(p.frontier ? "--s1" : "--neutral"), stroke: css("--surface-1"), "stroke-width": 2 }, svg);
  });
  const labelled = { "GPT-2": [8, 4], "davinci-002 (GPT-3)": [8, 4], "GPT-3.5 Turbo Instruct": [8, 4], "GPT-4": [-8, -8, "end"], "o1": [-8, -8, "end"],
    "GPT-5": [-8, -8, "end"], "Claude Mythos Preview (early)": [-8, -8, "end"] };
  P.forEach(p => {
    const L = labelled[p.m]; if (!L) return;
    el("text", { x: sx(p.x) + L[0], y: sy(p.v) + L[1], "text-anchor": L[2] || "start", class: p.m.startsWith("Claude Mythos") ? "dlabel strong" : "dlabel" }, svg)
      .textContent = `${p.m.replace(" (early)", "")} · ${fmtDur(p.v)}`;
  });
  // per-point hover
  P.forEach(p => {
    const hit = el("circle", { cx: sx(p.x), cy: sy(p.v), r: 12, fill: "transparent" }, svg);
    hit.addEventListener("mousemove", e => showTip(e, `<div class="t">${p.m}</div>` + row("Released", mon(p.d)) +
      row("50% horizon", `<b>${fmtDur(p.v)}</b>`, p.frontier ? "--s1" : "--neutral") + row("95% CI", `${fmtDur(p.lo)}–${fmtDur(p.hi)}`) + row("80% horizon", fmtDur(p.p80)) +
      (p.frontier ? `<div class="muted" style="margin-top:4px">New frontier at release</div>` : "")));
    hit.addEventListener("mouseleave", hideTip);
  });
  document.getElementById("t-metr").innerHTML = table(["Model", "Released", "50% horizon", "95% CI", "80% horizon"],
    P.map(p => [p.m + (p.frontier ? " ★" : ""), p.d, fmtDur(p.v), `${fmtDur(p.lo)}–${fmtDur(p.hi)}`, fmtDur(p.p80)]));

  // automation vs augmentation bars
  [["seg-ai-chat", AEI.chat], ["seg-ai-api", AEI.api]].forEach(([id, parts]) => {
    const seg = document.getElementById(id); seg.innerHTML = ""; seg.setAttribute("role", "img");
    seg.setAttribute("aria-label", parts.map(p => `${p[0]} ${p[1]}%`).join(", "));
    parts.forEach(([lab, v, c]) => {
      const d = document.createElement("div");
      d.style.flex = v; d.style.background = `var(${c})`;
      d.textContent = v >= 10 ? v + "%" : "";
      d.addEventListener("mousemove", e => showTip(e, `<div class="t">${lab}</div>` + row("Share of conversations", v + "%", c)));
      d.addEventListener("mouseleave", hideTip);
      seg.appendChild(d);
    });
  });
}

// ---------- CHART: CDS bars + sparse timeline ----------
const implied5y = bps => 1 - Math.exp(-5 * (bps / 1e4) / (1 - 0.4));
const ST_VAR = { critical: "--st-critical", serious: "--st-serious", warning: "--st-warning", good: "--st-good", none: "--neutral" };
function drawCds() {
  const host = document.getElementById("c-cds"); host.innerHTML = "";
  const rowH = 34, VW = 700, m = { t: 22, r: 190, b: 22, l: 150 };
  const VH = m.t + m.b + CDS.length * rowH, W = VW - m.l - m.r;
  const svg = el("svg", { viewBox: `0 0 ${VW} ${VH}`, role: "img", "aria-label": "Bar chart of latest 5-year CDS spreads: CoreWeave about 1,155 bps, Oracle 305, Nvidia 139, Meta 125, Amazon 100, Alphabet 92, Microsoft 53" }, host);
  const max = 1400, sx = v => m.l + (v / max) * W;
  [0, 250, 500, 750, 1000].forEach(v => {
    el("line", { x1: sx(v), x2: sx(v), y1: m.t - 4, y2: VH - m.b, stroke: v === 0 ? css("--axis") : css("--grid"), "shape-rendering": "crispEdges" }, svg);
    el("text", { x: sx(v), y: VH - 6, "text-anchor": "middle", class: "tick" }, svg).textContent = v;
  });
  el("line", { x1: sx(1000), x2: sx(1000), y1: m.t - 10, y2: VH - m.b, stroke: css("--st-critical"), "stroke-width": 1.5, "stroke-dasharray": "4 3" }, svg);
  el("text", { x: sx(1000), y: m.t - 12, "text-anchor": "middle", class: "tick" }, svg).textContent = "distress (1,000)";
  CDS.forEach((r, i) => {
    const y = m.t + i * rowH, cy = y + rowH / 2;
    el("text", { x: m.l - 10, y: cy + 4, "text-anchor": "end", class: "dlabel" }, svg).textContent = r.co;
    if (r.bps != null) {
      const w = sx(r.bps) - m.l, h = 14, by = cy - h / 2, rr = 4;
      el("path", { d: `M${m.l},${by}H${m.l + w - rr}Q${m.l + w},${by} ${m.l + w},${by + rr}V${by + h - rr}Q${m.l + w},${by + h} ${m.l + w - rr},${by + h}H${m.l}Z`, fill: css(ST_VAR[r.st]) }, svg);
      el("text", { x: m.l + w + 6, y: cy + 4, class: "dlabel strong" }, svg).textContent = r.bps.toLocaleString();
    } else {
      el("text", { x: m.l + 4, y: cy + 4, class: "tick" }, svg).textContent = r.st === "none" ? "—" : "level not published";
    }
    // status: icon + label (never colour alone)
    el("circle", { cx: VW - m.r + 16, cy, r: 5, fill: css(ST_VAR[r.st]) }, svg);
    el("text", { x: VW - m.r + 26, y: cy + 4, class: "tick" }, svg).textContent = r.stLab;
    const hit = el("rect", { x: 0, y, width: VW, height: rowH, fill: "transparent" }, svg);
    hit.addEventListener("mousemove", e => showTip(e, `<div class="t">${r.co}</div>` +
      (r.bps != null ? row("5y CDS", `<b>${r.bps.toLocaleString()} bps</b>`, ST_VAR[r.st]) + row("Implied 5y default (risk-neutral)", Math.round(implied5y(r.bps) * 100) + "%") : row("5y CDS", r.stLab, ST_VAR[r.st])) +
      (r.chg ? row("Change", r.chg) : "") + (r.d ? row("As of", `${r.d} · ${r.src}`) : "") + (r.note ? `<div class="muted" style="margin-top:4px;max-width:260px">${r.note}</div>` : "")));
    hit.addEventListener("mouseleave", hideTip);
  });
  document.getElementById("t-cds").innerHTML = table(["Company", "5y CDS (bps)", "Implied 5y default", "Change", "As of / source", "State"],
    CDS.map(r => [r.co, r.bps ?? "n/a", r.bps != null ? Math.round(implied5y(r.bps) * 100) + "%" : "", r.chg || "", r.d ? `${r.d} · ${r.src}` : "", r.stLab]));

  // timeline
  const th = document.getElementById("c-cdst"); th.innerHTML = "";
  const TW = 460, TH = 280, tm = { t: 14, r: 64, b: 26, l: 40 };
  const tW = TW - tm.l - tm.r, tH = TH - tm.t - tm.b;
  const ts = el("svg", { viewBox: `0 0 ${TW} ${TH}`, role: "img", "aria-label": "Line chart of CoreWeave, Oracle and Meta 5-year CDS from October 2025 to November 2026" }, th);
  const x0 = decYear("2025-10-01"), x1 = decYear("2026-11-10");
  const tx = x => tm.l + ((x - x0) / (x1 - x0)) * tW, ty = v => tm.t + tH - (v / 1400) * tH;
  [0, 400, 800, 1200].forEach(v => {
    el("line", { x1: tm.l, x2: tm.l + tW, y1: ty(v), y2: ty(v), stroke: v === 0 ? css("--axis") : css("--grid"), "shape-rendering": "crispEdges" }, ts);
    el("text", { x: tm.l - 6, y: ty(v) + 4, "text-anchor": "end", class: "tick" }, ts).textContent = v;
  });
  el("line", { x1: tm.l, x2: tm.l + tW, y1: ty(1000), y2: ty(1000), stroke: css("--st-critical"), "stroke-width": 1.5, "stroke-dasharray": "4 3" }, ts);
  el("text", { x: tm.l + 4, y: ty(1000) - 5, class: "tick" }, ts).textContent = "distress";
  [["2026-01-01", "Jan 26"], ["2026-04-01", "Apr"], ["2026-07-01", "Jul"], ["2026-10-01", "Oct"]].forEach(([d, l]) =>
    el("text", { x: tx(decYear(d)), y: TH - 8, "text-anchor": "middle", class: "tick" }, ts).textContent = l);
  CDS_TS.forEach(s => {
    const P = s.pts.map(p => ({ d: p[0], x: decYear(p[0]), v: p[1], der: !!p[2] }));
    // segments spanning > ~2 months between prints are dashed: no data in between
    P.slice(1).forEach((p, i) => { const a = P[i]; const gap = p.x - a.x > 0.17;
      el("line", { x1: tx(a.x), y1: ty(a.v), x2: tx(p.x), y2: ty(p.v), stroke: css(s.c), "stroke-width": 2, "stroke-linecap": "round", ...(gap ? { "stroke-dasharray": "3 4", opacity: 0.7 } : {}) }, ts); });
    P.forEach(p => {
      el("circle", { cx: tx(p.x), cy: ty(p.v), r: 4, fill: p.der ? css("--surface-1") : css(s.c), stroke: p.der ? css(s.c) : css("--surface-1"), "stroke-width": 2 }, ts);
      const hit = el("circle", { cx: tx(p.x), cy: ty(p.v), r: 10, fill: "transparent" }, ts);
      hit.addEventListener("mousemove", e => showTip(e, `<div class="t">${s.co} · ${p.d}</div>` + row("5y CDS", p.v.toLocaleString() + " bps", s.c) + (p.der ? `<div class="muted">Derived from a reported % change</div>` : "")));
      hit.addEventListener("mouseleave", hideTip);
    });
    const last = P[P.length - 1];
    el("text", { x: tx(last.x) + 8, y: ty(last.v) + 4, class: "dlabel" }, ts).textContent = s.co;
  });
  document.getElementById("lg-cdst").innerHTML = CDS_TS.map(s => `<span><i class="sw" style="background:var(${s.c})"></i>${s.co}</span>`).join("") +
    `<span><i class="sw" style="background:transparent;border:2px solid var(--text-muted);border-radius:50%"></i>Derived</span>`;
}

// ---------- CHART: GPU rental index (Silicon Data neocloud) ----------
const fmtH = v => "$" + v.toFixed(2);
function drawGpu() {
  const host = document.getElementById("c-gpu"); host.innerHTML = "";
  const VW = 760, VH = 340, m = { t: 16, r: 120, b: 28, l: 44 };
  const W = VW - m.l - m.r, H = VH - m.t - m.b;
  const svg = el("svg", { viewBox: `0 0 ${VW} ${VH}`, role: "img", "aria-label": "Line chart of Silicon Data neocloud GPU rental price indices, mid-2025 to November 2026: H100, H200, B200 and B300 rising, A100 roughly flat" }, host);
  const x0 = decYear(GPU_RANGE[0]), x1 = decYear(GPU_RANGE[1]), ymax = 8;
  const sx = x => m.l + ((x - x0) / (x1 - x0)) * W, sy = v => m.t + H - (v / ymax) * H;
  yAxis(svg, m, W, H, ymax, 2, v => "$" + v);
  GPU_TICKS.forEach(([d, l]) => el("text", { x: sx(decYear(d)), y: VH - 8, "text-anchor": "middle", class: "tick" }, svg).textContent = l);
  // restatement marker: points before it used Silicon Data's older methodology
  const rx = sx(decYear(GPU_RESTATE));
  el("line", { x1: rx, x2: rx, y1: m.t, y2: m.t + H, stroke: css("--axis"), "stroke-dasharray": "3 3" }, svg);
  el("text", { x: rx - 4, y: m.t + 10, "text-anchor": "end", class: "tick" }, svg).textContent = "← older method";
  const S = GPU.map(g => ({ ...g, P: g.pts.map(p => ({ d: p[0], x: decYear(p[0]), v: p[1], h: !!p[2], n: p[3] || "" })) }));
  S.forEach(g => {
    g.P.slice(1).forEach((p, i) => { const a = g.P[i], gap = p.x - a.x > 0.17;
      el("line", { x1: sx(a.x), y1: sy(a.v), x2: sx(p.x), y2: sy(p.v), stroke: css(g.c), "stroke-width": 2, "stroke-linecap": "round", ...(gap ? { "stroke-dasharray": "3 4", opacity: 0.7 } : {}) }, svg); });
    g.P.forEach(p => {
      el("circle", { cx: sx(p.x), cy: sy(p.v), r: 3.5, fill: p.h ? css("--surface-1") : css(g.c), stroke: p.h ? css(g.c) : css("--surface-1"), "stroke-width": 1.5 }, svg);
      const hit = el("circle", { cx: sx(p.x), cy: sy(p.v), r: 9, fill: "transparent" }, svg);
      hit.addEventListener("mousemove", e => showTip(e, `<div class="t">${g.chip} · ${p.d}</div>` + row("Rental index", `<b>${fmtH(p.v)}</b>/GPU-hr`, g.c) + (p.n ? `<div class="muted" style="max-width:260px;margin-top:4px">${p.n}</div>` : "")));
      hit.addEventListener("mouseleave", hideTip);
    });
  });
  // end labels, de-collided
  const ends = S.map(g => ({ g, last: g.P[g.P.length - 1] })).map(o => ({ ...o, y: sy(o.last.v) + 4 })).sort((a, b) => a.y - b.y);
  for (let i = 1; i < ends.length; i++) if (ends[i].y - ends[i - 1].y < 14) ends[i].y = ends[i - 1].y + 14;
  ends.forEach(o => el("text", { x: sx(o.last.x) + 8, y: o.y, class: "dlabel strong" }, svg).textContent = `${o.g.chip} ${fmtH(o.last.v)}`);

  document.getElementById("lg-gpu").innerHTML = S.map(g => `<span><i class="sw" style="background:var(${g.c})"></i>${g.chip}</span>`).join("") +
    `<span><i class="sw" style="background:transparent;border:2px solid var(--text-muted);border-radius:50%"></i>Read off a chart, older method, or secondary source</span>`;
  const rows = [];
  S.forEach(g => g.P.forEach(p => rows.push([g.chip, p.d, fmtH(p.v) + (p.h ? " ○" : ""), p.n])));
  document.getElementById("t-gpu").innerHTML = table(["GPU", "Date", "$/GPU-hr", "Note"], rows);
  // change table
  document.getElementById("gpu-chg").innerHTML = S.map(g => {
    const f = (g.base && g.P.find(p => p.d === g.base)) || g.P.find(p => !p.h) || g.P[0], l = g.P[g.P.length - 1], ch = (l.v / f.v - 1) * 100;
    return `<tr><td><i class="sw" style="background:var(${g.c})"></i> ${g.chip}</td><td class="num">${fmtH(f.v)} <span class="muted">(${mon(f.d)})</span></td><td class="num"><b>${fmtH(l.v)}</b></td><td class="num">${ch >= 0 ? "+" : ""}${Math.round(ch)}%</td></tr>`;
  }).join("");
}

function drawGpuLong() {
  const host = document.getElementById("c-gpul"); host.innerHTML = "";
  const VW = 420, VH = 220, m = { t: 14, r: 16, b: 26, l: 40 };
  const W = VW - m.l - m.r, H = VH - m.t - m.b;
  const svg = el("svg", { viewBox: `0 0 ${VW} ${VH}`, role: "img", "aria-label": "Line chart of the SemiAnalysis H100 spot-contract composite, falling from $6.62 in the second half of 2023 to about $2.80 from mid-2025, then flat" }, host);
  const x0 = 2023.6, x1 = 2026.35, ymax = 8;
  const sx = x => m.l + ((x - x0) / (x1 - x0)) * W, sy = v => m.t + H - (v / ymax) * H;
  yAxis(svg, m, W, H, ymax, 2, v => "$" + v);
  [2024, 2025, 2026].forEach(y => el("text", { x: sx(y), y: VH - 8, "text-anchor": "middle", class: "tick" }, svg).textContent = y);
  const P = GPU_LONG.map(([l, x, v]) => ({ l, x, v }));
  el("path", { d: P.map((p, i) => (i ? "L" : "M") + sx(p.x) + "," + sy(p.v)).join(""), fill: "none", stroke: css("--s1"), "stroke-width": 2, "stroke-linejoin": "round" }, svg);
  P.forEach(p => {
    el("circle", { cx: sx(p.x), cy: sy(p.v), r: 3.5, fill: css("--s1"), stroke: css("--surface-1"), "stroke-width": 1.5 }, svg);
    const hit = el("circle", { cx: sx(p.x), cy: sy(p.v), r: 9, fill: "transparent" }, svg);
    hit.addEventListener("mousemove", e => showTip(e, `<div class="t">H100 composite · ${p.l}</div>` + row("SemiAnalysis", fmtH(p.v), "--s1")));
    hit.addEventListener("mouseleave", hideTip);
  });
  el("text", { x: sx(P[0].x) + 6, y: sy(P[0].v) - 6, class: "dlabel strong" }, svg).textContent = fmtH(P[0].v);
  const L = P[P.length - 1];
  el("text", { x: sx(L.x), y: sy(L.v) - 10, "text-anchor": "end", class: "dlabel strong" }, svg).textContent = fmtH(L.v);
  document.getElementById("t-gpul").innerHTML = table(["Period", "$/GPU-hr"], GPU_LONG.map(r => [r[0], fmtH(r[2])]));
  const c = v => v == null ? "—" : typeof v === "string" ? "$" + v : fmtH(v);
  document.getElementById("gpu-snap").innerHTML = GPU_SNAP.map(r => `<tr><td><b>${r.src}</b><div class="muted" style="font-size:12px">${r.kind}</div></td><td class="num">${c(r.h100)}</td><td class="num">${c(r.h200)}</td><td class="num">${c(r.b200)}</td></tr>`).join("");
}

// ---------- CHART: circular deals flow map ----------
// FLOWS (data.js): three columns of nodes. Flows run L → M (vendor money into the labs) and M → R (compute the labs
// have committed to buy). Ribbon width ∝ $; flows with no disclosed $ get a thin nominal ribbon. Colour = the lab
// (same as the revenue card); conditional / "up to" / cancellable flows are drawn hollow with a dashed edge.
// Nodes flagged circ appear on both sides (they invest in a lab and sell to it).
const amtTxt = (firm, cond, nd, vtxt) => {
  const parts = [];
  if (firm) parts.push(fmtB(firm));
  if (cond) parts.push(fmtB(cond) + " cond.");
  if (nd) parts.push(firm || cond ? "n/d" : vtxt || "$ n/d");
  return parts.join(" + ");
};
function drawFlows() {
  const host = document.getElementById("c-flows"); if (!host || typeof FLOWS === "undefined") return; host.innerHTML = "";
  const VW = 760, VH = FLOWS.h || 640, m = { t: 40, r: 150, b: 8, l: 150 }, nw = 12, gap = 10, NOM = 3, MIN = 16, LAB = 40;
  const H = VH - m.t - m.b;
  const svg = el("svg", { viewBox: `0 0 ${VW} ${VH}`, role: "img", "aria-label": FLOWS.aria }, host);
  const X = { L: m.l, M: VW / 2 - nw / 2, R: VW - m.r - nw };
  const nodes = {};
  [["L", FLOWS.L], ["M", FLOWS.M], ["R", FLOWS.R]].forEach(([col, arr]) => arr.forEach((n, i) => (nodes[n.id] = { ...n, col, i, ins: [], outs: [] })));
  const F = FLOWS.flows.map(f => ({ ...f }));
  F.forEach(f => { nodes[f.from].outs.push(f); nodes[f.to].ins.push(f); f.lab = nodes[f.from].col === "M" ? nodes[f.from] : nodes[f.to]; });
  const th = (f, k) => (f.v ? Math.max(1.5, f.v * k) : NOM);
  const size = (n, k) => Math.max(n.ins.reduce((s, f) => s + th(f, k), 0), n.outs.reduce((s, f) => s + th(f, k), 0));
  const slot = (n, k) => (n.col === "M" ? size(n, k) + LAB : Math.max(size(n, k), MIN));
  const col = c => Object.values(nodes).filter(n => n.col === c).sort((a, b) => a.i - b.i);
  const colH = (c, k) => col(c).reduce((s, n) => s + slot(n, k), 0) + gap * (col(c).length - 1);
  let lo = 0, hi = 10; // largest $ → px scale at which every column fits
  for (let it = 0; it < 50; it++) { const k = (lo + hi) / 2; ["L", "M", "R"].every(c => colH(c, k) <= H) ? (lo = k) : (hi = k); }
  const k = lo;
  ["L", "M", "R"].forEach(c => {
    const N = col(c), extra = (H - colH(c, k)) / Math.max(1, N.length - 1);
    let y = m.t;
    N.forEach(n => { const sl = slot(n, k); n.h = Math.max(size(n, k), 2); n.y = n.col === "M" ? y + LAB : y + (sl - n.h) / 2; y += sl + gap + extra; n.inC = 0; n.outC = 0; });
  });
  // attach ribbons in the order of the far end, to limit crossings
  Object.values(nodes).forEach(n => { n.outs.sort((a, b) => nodes[a.to].y - nodes[b.to].y); n.ins.sort((a, b) => nodes[a.from].y - nodes[b.from].y); });
  Object.values(nodes).forEach(n => n.outs.forEach(f => { f.y1 = n.y + n.outC; n.outC += th(f, k); }));
  Object.values(nodes).forEach(n => n.ins.forEach(f => { f.y2 = n.y + n.inC; n.inC += th(f, k); }));
  // column headings
  [[X.L + nw, "end", 0], [X.M + nw / 2, "middle", 1], [X.R, "start", 2]].forEach(([x, a, i]) => {
    el("text", { x, y: 13, "text-anchor": a, class: "dlabel strong" }, svg).textContent = FLOWS.heads[i];
    if (FLOWS.subs[i]) el("text", { x, y: 27, "text-anchor": a, class: "tick" }, svg).textContent = FLOWS.subs[i];
  });
  const fmtF = f => (f.v ? fmtB(f.v) : f.vtxt || "$ n/d");
  const tipF = f => `<div class="t">${nodes[f.from].name} → ${nodes[f.to].name}</div>` + row(f.kind, `<b>${fmtF(f)}</b>${f.cond ? " ◌" : ""}`, f.lab.c) +
    (f.what ? `<div style="max-width:300px;margin-top:4px">${f.what}</div>` : "") + (f.status ? `<div class="muted" style="max-width:300px;margin-top:4px">${f.cond ? "◌ Conditional. " : ""}${f.status}</div>` : "") +
    (f.src ? `<div class="muted" style="margin-top:2px">Source: ${f.src}</div>` : "");
  // ribbons: firm first, conditional on top so their dashed edges stay visible
  [...F.filter(f => !f.cond), ...F.filter(f => f.cond)].forEach(f => {
    const a = nodes[f.from], b = nodes[f.to], x1 = X[a.col] + nw, x2 = X[b.col], xm = (x1 + x2) / 2, t = th(f, k);
    const d = `M${x1},${f.y1}C${xm},${f.y1} ${xm},${f.y2} ${x2},${f.y2}L${x2},${f.y2 + t}C${xm},${f.y2 + t} ${xm},${f.y1 + t} ${x1},${f.y1 + t}Z`;
    const base = f.cond ? 0.08 : 0.4;
    const p = el("path", { d, fill: css(f.lab.c), "fill-opacity": base, stroke: f.cond ? css(f.lab.c) : "none", "stroke-width": f.cond ? 1 : 0, "stroke-dasharray": f.cond ? "3 3" : "" }, svg);
    p.addEventListener("mousemove", e => { p.setAttribute("fill-opacity", base + 0.3); showTip(e, tipF(f)); });
    p.addEventListener("mouseleave", () => { p.setAttribute("fill-opacity", base); hideTip(); });
  });
  // nodes + labels
  Object.values(nodes).forEach(n => {
    el("rect", { x: X[n.col], y: n.y, width: nw, height: n.h, rx: 2, fill: css(n.col === "M" ? n.c : "--neutral") }, svg);
    const tot = (arr, cond) => arr.filter(f => !!f.cond === cond).reduce((s, f) => s + (f.v || 0), 0);
    const nd = arr => arr.some(f => !f.v), vt = arr => (arr.find(f => !f.v) || {}).vtxt;
    const cy = n.y + n.h / 2;
    if (n.col === "M") {
      const halo = { stroke: css("--surface-1"), "stroke-width": 4, "paint-order": "stroke", "stroke-linejoin": "round" };
      el("text", { x: X.M + nw / 2, y: n.y - 28, "text-anchor": "middle", class: "dlabel strong", ...halo }, svg).textContent = n.name;
      el("text", { x: X.M + nw / 2, y: n.y - 15, "text-anchor": "middle", class: "tick", ...halo }, svg).textContent = "in " + amtTxt(tot(n.ins, false), tot(n.ins, true), nd(n.ins));
      el("text", { x: X.M + nw / 2, y: n.y - 3, "text-anchor": "middle", class: "tick", ...halo }, svg).textContent = "out " + amtTxt(tot(n.outs, false), tot(n.outs, true), nd(n.outs));
    } else {
      const left = n.col === "L", arr = left ? n.outs : n.ins, x = left ? X.L - 8 : X.R + nw + 8, anc = left ? "end" : "start";
      el("text", { x, y: cy - 1, "text-anchor": anc, class: n.circ ? "dlabel strong" : "dlabel" }, svg).textContent = (n.circ && !left ? "⇄ " : "") + n.name + (n.circ && left ? " ⇄" : "");
      el("text", { x, y: cy + 12, "text-anchor": anc, class: "tick" }, svg).textContent = amtTxt(tot(arr, false), tot(arr, true), nd(arr), vt(arr));
    }
    const hx = n.col === "L" ? X.L - 146 : n.col === "R" ? X.R - 2 : X.M - 4, hw = n.col === "M" ? nw + 8 : 160;
    const hit = el("rect", { x: hx, y: n.y - 6, width: hw, height: Math.max(n.h + 12, 26), fill: "transparent" }, svg);
    const list = (arr, other) => arr.map(f => row(nodes[f[other]].name, fmtF(f) + (f.cond ? " ◌" : ""), f.lab.c)).join("");
    hit.addEventListener("mousemove", e => showTip(e, `<div class="t">${n.name}${n.circ ? " ⇄ on both sides" : ""}</div>` +
      (n.ins.length ? `<div class="muted" style="margin:2px 0">${n.col === "M" ? "Vendor money in" : "Committed to it"}</div>` + list(n.ins, "from") : "") +
      (n.outs.length ? `<div class="muted" style="margin:2px 0">${n.col === "M" ? "Compute committed" : "Put into the labs"}</div>` + list(n.outs, "to") : "") +
      `<div class="muted" style="margin-top:4px">◌ = conditional, "up to", cancellable or undrawn</div>`));
    hit.addEventListener("mouseleave", hideTip);
  });
  // deals table (text columns left-aligned)
  const tb = document.getElementById("t-flows");
  if (tb) tb.innerHTML = `<table><thead><tr><th>From → to</th><th>Type</th><th class="num">Amount</th><th>What</th><th>Status</th><th>Source</th></tr></thead><tbody>` +
    F.map(f => `<tr><td>${nodes[f.from].name} → ${nodes[f.to].name}</td><td>${f.kind}</td><td class="num">${fmtF(f)}${f.cond ? " ◌" : ""}</td><td>${f.what || ""}</td><td>${f.status || ""}</td><td>${f.src || ""}</td></tr>`).join("") + `</tbody></table>`;
  // vendor money in vs commitments back, per vendor that sits on both sides
  const rb = document.getElementById("circ-ratio");
  if (rb) {
    const byName = {};
    F.forEach(f => {
      const a = nodes[f.from], b = nodes[f.to];
      if (a.col === "L") { const r = byName[a.name] ??= { inF: 0, inC: 0, inN: 0, back: 0, backC: 0, backN: 0 }; f.v ? (f.cond ? (r.inC += f.v) : (r.inF += f.v)) : r.inN++; }
      if (b.col === "R" && b.circ) { const r = byName[b.name] ??= { inF: 0, inC: 0, inN: 0, back: 0, backC: 0, backN: 0 }; f.v ? (f.cond ? (r.backC += f.v) : (r.back += f.v)) : r.backN++; }
    });
    rb.innerHTML = Object.entries(byName).map(([name, r]) => {
      const pct = r.back ? Math.round(r.inF / r.back * 100) + "%" : "–";
      const all = r.back + r.backC ? Math.round((r.inF + r.inC) / (r.back + r.backC) * 100) + "% with cond." : "";
      return `<tr><td>${name}</td><td class="num">${amtTxt(r.inF, r.inC, r.inN, "warrant")}</td><td class="num">${amtTxt(r.back, r.backC, r.backN) || "indirect"}</td><td class="num">${pct}${all ? `<div class="muted">${all}</div>` : ""}</td></tr>`;
    }).join("");
  }
}

// ---------- GENERIC: multi-series line chart (linear or log y) ----------
// cfg: { host, aria, VW, VH, m, x0, x1, xticks: [[x, label]], y: { log, lo, hi, ticks: [[v, label]] },
//        series: [{ name, c, dash, pts: [{ x, v, lab, h (hollow), n (note) }] }], fmt: v => string, valLabel,
//        refs: [{ v, label, c }], today, gap (years; longer segments are dashed), endLabel: (s, last) => string, endDx }
function lineChart(cfg) {
  const host = document.getElementById(cfg.host); host.innerHTML = "";
  const VW = cfg.VW || 760, VH = cfg.VH || 320, m = cfg.m || { t: 16, r: 120, b: 28, l: 52 };
  const W = VW - m.l - m.r, H = VH - m.t - m.b, Y = cfg.y;
  const svg = el("svg", { viewBox: `0 0 ${VW} ${VH}`, role: "img", "aria-label": cfg.aria }, host);
  const f = v => (Y.log ? Math.log10(v) : v);
  const sx = x => m.l + ((x - cfg.x0) / (cfg.x1 - cfg.x0)) * W;
  const sy = v => m.t + H - ((f(v) - f(Y.lo)) / (f(Y.hi) - f(Y.lo))) * H;
  el("line", { x1: m.l, x2: m.l + W, y1: m.t + H, y2: m.t + H, stroke: css("--axis"), "shape-rendering": "crispEdges" }, svg);
  Y.ticks.forEach(([v, lab]) => {
    if (Math.abs(sy(v) - (m.t + H)) > 0.5) el("line", { x1: m.l, x2: m.l + W, y1: sy(v), y2: sy(v), stroke: css("--grid"), "shape-rendering": "crispEdges" }, svg);
    el("text", { x: m.l - 8, y: sy(v) + 4, "text-anchor": "end", class: "tick" }, svg).textContent = lab;
  });
  cfg.xticks.forEach(([x, lab]) => el("text", { x: sx(x), y: VH - 8, "text-anchor": "middle", class: "tick" }, svg).textContent = lab);
  (cfg.refs || []).forEach(r => {
    el("line", { x1: m.l, x2: m.l + W, y1: sy(r.v), y2: sy(r.v), stroke: css(r.c || "--text-muted"), "stroke-width": 1.5, "stroke-dasharray": "4 3" }, svg);
    el("text", { x: r.right ? m.l + W - 4 : m.l + 4, y: sy(r.v) - 5, "text-anchor": r.right ? "end" : "start", class: "tick" }, svg).textContent = r.label;
  });
  if (cfg.today) {
    const tx = sx(TODAY);
    el("line", { x1: tx, x2: tx, y1: m.t, y2: m.t + H, stroke: css("--axis") }, svg);
    el("text", { x: tx - 4, y: m.t + 10, "text-anchor": "end", class: "tick" }, svg).textContent = "today";
  }
  const gap = cfg.gap ?? 0.17;
  cfg.series.forEach(s => {
    const P = s.pts;
    if (!s.dots) P.slice(1).forEach((p, i) => { const a = P[i], g = p.x - a.x > gap;
      el("line", { x1: sx(a.x), y1: sy(a.v), x2: sx(p.x), y2: sy(p.v), stroke: css(s.c), "stroke-width": 2, "stroke-linecap": "round", ...(g || s.dash ? { "stroke-dasharray": "3 4", opacity: 0.8 } : {}) }, svg); });
    P.forEach((p, i) => { if (s.marks === "end" && i !== P.length - 1 && !p.h) return;
      el("circle", { cx: sx(p.x), cy: sy(p.v), r: 4, fill: p.h ? css("--surface-1") : css(s.c), stroke: p.h ? css(s.c) : css("--surface-1"), "stroke-width": 2 }, svg); });
  });
  // hit targets last, so every point stays hoverable on top of the lines
  cfg.series.forEach(s => s.pts.forEach(p => {
    const hit = el("circle", { cx: sx(p.x), cy: sy(p.v), r: 12, fill: "transparent" }, svg);
    hit.addEventListener("mousemove", e => showTip(e, `<div class="t">${s.name} · ${p.lab}</div>` + row(cfg.valLabel || "Value", `<b>${cfg.fmt(p.v)}</b>`, s.c) +
      (p.h ? `<div class="muted">${cfg.hollowNote || "Estimate, derived or single-source"}</div>` : "") + (p.n ? `<div class="muted" style="max-width:280px;margin-top:4px">${p.n}</div>` : "")));
    hit.addEventListener("mouseleave", hideTip);
  }));
  // end labels, de-collided
  const ends = cfg.series.filter(s => !cfg.endLabel || cfg.endLabel(s, s.pts[s.pts.length - 1])).map(s => ({ s, last: s.pts[s.pts.length - 1] })).map(o => ({ ...o, y: sy(o.last.v) + 4 })).sort((a, b) => a.y - b.y);
  for (let i = 1; i < ends.length; i++) if (ends[i].y - ends[i - 1].y < 14) ends[i].y = ends[i - 1].y + 14;
  const over = ends.length ? ends[ends.length - 1].y - (m.t + H + 4) : 0;
  if (over > 0) ends.forEach(o => (o.y -= over));
  ends.filter(o => (cfg.endLabel ? cfg.endLabel(o.s, o.last) : 1)).forEach(o => el("text", { x: sx(o.last.x) + (cfg.endDx ?? 8), y: o.y, class: "dlabel strong" }, svg).textContent = cfg.endLabel ? cfg.endLabel(o.s, o.last) : `${o.s.name} ${cfg.fmt(o.last.v)}`);
  return { svg, sx, sy, m, W, H };
}

// ---------- GENERIC: columns with optional per-bar colour, estimate shading and labels ----------
// cfg: { host, aria, VW, VH, m, bars: [{ lab, v, c, est, n, label (bool) }], fmt, yfmt, max, step, refs: [{ v, label, c }], valLabel }
function columnChart(cfg) {
  const host = document.getElementById(cfg.host); host.innerHTML = "";
  const VW = cfg.VW || 460, VH = cfg.VH || 260, m = cfg.m || { t: 22, r: 8, b: 26, l: 46 };
  const W = VW - m.l - m.r, H = VH - m.t - m.b;
  const svg = el("svg", { viewBox: `0 0 ${VW} ${VH}`, role: "img", "aria-label": cfg.aria }, host);
  const nm = niceMax(Math.max(...cfg.bars.map(b => b.v), ...(cfg.refs || []).map(r => r.v)));
  const max = cfg.max || nm.max, step = cfg.step || nm.step;
  yAxis(svg, m, W, H, max, step, cfg.yfmt || cfg.fmt);
  const band = W / cfg.bars.length, bw = Math.min(cfg.bw || 24, band * 0.6);
  (cfg.refs || []).forEach(r => {
    const y = m.t + H - (r.v / max) * H;
    el("line", { x1: m.l, x2: m.l + W, y1: y, y2: y, stroke: css(r.c || "--text-muted"), "stroke-width": 1.5, "stroke-dasharray": "4 3" }, svg);
    el("text", { x: m.l + 4, y: y - 5, class: "tick" }, svg).textContent = r.label;
  });
  cfg.bars.forEach((b, i) => {
    const cx = m.l + band * i + band / 2, h = (b.v / max) * H, y = m.t + H - h, c = b.c || cfg.c || "--s1";
    el("path", { d: colPath(cx - bw / 2, y, bw, h), fill: css(c), opacity: b.est ? 0.45 : 1 }, svg);
    if (b.label) el("text", { x: cx, y: y - 6, "text-anchor": "middle", class: b.strong ? "dlabel strong" : "dlabel" }, svg).textContent = (b.est ? "~" : "") + cfg.fmt(b.v);
    if (b.tick !== false) el("text", { x: cx, y: VH - 8, "text-anchor": "middle", class: "tick" }, svg).textContent = b.tickLab ?? b.lab;
    const hit = el("rect", { x: m.l + band * i, y: m.t, width: band, height: H, fill: "transparent" }, svg);
    hit.addEventListener("mousemove", e => showTip(e, `<div class="t">${b.lab}${b.est ? " (estimate)" : ""}</div>` + row(cfg.valLabel || "Value", `<b>${cfg.fmt(b.v)}</b>`, c) +
      (b.n ? `<div class="muted" style="max-width:260px;margin-top:4px">${b.n}</div>` : "")));
    hit.addEventListener("mouseleave", hideTip);
  });
  return { svg, m, W, H, band, max };
}

// ---------- CHART: flagship list prices (dot plot, log) ----------
const toPts = pts => pts.map(p => ({ d: p[0], x: decYear(p[0]), v: p[1], lab: mon(p[0]), n: p[2], h: !!p[3] }));
function drawFrontierPx() {
  if (!document.getElementById("c-fpx")) return;
  const S = FRONTIER_PX.map(s => ({ ...s, pts: toPts(s.pts) }));
  const r = lineChart({ host: "c-fpx", aria: "Dot plot of flagship AI model list prices per million tokens, 2023 to 2026, by lab: roughly flat in a $3 to $20 band since 2025",
    VW: 680, VH: 300, m: { t: 14, r: 120, b: 28, l: 52 }, x0: 2023, x1: 2027, xticks: [[2023, "2023"], [2024, "2024"], [2025, "2025"], [2026, "2026"], [2027, "2027"]],
    y: { log: 1, lo: 1, hi: 100, ticks: [[1, "$1"], [3, "$3"], [10, "$10"], [30, "$30"], [100, "$100"]] },
    series: S, fmt: v => "$" + (v < 10 ? v.toFixed(2) : v.toFixed(v % 1 ? 2 : 0)) + " / 1M tokens", valLabel: "List price (3:1 blend)", hollowNote: "Gated / restricted access", endLabel: () => "" });
  // selective labels, placed by hand around the crowded Sep–Oct 2026 cluster
  const LAB = { "GPT-4": [8, 4, "start", "GPT-4 $37.50"], "GPT-5": [0, 17, "middle", "GPT-5 $3.44"], "Claude Opus 4.5": [6, 15, "start", "Opus 4.5 $10"],
    "Claude Mythos Preview": [-8, 4, "end", "Mythos Preview $50 (gated)"], "GPT-6 Astra": [8, 4, "start", "GPT-6 Astra $20"], "Claude Opus 5.5": [8, 4, "start", "Opus 5.5 $8"],
    "GPT-6.1 Sol": [-2, 18, "end", "GPT-6.1 Sol $4"], "Gemini 4 Argon, introductory": [8, 4, "start", "Gemini 4 Argon $4"] };
  S.forEach(s => s.pts.forEach(p => {
    const L = LAB[p.n.split(" (")[0]]; if (!L) return;
    el("text", { x: r.sx(p.x) + L[0], y: r.sy(p.v) + L[1], "text-anchor": L[2], class: "dlabel" }, r.svg).textContent = L[3];
  }));
  document.getElementById("lg-fpx").innerHTML = S.map(s => `<span><i class="sw" style="background:var(${s.c});border-radius:50%"></i>${s.name}</span>`).join("") +
    `<span><i class="sw" style="background:transparent;border:2px solid var(--text-muted);border-radius:50%"></i>Gated / restricted access</span>`;
  document.getElementById("t-fpx").innerHTML = table(["Lab", "Model (input / output list price)", "Launched", "3:1 blend, $/1M"],
    S.flatMap(s => s.pts.map(p => [s.name, p.n, p.d, "$" + p.v.toFixed(2)])));
}

// ---------- CHART: GDPval and Remote Labor Index ----------
function drawBench() {
  if (!document.getElementById("c-bench")) return;
  const S = BENCH.map(s => ({ ...s, pts: toPts(s.pts) }));
  lineChart({ host: "c-bench", aria: "Line chart of AI task success: GDPval wins or ties against experts rose from 48% to 85%; Remote Labor Index projects automated rose from 2.5% to 21%",
    VW: 680, VH: 280, m: { t: 14, r: 150, b: 28, l: 44 }, x0: 2025.6, x1: 2026.95,
    xticks: [[2025.75, "Oct 25"], [2026, "Jan 26"], [2026.25, "Apr"], [2026.5, "Jul"], [2026.75, "Oct"]],
    y: { lo: 0, hi: 100, ticks: [[0, "0%"], [25, "25%"], [50, "50%"], [75, "75%"], [100, "100%"]] },
    refs: [{ v: BENCH_PARITY, label: "GDPval parity with experts", right: 1 }], series: S, fmt: v => v.toFixed(1) + "%", valLabel: "Tasks at standard", gap: 1,
    endLabel: (s, p) => `${s.name} ${p.v.toFixed(p.v < 30 ? 1 : 0)}%` });
  document.getElementById("t-bench").innerHTML = table(["Benchmark", "Date", "Best result", "Model / note"],
    S.flatMap(s => s.pts.map(p => [s.name, p.d, p.v.toFixed(1) + "%", p.n])));
}

// ---------- CHARTS: demand you can count ----------
const fmtT = v => (v >= 1000 ? (v / 1000).toFixed(v >= 10000 ? 0 : 1) + " quadrillion" : (v >= 100 ? Math.round(v) : v.toFixed(1)) + "T") + " tokens / month";
function drawTokens() {
  if (!document.getElementById("c-tok")) return;
  const S = TOKENS.map(s => ({ ...s, pts: toPts(s.pts) }));
  lineChart({ host: "c-tok", aria: "Log-scale line chart of AI tokens processed per month: Google rising from 9.7 trillion in April 2024 to over 3.2 quadrillion in May 2026; Google's model APIs and OpenRouter also rising steeply",
    VW: 560, VH: 300, m: { t: 14, r: 128, b: 28, l: 52 }, x0: 2024.2, x1: 2026.95,
    xticks: [[2024.5, "Jul 24"], [2025, "Jan 25"], [2025.5, "Jul"], [2026, "Jan 26"], [2026.5, "Jul"]],
    y: { log: 1, lo: 3, hi: 6000, ticks: [[10, "10T"], [100, "100T"], [1000, "1,000T"]] },
    series: S, fmt: fmtT, valLabel: "Tokens", gap: 0.3, hollowNote: "Secondary or single-source",
    endLabel: (s, p) => `${s.name.replace("Google, all surfaces", "Google, all")} ${Math.round(p.v).toLocaleString()}T` });
  document.getElementById("lg-tok").innerHTML = S.map(s => `<span><i class="sw" style="background:var(${s.c})"></i>${s.name}</span>`).join("") +
    `<span><i class="sw" style="background:transparent;border:2px solid var(--text-muted);border-radius:50%"></i>Secondary source</span>`;
  document.getElementById("t-tok").innerHTML = table(["Series", "Date", "Tokens / month", "As stated"],
    S.flatMap(s => s.pts.map(p => [s.name, p.d, (p.v >= 1000 ? (p.v / 1000).toFixed(2) + " quadrillion" : p.v.toFixed(1) + "T"), p.n])));
}
function drawAdopt() {
  if (!document.getElementById("c-adopt")) return;
  const S = ADOPT.map(s => ({ ...s, pts: toPts(s.pts) }));
  const r = lineChart({ host: "c-adopt", aria: "Line chart of AI adoption in the US: businesses on Ramp paying for AI rose from 25% to 56%; workers using generative AI for their job about 40%; Census share of firms using AI rose from 4% to 24%, with a question change in November 2025",
    VW: 560, VH: 300, m: { t: 14, r: 118, b: 28, l: 40 }, x0: 2023.5, x1: 2026.95,
    xticks: [[2024, "2024"], [2025, "2025"], [2026, "2026"]],
    y: { lo: 0, hi: 60, ticks: [[0, "0%"], [20, "20%"], [40, "40%"], [60, "60%"]] },
    series: S, fmt: v => v.toFixed(1) + "%", valLabel: "Share", gap: 0.3, hollowNote: "Treat with caution",
    endLabel: (s, p) => s.short ? `${s.short} ${p.v.toFixed(0)}%` : "" });
  const bx = r.sx(decYear(ADOPT_BREAK));
  el("line", { x1: bx, x2: bx, y1: r.m.t, y2: r.m.t + r.H, stroke: css("--axis"), "stroke-dasharray": "3 3" }, r.svg);
  el("text", { x: bx - 4, y: r.m.t + 10, "text-anchor": "end", class: "tick" }, r.svg).textContent = "Census rewords →";
  document.getElementById("lg-adopt").innerHTML = S.filter(s => s.short).map(s => `<span><i class="sw" style="background:var(${s.c})"></i>${s.name}</span>`).join("");
  document.getElementById("t-adopt").innerHTML = table(["Series", "Date", "Share"], S.flatMap(s => s.pts.map(p => [s.name, p.d, p.v.toFixed(1) + "%" + (p.h ? " ○" : "")])));
}

// ---------- CHART: capex ÷ operating cash flow ----------
function drawCashflow() {
  if (!document.getElementById("c-cf")) return;
  const usd = v => (v < 0 ? "−$" + Math.abs(v).toFixed(1) : "$" + v.toFixed(1)) + "B";
  const S = CF_CO.map(c => ({ ...c, pts: c.rows.map(([lab, x, ocf, cap]) => ({ lab, x, v: cap / ocf * 100,
    n: "Operating cash " + usd(ocf) + " · capex " + usd(cap) + " · free cash " + usd(ocf - cap) })) }));
  lineChart({ host: "c-cf", aria: "Line chart of capex as a share of operating cash flow, 2016 to September 2026: Microsoft 69%, Alphabet 89%, Meta 78%, Amazon 125% and Oracle 161% in the latest 12 months, up from roughly 10 to 50% before 2023",
    VW: 680, VH: 320, m: { t: 14, r: 112, b: 28, l: 44 }, x0: 2015.6, x1: 2026.6,
    xticks: [[2016, "2016"], [2018, "2018"], [2020, "2020"], [2022, "2022"], [2024, "2024"], [2026, "2026"]],
    y: { lo: 0, hi: 200, ticks: [[0, "0%"], [50, "50%"], [100, "100%"], [150, "150%"], [200, "200%"]] },
    refs: [{ v: 100, label: "capex = all operating cash flow" }], series: S, fmt: v => Math.round(v) + "%", valLabel: "Capex ÷ operating cash", gap: 1.1,
    endLabel: (s, p) => s.name + " " + Math.round(p.v) + "%" });
  document.getElementById("lg-cf").innerHTML = S.map(s => '<span><i class="sw" style="background:var(' + s.c + ')"></i>' + s.name + '</span>').join("");
  document.getElementById("t-cf").innerHTML = table(["Company", "Period", "Operating cash", "Capex", "Free cash", "Capex ÷ OCF"],
    CF_CO.flatMap(c => c.rows.map(([lab, , ocf, cap]) => [c.name, lab, usd(ocf), usd(cap), usd(ocf - cap), Math.round(cap / ocf * 100) + "%"])));
  document.getElementById("cf-ttm").innerHTML = CF_CO.map(c => { const r = c.rows[c.rows.length - 1];
    return '<tr><td><i class="sw" style="background:var(' + c.c + ');margin-right:6px"></i>' + c.name + '</td><td class="num">' + usd(r[2]) + '</td><td class="num">' + usd(r[3]) +
      '</td><td class="num"><b>' + usd(c.fcfTTM) + '</b></td><td class="num">' + usd(c.netCash) + '</td></tr>'; }).join("");
}

// ---------- CHART: Nvidia data-centre revenue by quarter ----------
function drawNvdaQ() {
  const n = NVDA_Q.length;
  const bars = NVDA_Q.map(([q, end, v, comp, net], i) => ({ lab: q + " (" + end + ")", tickLab: (i % 3 === 0 || i === n - 1) ? end : "", v, c: "--neutral",
    label: i === 0 || i >= n - 2, strong: i === n - 1,
    n: comp != null ? "Compute $" + comp.toFixed(1) + "B · networking $" + net.toFixed(1) + "B" : "Hyperscale $48.7B · other customers $40.3B (no compute / networking split)" }));
  columnChart({ host: "c-nvda", aria: "Column chart of Nvidia data-centre revenue by quarter, from $22.6 billion in the April 2024 quarter to $89.0 billion in the July 2026 quarter",
    VW: 460, VH: 260, m: { t: 22, r: 8, b: 26, l: 46 }, bars, fmt: v => "$" + v.toFixed(1) + "B", yfmt: v => "$" + v + "B", valLabel: "Data-centre revenue", bw: 22 });
  document.getElementById("t-nvda").innerHTML = table(["Quarter", "Ended", "Data centre", "Compute", "Networking"],
    NVDA_Q.map(([q, end, v, c, nt]) => [q, end, "$" + v.toFixed(1) + "B", c != null ? "$" + c.toFixed(1) + "B" : "–", nt != null ? "$" + nt.toFixed(1) + "B" : "–"])
      .concat(NVDA.labels.map((l, i) => [l + " (full year)", "", "$" + NVDA.vals[i].toFixed(1) + "B", "", ""])));
}

function table(head, rows) {
  return `<table><thead><tr>${head.map((h, i) => `<th class="${i ? "num" : ""}">${h}</th>`).join("")}</tr></thead><tbody>` +
    rows.map(r => `<tr>${r.map((c, i) => `<td class="${i ? "num" : ""}">${c}</td>`).join("")}</tr>`).join("") + `</tbody></table>`;
}

function drawAll() {
  drawCapex();
  drawShare();
  drawColumns("c-orcl", ORCL, "--neutral", "Column chart of Oracle capex by fiscal year", "t-orcl", "Oracle capex");
  drawNvdaQ();
  drawFlop();
  drawPjm();
  drawGW();
  drawDefl();
  drawRev();
  drawMetr();
  drawCds();
  drawGpu();
  drawGpuLong();
  drawFrontierPx();
  drawBench();
  drawTokens();
  drawAdopt();
  drawCashflow();
  drawFlows();
}


// ---------- DATA-AGE STAMPS ----------
const TODAY = decYearSafe(UPDATED);
function decYearSafe(s) { const d = Date.parse(s + "T00:00:00Z"), y = new Date(d).getUTCFullYear(); return y + (d - Date.UTC(y, 0, 1)) / (365.25 * 864e5); }
function stampSections() {
  const now = Date.now();
  document.querySelectorAll("[data-section]").forEach(sec => {
    const meta = SECTIONS[sec.dataset.section]; if (!meta) return;
    const h = sec.querySelector("h2"); if (!h || h.querySelector(".asof")) return;
    const age = Math.floor((now - Date.parse(meta.asOf + "T00:00:00Z")) / 864e5);
    const stale = age > meta.every;
    const p = document.createElement("span");
    p.className = "pill asof" + (stale ? " stale" : "");
    p.title = `Refresh every ~${meta.every} days. Sources: ${meta.sources.join("; ")}`;
    const fmtD = d => new Date(d + "T00:00:00Z").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
    p.textContent = (stale ? "⚠ stale · " : "") + "data as of " + fmtD(meta.asOf);
    h.appendChild(p);
  });
  const u = document.getElementById("updated"); if (u) u.textContent = new Date(UPDATED + "T00:00:00Z").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}

// ---------- WIRING ----------
document.querySelectorAll("[data-table]").forEach(b =>
  b.addEventListener("click", () => document.getElementById(b.dataset.table).classList.toggle("show")));
document.getElementById("theme").addEventListener("click", () => {
  const root = document.documentElement;
  const dark = root.dataset.theme ? root.dataset.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
  root.dataset.theme = dark ? "light" : "dark";
  drawAll();
});
matchMedia("(prefers-color-scheme: dark)").addEventListener("change", drawAll);
stampSections();
drawAll();
