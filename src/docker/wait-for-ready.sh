#!/bin/sh
set -eu

# The deployment proxy permits container inspection but disables remote exec.
format='{{if and .State.Running (not .State.Restarting)}}{{if .State.Health}}{{.State.Health.Status}}{{else}}missing{{end}}{{else}}stopped{{end}}'

attempt=0
while [ "$attempt" -lt 30 ]; do
  health=$(docker inspect --format "$format" tripbot 2>/dev/null) || health=unavailable
  if [ "$health" = healthy ]; then
    echo "TripBot database and configured bot connections are ready."
    exit 0
  fi
  attempt=$((attempt + 1))
  if [ "$attempt" -lt 30 ]; then
    echo "Waiting for TripBot readiness ($attempt/30)..."
    sleep 5
  fi
done

echo "TripBot did not become ready; deployment failed." >&2
exit 1
