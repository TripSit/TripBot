import type { EventEmitter } from 'events';
import { Client, IrcCommand } from 'irc-framework';
import {
  getMappingRows, markIrcRegistered, onMappingChange, setIrcChannelLength,
} from '../global/bridge/bridge.mappings';
import { ircChannels } from './bridge';

const F = f(__filename);

const JOIN_BATCH_SIZE = 10;
const JOIN_BATCH_BYTES = 400;
const JOIN_BATCH_DELAY_MS = 1000;
const OPER_WAIT_MS = 5000;
// irc-framework has no handlers for these numerics, so they arrive as 'unknown command'
const RPL_YOUREOPER = '381';
const ERR_PASSWDMISMATCH = '464';
const ERR_NOOPERHOST = '491';
const ERR_NOSUCHCHANNEL = '403';
const ERR_NOPRIVS = '723';
// Errors that SAJOIN can get past
const JOIN_BLOCKED = new Set(['invite_only_channel', 'banned_from_channel', 'bad_channel_key']);

const DEFAULT_TOPIC_LENGTH = 300;
const key = (channel: string) => channel.toLowerCase();

/** A Discord topic as one IRC line: newlines and runs of whitespace collapsed, cut to the server's limit. */
export function normalizeTopic(topic: string, maxLength = DEFAULT_TOPIC_LENGTH): string {
  return topic.replace(/\s+/g, ' ').trim().slice(0, maxLength);
}

/** Splits channels into JOIN lines that stay within the batch size and byte budget. */
export function batchChannels(channels: string[]): string[][] {
  const batches: string[][] = [];
  let current: string[] = [];
  let bytes = 0;
  channels.forEach(channel => {
    const size = Buffer.byteLength(channel) + 1;
    if (current.length > 0 && (current.length >= JOIN_BATCH_SIZE || bytes + size > JOIN_BATCH_BYTES)) {
      batches.push(current);
      current = [];
      bytes = 0;
    }
    current.push(channel);
    bytes += size;
  });
  if (current.length > 0) batches.push(current);
  return batches;
}

/**
 * Keeps the bot in the channels the bridge mapping says it should be in: joins after OPER, follows mapping
 * changes at runtime, and sets up channels the bot itself creates. Every privileged step (creating channels,
 * SAJOIN, ChanServ) is allowed to fail; it is logged and the rest carries on.
 */
export function registerIrcChannels(client: Client): void {
  const joined = new Set<string>();
  const requested = new Set<string>();
  const managed = new Set<string>();
  const sajoinTried = new Set<string>();
  const setupTried = new Set<string>();
  const currentTopics = new Map<string, string>();
  let ready = false;
  let operTimer: NodeJS.Timeout | undefined;
  let batchTimer: NodeJS.Timeout | undefined;
  const joinQueue: string[][] = [];

  const sendNextBatch = () => {
    batchTimer = undefined;
    const batch = joinQueue.shift();
    if (!batch) return;
    if (client.connected) client.raw('JOIN', batch.join(','));
    if (joinQueue.length > 0) batchTimer = setTimeout(sendNextBatch, JOIN_BATCH_DELAY_MS);
  };

  const reconcile = () => {
    if (!ready || !client.connected) return;
    const desired = new Map(ircChannels().map(channel => [key(channel), channel]));
    const toJoin = [...desired].filter(([name]) => !joined.has(name) && !requested.has(name));
    const toPart = [...managed].filter(name => !desired.has(name) && joined.has(name));
    managed.clear();
    desired.forEach((_channel, name) => managed.add(name));

    toPart.forEach(name => {
      log.info(F, `Leaving IRC channel ${name}: no longer bridged`);
      client.raw('PART', name, 'No longer bridged');
      joined.delete(name);
    });
    if (toJoin.length === 0) return;
    toJoin.forEach(([name]) => requested.add(name));
    const idle = joinQueue.length === 0 && !batchTimer;
    joinQueue.push(...batchChannels(toJoin.map(([, channel]) => channel)));
    if (idle) sendNextBatch();
  };

  const startJoining = () => {
    if (ready) return;
    if (operTimer) clearTimeout(operTimer);
    operTimer = undefined;
    ready = true;
    reconcile();
  };

  client.on('registered', () => {
    joined.clear();
    requested.clear();
    sajoinTried.clear();
    currentTopics.clear();
    joinQueue.length = 0;
    ready = false;
    const length = Number(client.network.supports('CHANNELLEN'));
    setIrcChannelLength(length > 0 ? length : undefined);
    if (env.IRC_OPER_NAME && env.IRC_OPER_PASSWORD) {
      // Wait for the OPER verdict: creating channels and SAJOIN need the oper classes it grants
      operTimer = setTimeout(() => {
        log.warn(F, 'No answer to OPER, joining IRC channels anyway');
        startJoining();
      }, OPER_WAIT_MS);
    } else {
      startJoining();
    }
  });

  client.on('close', () => {
    ready = false;
    joined.clear();
    requested.clear();
    joinQueue.length = 0;
    if (operTimer) clearTimeout(operTimer);
    if (batchTimer) clearTimeout(batchTimer);
    operTimer = undefined;
    batchTimer = undefined;
  });

  client.on('unknown command', ({ command, params }: IrcCommand) => {
    if (command === RPL_YOUREOPER) startJoining();
    else if (command === ERR_NOOPERHOST || command === ERR_PASSWDMISMATCH) {
      log.warn(F, 'IRC OPER was refused; joining only channels that already exist and are open to the bot');
      startJoining();
    } else if (command === ERR_NOPRIVS) {
      log.warn(F, `IRC refused a privileged command (${params.slice(1).join(' ')}); the oper class may lack it`);
    } else if (command === ERR_NOSUCHCHANNEL && requested.has(key(params[1] ?? ''))) {
      log.warn(F, `Could not join ${params[1]}: it does not exist and the bot cannot create it (needs chanreg)`);
    }
  });

  client.on('join', ({ nick, channel }) => {
    if (nick !== client.user.nick) return;
    joined.add(key(channel));
  });

  const forget = ({ nick, channel }: { nick: string; channel: string }) => {
    if (nick === client.user.nick) joined.delete(key(channel));
  };
  // Not in irc-framework's event typings
  const untyped = client as unknown as EventEmitter;
  untyped.on('part', forget);
  untyped.on('kick', ({ kicked, channel }: { kicked: string; channel: string }) => {
    forget({ nick: kicked, channel });
  });

  client.on('irc error', ({ error, channel }: { error: string; channel?: string }) => {
    if (!channel || !JOIN_BLOCKED.has(error)) return;
    if (sajoinTried.has(key(channel))) {
      log.error(F, `Could not join ${channel} (${error}), even with SAJOIN`);
      return;
    }
    sajoinTried.add(key(channel));
    log.warn(F, `Could not join ${channel} (${error}), trying SAJOIN`);
    client.raw('SAJOIN', client.user.nick, channel);
  });

  // The server sends the topic (if any) before the name list ends; later TOPIC changes arrive the same way
  untyped.on('topic', ({ channel, topic }: { channel: string; topic?: string }) => {
    currentTopics.set(key(channel), normalizeTopic(topic ?? ''));
  });

  // Makes the IRC topic match Discord's. Needs channel op, so a refusal is only logged at debug level
  const syncTopic = (channel: string) => {
    const row = getMappingRows().find(candidate => key(candidate.irc_channel) === key(channel));
    if (!row?.topic || !joined.has(key(channel))) return;
    const length = Number(client.network.supports('TOPICLEN')) || DEFAULT_TOPIC_LENGTH;
    const topic = normalizeTopic(row.topic, length);
    if (currentTopics.get(key(channel)) === topic) return;
    currentTopics.set(key(channel), topic);
    client.raw('TOPIC', channel, topic);
  };

  // A channel the bot is alone in was created by its JOIN, so it is ours to register.
  // Registering is attempted even for known channels: if one is already registered the server just says so.
  untyped.on('userlist', ({ channel, users }: { channel: string; users: unknown[] }) => {
    const row = getMappingRows().find(candidate => key(candidate.irc_channel) === key(channel));
    if (!row) return;
    syncTopic(channel);
    if (users.length !== 1 || setupTried.has(key(channel))) return;
    setupTried.add(key(channel));
    log.info(F, `Alone in IRC channel ${channel}, registering it`);
    client.raw('CS', 'REGISTER', channel);
  });

  client.on('notice', ({ nick, message }: { nick: string; message: string }) => {
    if (nick.toLowerCase() !== 'chanserv') return;
    log.info(F, `ChanServ: ${message}`);
    // Covers both "successfully registered" and "already registered"
    const match = getMappingRows().find(row => !row.irc_registered
      && message.toLowerCase().includes(key(row.irc_channel)) && /\bregistered\b/i.test(message));
    if (match) markIrcRegistered(match.irc_channel).catch(err => log.error(F, `Failed to record registration: ${err}`));
  });

  onMappingChange(change => {
    reconcile();
    change.topics.forEach(syncTopic);
  });
}
