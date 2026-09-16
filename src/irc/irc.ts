import { Client } from 'irc-framework';
import registerEvents from './events';

const F = f(__filename);

const RECONNECT_BASE_MS = 5_000;
const RECONNECT_MAX_MS = 5 * 60_000;
// irc-framework has no handlers for these numerics, so they arrive as 'unknown command'
const RPL_YOUREOPER = '381';
const ERR_NOOPERHOST = '491';

let registered = false;
let stopping = false;
let saslFailed = false;
let reconnectAttempts = 0;
let reconnectTimer: NodeJS.Timeout | undefined;

function scheduleReconnect(client: Client): void {
  if (stopping || reconnectTimer) return;
  const delay = Math.min(RECONNECT_BASE_MS * 2 ** reconnectAttempts, RECONNECT_MAX_MS);
  reconnectAttempts += 1;
  log.warn(F, `Disconnected from IRC, reconnecting in ${delay / 1000}s (attempt ${reconnectAttempts})`);
  reconnectTimer = setTimeout(() => {
    reconnectTimer = undefined;
    client.connect();
  }, delay);
}

export function ircDisconnect(message = 'Shutting down'): void {
  stopping = true;
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = undefined;
  }
  if (global.ircClient?.connected) global.ircClient.quit(message);
}

export default async function ircConnect(): Promise<void> {
  const client = new Client();
  global.ircClient = client;
  registerEvents(client);

  client.on('registered', ({ nick }) => {
    registered = true;
    reconnectAttempts = 0;
    log.info(F, `Connected to IRC ${env.IRC_SERVER} as ${nick}`);
    if (env.IRC_OPER_NAME && env.IRC_OPER_PASSWORD) {
      client.raw('OPER', env.IRC_OPER_NAME, env.IRC_OPER_PASSWORD);
    }
    // irc-framework does not rejoin on reconnect, so join on every registration
    env.IRC_CHANNELS.forEach((channel: string) => client.join(channel));
  });

  client.on('join', ({ nick, channel }) => {
    if (nick === client.user.nick) log.info(F, `Joined IRC channel ${channel}`);
  });

  client.on('nick in use', ({ nick }) => {
    // Only pick a fallback nick while registering; otherwise registration stalls
    if (registered) return;
    log.warn(F, `IRC nick ${nick} is in use, trying ${nick}_`);
    client.changeNick(`${nick}_`);
  });

  client.on('sasl failed', ({ reason, message }) => {
    saslFailed = true;
    log.error(F, `IRC SASL authentication failed (${reason}): ${message ?? 'no reason given'}`);
  });

  client.on('unknown command', ({ command }) => {
    if (command === RPL_YOUREOPER) log.info(F, `Opered up on IRC as ${env.IRC_OPER_NAME}`);
    if (command === ERR_NOOPERHOST) log.error(F, 'IRC OPER failed: no matching oper block for this host');
  });

  client.on('irc error', ({ error, channel, reason }) => {
    log.warn(F, `IRC error: ${error} in ${channel ?? 'n/a'} (${reason ?? 'no reason given'})`);
  });

  client.on('socket close', err => {
    if (err) log.error(F, `IRC connection error: ${err.message}`);
  });

  client.on('close', () => {
    registered = false;
    if (stopping) return;
    if (saslFailed) {
      log.error(F, 'Not reconnecting to IRC until the SASL credentials are fixed');
      return;
    }
    scheduleReconnect(client);
  });

  log.info(F, `Connecting to IRC ${env.IRC_SERVER}:${env.IRC_PORT}${env.IRC_TLS ? ' (TLS)' : ''}`);
  client.connect({
    host: env.IRC_SERVER,
    port: env.IRC_PORT,
    tls: env.IRC_TLS,
    nick: env.IRC_NICK,
    username: env.IRC_USERNAME,
    gecos: 'TripBot',
    account: {
      account: env.IRC_USERNAME,
      password: env.IRC_PASSWORD,
    },
    // Reconnects are handled by scheduleReconnect so that initial connection failures are retried too
    auto_reconnect: false,
    sasl_disconnect_on_fail: true,
  });
}
