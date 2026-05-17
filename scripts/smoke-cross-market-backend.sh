#!/usr/bin/env bash
# Smoke-test cross-market + IBKR + copilot on the FastAPI backend (direct curl).
# Usage: OPTIONS_AJI_BACKEND_URL=http://127.0.0.1:8787 ./scripts/smoke-cross-market-backend.sh
set -euo pipefail

BASE="${OPTIONS_AJI_BACKEND_URL:-http://127.0.0.1:8787}"
BASE="${BASE%/}"

echo "Backend: $BASE"

code_hot=$(curl -sS -o /tmp/cm_hot.json -w "%{http_code}" "$BASE/api/cross-market/events/hot")
echo "GET /api/cross-market/events/hot -> $code_hot"

code_feed=$(curl -sS -o /tmp/cm_feed.json -w "%{http_code}" "$BASE/api/cross-market/feed")
echo "GET /api/cross-market/feed -> $code_feed"

code_scan=$(curl -sS -o /tmp/cm_scan.json -w "%{http_code}" "$BASE/api/cross-market/scanner/arbitrage")
echo "GET /api/cross-market/scanner/arbitrage -> $code_scan"

code_ibkr=$(curl -sS -o /tmp/cm_ibkr.json -w "%{http_code}" "$BASE/api/ibkr/health")
echo "GET /api/ibkr/health -> $code_ibkr"
if [[ "$code_ibkr" == "200" ]]; then
  python3 -c "import json;d=json.load(open('/tmp/cm_ibkr.json'));print('  ibkr_enabled=%s connected=%s'%(d.get('ibkr_enabled'),d.get('connected')))" 2>/dev/null || true
fi

code_copilot=$(curl -sS -o /tmp/cm_copilot.json -w "%{http_code}" \
  -X POST "$BASE/api/copilot/query" \
  -H 'Content-Type: application/json' \
  -d '{"query":"用一句话说明你是谁","trader_id":"smoke"}' \
  --max-time 120)
echo "POST /api/copilot/query -> $code_copilot"
head -c 180 /tmp/cm_copilot.json 2>/dev/null || true
echo

code_insp=$(curl -sS -o /tmp/cm_insp.json -w "%{http_code}" "$BASE/api/ontology/inspector?limit=5")
echo "GET /api/ontology/inspector -> $code_insp"

# Soft expectations: hot/feed/scanner/inspector should 200 when Polymarket reachable; feed may 200 with partial items; IBKR 200 with connected false when disabled.
