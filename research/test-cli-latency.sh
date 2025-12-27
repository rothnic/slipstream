#!/bin/bash
# R1: Test CLI vs SDK latency
# Tests opencode run --attach latency for interactive use

set -e

PORT=4096
SERVER_PID=""

cleanup() {
  if [ -n "$SERVER_PID" ]; then
    kill $SERVER_PID 2>/dev/null || true
  fi
}
trap cleanup EXIT

echo "=== R1: CLI Latency Test ==="
echo ""

# Check if opencode is installed
if ! command -v opencode &> /dev/null; then
  echo "ERROR: opencode not found. Install with: npm install -g opencode-ai"
  exit 1
fi

# Start server
echo "Starting opencode serve on port $PORT..."
opencode serve --port $PORT &
SERVER_PID=$!
sleep 3

# Verify server is running
if ! curl -s "http://localhost:$PORT/global/health" > /dev/null; then
  echo "ERROR: Server failed to start"
  exit 1
fi

echo "Server started. Running latency tests..."
echo ""

# Test attachment latency
RESULTS=""
for i in {1..5}; do
  START=$(date +%s%3N)
  opencode run --attach "http://localhost:$PORT" "echo test $i" > /dev/null 2>&1
  END=$(date +%s%3N)
  ELAPSED=$((END - START))
  RESULTS="$RESULTS$ELAPSED\n"
  echo "  Run $i: ${ELAPSED}ms"
done

echo ""
echo "=== Results ==="
AVG=$(echo -e "$RESULTS" | awk '{sum+=$1; count++} END {print int(sum/count)}')
echo "Average latency: ${AVG}ms"
echo ""

if [ "$AVG" -lt 200 ]; then
  echo "✓ PASS: Latency < 200ms - CLI approach recommended"
  echo "R1_RESULT=CLI" > research/.r1-result
else
  echo "⚠ WARN: Latency > 200ms - Consider SDK approach"
  echo "R1_RESULT=SDK" > research/.r1-result
fi
