const F = f(__filename);

export const HEARTBEAT_INTERVAL_MS = 60_000;
const HEARTBEAT_TIMEOUT_MS = 10_000;

let timer: NodeJS.Timeout | undefined;

/** Healthy means every configured connection is up: Discord ready, and IRC connected. */
export function isHealthy(): boolean {
  const discordUp = !env.DISCORD_CLIENT_TOKEN || Boolean(global.discordClient?.isReady());
  const ircUp = !env.IRC_PASSWORD || Boolean(global.ircClient?.connected);
  return discordUp && ircUp;
}

/**
 * Pings an uptime monitor (an Uptime Kuma push URL) once a minute while the bot is healthy.
 * Nothing is sent when it is unhealthy, so the monitor raises the alert after its own timeout.
 * Does nothing when HEARTBEAT_URL is not set.
 */
export default function startHeartbeat(): void {
  const url = process.env.HEARTBEAT_URL;
  if (!url || timer) return;
  const ping = async () => {
    if (!isHealthy()) {
      log.debug(F, 'Not healthy, skipping heartbeat');
      return;
    }
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(HEARTBEAT_TIMEOUT_MS) });
      if (!response.ok) log.warn(F, `Heartbeat endpoint answered HTTP ${response.status}`);
    } catch (err) {
      // Never let a monitoring problem affect the bot
      log.debug(F, `Heartbeat failed: ${err}`);
    }
  };
  log.info(F, 'Heartbeat enabled');
  timer = setInterval(ping, HEARTBEAT_INTERVAL_MS);
  timer.unref();
  ping();
}
