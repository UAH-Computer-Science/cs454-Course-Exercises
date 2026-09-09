#!/usr/bin/env bash
#
# Tiny smoke test for the CS 454/554 Project 1 starter.
#
# Usage:
#   ./test/smoke.sh                    # defaults to http://localhost:3000
#   BASE_URL=http://localhost:8080 ./test/smoke.sh
#
# Start the service first, either directly (`npm start`) or via Compose once you
# have written your compose.yaml.

set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:3000}"

failures=0

# check <expected-status> <path>
check() {
  local expected="$1"
  local path="$2"
  local body status

  # Capture the body and the status code in one request.
  body="$(curl -sS -w '\n%{http_code}' "${BASE_URL}${path}")"
  status="$(printf '%s' "$body" | tail -n1)"
  body="$(printf '%s' "$body" | sed '$d')"

  if [[ "$status" == "$expected" ]]; then
    printf 'ok   %-28s %s  %s\n' "$path" "$status" "$body"
  else
    printf 'FAIL %-28s got %s, want %s  %s\n' "$path" "$status" "$expected" "$body"
    failures=$((failures + 1))
  fi
}

echo "Smoke testing ${BASE_URL}"

check 200 "/"

# TODO (Project 1): add a check for every row of the required test-case table:
#   check 200 "/convert?lbs=0"        # kg = 0
#   check 200 "/convert?lbs=150"      # kg = 68.039
#   check 200 "/convert?lbs=0.1"      # kg = 0.045
#   check 400 "/convert"
#   check 400 "/convert?lbs=abc"
#   check 422 "/convert?lbs=-5"
#   check 200 "/stats"
#   check 200 "/health"
#
# Asserting on the status code alone is not enough for /convert and /stats --
# you also need to show the response body is correct. Extend `check`, or pipe the
# body through a JSON tool, and capture the output for your submission.

if (( failures > 0 )); then
  echo "${failures} check(s) failed."
  exit 1
fi

echo "All checks passed."
