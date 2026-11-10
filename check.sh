#!/usr/bin/env bash
# Health check for the dashboard.
#   ./check.sh          -> staleness report + JS error check + chart-label check + screenshots in .check/
#                          (light.png and dark.png at 1280 px wide, mobile.png at 500 px)
#   ./check.sh --quick  -> staleness report only
set -euo pipefail
cd "$(dirname "$0")"

echo "== Data freshness (from SECTIONS in data.js) =="
node - <<'EOF'
const fs = require("fs");
const src = fs.readFileSync("data.js", "utf8");
const { UPDATED, SECTIONS, EVENTS } = new Function(src + "; return { UPDATED, SECTIONS, EVENTS };")();
const now = Date.now(), day = 864e5;
console.log(`Last full refresh: ${UPDATED} (${Math.floor((now - Date.parse(UPDATED)) / day)} days ago)\n`);
const rows = Object.entries(SECTIONS).map(([id, s]) => {
  const age = Math.floor((now - Date.parse(s.asOf)) / day);
  return { section: id, asOf: s.asOf, ageDays: age, every: s.every, status: age > s.every ? "STALE" : age > s.every * 0.75 ? "due soon" : "ok", data: s.consts.join(", ") };
});
rows.sort((a, b) => (b.ageDays / b.every) - (a.ageDays / a.every));
console.table(rows);
console.log("\nUpcoming refresh triggers (EVENTS in data.js; confirm dates):");
EVENTS.forEach(e => console.log(`  - ${e.when}: ${e.what}  [${e.sections.join(", ")}]`));
EOF

[[ "${1:-}" == "--quick" ]] && exit 0

BROWSER=$(command -v chromium || command -v google-chrome-stable || command -v chromium-browser || true)
if [[ -z "$BROWSER" ]]; then echo "No chromium found; skipping render checks."; exit 0; fi
mkdir -p .check
URL="file://$PWD/index.html"

echo; echo "== JavaScript errors =="
ERRS=$("$BROWSER" --headless=new --disable-gpu --enable-logging=stderr --v=0 --virtual-time-budget=3000 --dump-dom "$URL" 2>&1 >/dev/null \
  | grep -E "CONSOLE|Uncaught" | grep -iE "error|uncaught" || true)
if [[ -n "$ERRS" ]]; then echo "$ERRS"; echo "FAIL: fix the errors above."; else echo "none"; fi

# Chart labels: text that runs outside its chart, or two labels drawn on top of each other.
# Works on a copy of the page with a measuring script added (.check/audit.html).
echo; echo "== Chart labels (outside the chart, or overlapping) =="
python3 - <<'PY'
import pathlib
s = pathlib.Path("index.html").read_text()
audit = """<script>
addEventListener("load", () => document.fonts.ready.then(() => setTimeout(() => {
  const out = [];
  document.querySelectorAll('[id^="c-"] > svg, .spark > svg').forEach(svg => {
    const id = svg.parentNode.id, vb = svg.viewBox.baseVal, r = svg.getBoundingClientRect(), k = vb.width / r.width;
    const T = [...svg.querySelectorAll("text")].filter(t => t.textContent.trim()).map(t => { const b = t.getBoundingClientRect();
      return { s: t.textContent.trim(), x0: (b.left - r.left) * k, x1: (b.right - r.left) * k, y0: (b.top - r.top) * k, y1: (b.bottom - r.top) * k }; });
    T.forEach(t => { if (t.x0 < -1 || t.x1 > vb.width + 1 || t.y0 < -2 || t.y1 > vb.height + 2)
      out.push(id + ': "' + t.s + '" runs outside the chart (x ' + Math.round(t.x0) + ' to ' + Math.round(t.x1) + ' of ' + vb.width + ')'); });
    for (let i = 0; i < T.length; i++) for (let j = i + 1; j < T.length; j++) { const a = T[i], b = T[j];
      const ox = Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0), oy = Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0);
      if (ox > 2 && oy > 3) out.push(id + ': "' + a.s + '" overlaps "' + b.s + '"'); }
  });
  const pre = document.createElement("pre"); pre.id = "audit"; pre.textContent = out.join("\\n") || "none"; document.body.appendChild(pre);
}, 200)));
</script>"""
s = s.replace("<head>", '<head>\n<base href="../">', 1).replace("</body>", audit + "\n</body>", 1)
pathlib.Path(".check/audit.html").write_text(s)
PY
"$BROWSER" --headless=new --disable-gpu --window-size=1280,2000 --virtual-time-budget=4000 --dump-dom "file://$PWD/.check/audit.html" 2>/dev/null \
  | python3 -c 'import sys, re, html; m = re.search(r"<pre id=\"audit\">(.*?)</pre>", sys.stdin.read(), re.S); print(html.unescape(m.group(1)) if m else "audit did not run")'

echo; echo "== Screenshots =="
H=${SHOT_H:-27000}   # taller than the page; raise it if the page grows
"$BROWSER" --headless=new --disable-gpu --hide-scrollbars --window-size=1280,$H \
  --screenshot="$PWD/.check/light.png" "$URL" >/dev/null 2>&1
"$BROWSER" --headless=new --disable-gpu --hide-scrollbars --window-size=1280,$H \
  --force-dark-mode --blink-settings=preferredColorScheme=0 \
  --screenshot="$PWD/.check/dark.png" "$URL" >/dev/null 2>&1
# Headless Chromium won't lay a page out narrower than 500 px, so that is the "phone" width here.
"$BROWSER" --headless=new --disable-gpu --hide-scrollbars --window-size=500,${SHOT_H_MOBILE:-48000} \
  --screenshot="$PWD/.check/mobile.png" "$URL" >/dev/null 2>&1
echo "$PWD/.check/light.png"
echo "$PWD/.check/dark.png"
echo "$PWD/.check/mobile.png"
[[ -z "$ERRS" ]]
