#!/bin/sh
set -e

if [ "$NODE_ENV" = "development" ]; then
  echo "Waiting for DB..."
  ./src/docker/wait-for-it.sh --timeout=5 tripbot_database:5432
  npm run db:deploy
  npm run db:generate
  # tsc does not emit the (non-TS) generated Prisma client into build/, so copy it
  mkdir -p /workspaces/tripbot/build/src/prisma/tripbot
  cp -r /workspaces/tripbot/src/prisma/tripbot/generated /workspaces/tripbot/build/src/prisma/tripbot/generated
  mkdir -p /workspaces/tripbot/build/src/prisma/moodle
  cp -r /workspaces/tripbot/src/prisma/moodle/generated /workspaces/tripbot/build/src/prisma/moodle/generated
  tail -f /dev/null
else
  echo "Running production"
  pm2-runtime /workspaces/tripbot/build/src/start.js
fi