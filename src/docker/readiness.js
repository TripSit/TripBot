'use strict';

if (!process.env.DISCORD_CLIENT_TOKEN) process.exit(1);
fetch(`http://127.0.0.1:${process.env.API_PORT || '1337'}/api/health`, {
  signal: AbortSignal.timeout(4000),
})
  .then(response => process.exit(response.ok ? 0 : 1))
  .catch(() => process.exit(1));
