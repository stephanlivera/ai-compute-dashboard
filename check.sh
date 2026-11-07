#!/usr/bin/env bash
# Health check for the dashboard.
#   ./check.sh          -> staleness report + JS error check + light/dark screenshots in .check/
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

echo; echo "== Screenshots =="
"$BROWSER" --headless=new --disable-gpu --hide-scrollbars --window-size=1280,9800 \
  --screenshot="$PWD/.check/light.png" "$URL" >/dev/null 2>&1
"$BROWSER" --headless=new --disable-gpu --hide-scrollbars --window-size=1280,9800 \
  --force-dark-mode --blink-settings=preferredColorScheme=0 \
  --screenshot="$PWD/.check/dark.png" "$URL" >/dev/null 2>&1
echo "$PWD/.check/light.png"
echo "$PWD/.check/dark.png"
[[ -z "$ERRS" ]]
