#!/bin/sh
set -e

if [ "$NODE_ENV" = "development" ]; then
  echo "Waiting for DB..."
  ./src/docker/wait-for-it.sh --timeout=5 tripbot_database:5432
  if [ ! -d node_modules/prisma ]; then
    echo "node_modules missing or incomplete (fresh volume?) - running npm ci..."
    npm ci --no-audit --silent
  fi
  npm run db:deploy
  npm run db:generate
  tail -f /dev/null
else
  echo "Running production"

  attempt=0
  until npx prisma migrate deploy; do
    attempt=$((attempt + 1))
    if [ "$attempt" -ge 10 ]; then
      echo "Migrations failed after $attempt attempts - refusing to start." >&2
      exit 1
    fi
    echo "Migration attempt $attempt failed (database may still be starting); retrying in 5s..."
    sleep 5
  done

  if [ "${DEPLOY_DISCORD_COMMANDS_ON_START:-}" = "true" ]; then
    echo "Deploying commands"
    node /workspaces/tripbot/build/src/discord/utils/commandDeploy.js deployCommands \
      || echo "Command deploy failed - starting the bot anyway." >&2
  fi

  pm2-runtime /workspaces/tripbot/build/src/start.js
fi