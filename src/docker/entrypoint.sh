#!/bin/sh
set -e

if [ "$NODE_ENV" = "development" ]; then
  echo "Waiting for DB..."
  ./src/docker/wait-for-it.sh --timeout=5 tripbot_database:5432
  npm run db:deploy
  npm run db:generate
  tail -f /dev/null
else
  echo "Running production"
  pm2-runtime /workspaces/tripbot/build/src/start.js
fi