#!/bin/sh
set -eu

attempt=0
while [ "$attempt" -lt 30 ]; do
  if docker compose -f docker-compose.host.yml --project-name tripbot exec -T tripbot node -e "
    if (!process.env.DISCORD_CLIENT_TOKEN) process.exit(1);
    fetch('http://127.0.0.1:' + (process.env.API_PORT || '1337') + '/api/health', { signal: AbortSignal.timeout(4000) })
      .then(response => process.exit(response.ok ? 0 : 1))
      .catch(() => process.exit(1));
  " >/dev/null 2>&1; then
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
