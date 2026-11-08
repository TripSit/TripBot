import { Client, IrcCommand, MessageEvent } from 'irc-framework';
import {
  BRIDGE_LABELS, bridgedChannels, findGateways, registerBridgeTarget, relayMessage,
} from '../global/bridge/bridge';
import {
  splitMessage, stripIrcFormatting, stripMarkdown, toIrcNick,
} from '../global/bridge/bridge.format';
import { BridgeOutgoing, BridgeTarget } from '../global/bridge/bridge.types';

const F = f(__filename);

// Matterbridge settings: MessageLength, MessageDelay, MessageQueue
export const IRC_MESSAGE_BYTES = 400;
export const IRC_MESSAGE_DELAY_MS = 1000;
export const IRC_MESSAGE_QUEUE = 30;
const DEFAULT_NICK_LENGTH = 32;
const RELAYMSG_CAP = 'draft/relaymsg';
const ECHO_CAP = 'echo-message';
const RELAYED_LABELS = Object.values(BRIDGE_LABELS).map(label => `/${label}`);

interface QueuedLine {
  channel: string;
  nick: string;
  text: string;
  action: boolean;
  sourceId?: string;
}

interface ChannelQueue {
  lines: QueuedLine[];
  timer?: NodeJS.Timeout;
}

/** A sent line whose server echo (carrying the msgid needed to redact it) has not arrived yet. */
interface PendingEcho {
  channel: string;
  message: string;
  action: boolean;
  sourceId: string;
}

interface RelayedMessage {
  channel: string;
  msgid: string;
}

// Each channel drains on its own timer so one busy channel cannot starve or overflow the others
const queues = new Map<string, ChannelQueue>();
const pendingEchoes: PendingEcho[] = [];
const relayedMessages = new Map<string, RelayedMessage[]>();
const MAX_PENDING_ECHOES = 200;
const MAX_TRACKED_MESSAGES = 1000;
let relayMsgDenied = false;

const channelKey = (channel: string) => channel.toLowerCase();

function canRelayMsg(client: Client): boolean {
  return !relayMsgDenied && client.network.cap.isEnabled(RELAYMSG_CAP);
}

function fallbackText(nick: string, text: string, action: boolean): string {
  return action ? `* ${nick} ${text}` : `<${nick}> ${text}`;
}

function sendLine(client: Client, line: QueuedLine): void {
  const {
    channel, nick, text, action, sourceId,
  } = line;
  const relayMsg = canRelayMsg(client);
  if (relayMsg) {
    client.raw('RELAYMSG', channel, nick, action ? `\x01ACTION ${text}\x01` : text);
  } else {
    client.say(channel, fallbackText(nick, text, action));
  }
  if (!sourceId) return;
  // The echo reports exactly what the server delivered, so record what to look for
  pendingEchoes.push({
    channel: channelKey(channel),
    message: relayMsg ? text : fallbackText(nick, text, action),
    action: relayMsg && action,
    sourceId,
  });
  if (pendingEchoes.length > MAX_PENDING_ECHOES) pendingEchoes.shift();
}

function drain(client: Client, key: string): void {
  const queue = queues.get(key);
  const line = queue?.lines.shift();
  if (!queue || !line) {
    queues.delete(key);
    return;
  }
  if (client.connected) sendLine(client, line);
  queue.timer = setTimeout(() => drain(client, key), IRC_MESSAGE_DELAY_MS);
}

function enqueue(client: Client, channel: string, lines: QueuedLine[]): void {
  const key = channelKey(channel);
  const queue = queues.get(key) ?? { lines: [] };
  const accepted = lines.slice(0, IRC_MESSAGE_QUEUE - queue.lines.length);
  if (accepted.length < lines.length) {
    log.warn(F, `IRC relay queue for ${channel} is full, dropped ${lines.length - accepted.length} line(s)`);
  }
  queue.lines.push(...accepted);
  const idle = !queues.has(key);
  queues.set(key, queue);
  if (idle) drain(client, key);
}

export function createIrcBridgeTarget(client: Client): BridgeTarget {
  return {
    platform: 'irc',
    async send(channel: string, message: BridgeOutgoing): Promise<void> {
      if (!client.connected) {
        log.debug(F, `Not connected to IRC, dropping message for ${channel}`);
        return;
      }
      const nickLength = Number(client.network.supports('NICKLEN')) || DEFAULT_NICK_LENGTH;
      const nick = toIrcNick(message.nick, BRIDGE_LABELS[message.sourcePlatform], nickLength);
      // Budget for the fallback `<nick> ` prefix so a later RELAYMSG denial doesn't overflow lines
      const prefixBytes = Buffer.byteLength(`<${nick}> `, 'utf8');
      const lines = splitMessage(stripMarkdown(message.text), IRC_MESSAGE_BYTES - prefixBytes);
      enqueue(client, channel, lines.map(text => ({
        channel, nick, text, action: message.action, sourceId: message.sourceId,
      })));
    },
    async remove(channel: string, sourceId: string): Promise<void> {
      // Lines still waiting in the queue never reach IRC
      const queue = queues.get(channelKey(channel));
      if (queue) queue.lines = queue.lines.filter(line => line.sourceId !== sourceId);
      const relayed = relayedMessages.get(sourceId);
      relayedMessages.delete(sourceId);
      if (!relayed || !client.connected) return;
      relayed.forEach(({ channel: relayedChannel, msgid }) => client.raw('REDACT', relayedChannel, msgid));
    },
  };
}

function isRelayedByUs(client: Client, { nick, tags }: MessageEvent): boolean {
  const relayer = tags[RELAYMSG_CAP];
  if (relayer !== undefined) return relayer === client.user.nick;
  // Ergo reserves the RELAYMSG separator, so only relayed nicks end in one of our labels
  return RELAYED_LABELS.some(label => nick.endsWith(label));
}

/** Remembers the msgid the server gave a line we sent, so the message can be redacted later. */
function recordEcho(client: Client, event: MessageEvent, action: boolean): boolean {
  const ours = event.nick === client.user.nick || event.tags[RELAYMSG_CAP] === client.user.nick;
  if (!ours) return false;
  const { msgid } = event.tags;
  const index = pendingEchoes.findIndex(pending => pending.channel === channelKey(event.target)
    && pending.message === event.message && pending.action === action);
  if (!msgid || index === -1) return true;
  const [{ sourceId }] = pendingEchoes.splice(index, 1);
  const relayed = relayedMessages.get(sourceId) ?? [];
  relayed.push({ channel: event.target, msgid });
  // Re-insert so the oldest message is the first to be forgotten
  relayedMessages.delete(sourceId);
  relayedMessages.set(sourceId, relayed);
  if (relayedMessages.size > MAX_TRACKED_MESSAGES) {
    relayedMessages.delete(relayedMessages.keys().next().value as string);
  }
  return true;
}

function relayIrcMessage(client: Client, event: MessageEvent, action: boolean): void {
  if (recordEcho(client, event, action)) return;
  if (event.from_server || event.nick === client.user.nick || isRelayedByUs(client, event)) return;
  // History Ergo replays on join arrives in a batch and has already been relayed
  if (event.batch) return;
  if (findGateways('irc', event.target).length === 0) return;
  relayMessage({
    platform: 'irc',
    channel: event.target,
    nick: event.nick,
    text: stripIrcFormatting(event.message),
    action,
  }).catch(err => log.error(F, `Failed to relay IRC message from ${event.target}: ${err}`));
}

export function registerIrcBridge(client: Client): void {
  // echo-message reports the msgid of each relayed line, which deleting a relayed message needs
  client.requestCap([RELAYMSG_CAP, ECHO_CAP]);
  registerBridgeTarget(createIrcBridgeTarget(client));

  client.on('privmsg', event => relayIrcMessage(client, event, false));
  client.on('action', event => relayIrcMessage(client, event, true));
  client.on('unknown command', ({ command, params }: IrcCommand) => {
    if (command === 'FAIL' && params[0] === 'REDACT') {
      log.warn(F, `IRC refused to redact a relayed message (${params.slice(1).join(' ')})`);
      return;
    }
    if (command !== 'FAIL' || params[0] !== 'RELAYMSG') return;
    // Without the relaymsg oper capability or channel op, fall back to `<nick> message`
    if (!relayMsgDenied) {
      log.error(F, `RELAYMSG refused (${params.slice(1).join(' ')}), falling back to plain messages`);
    }
    relayMsgDenied = true;
  });
  client.on('registered', () => {
    relayMsgDenied = false;
  });
}

/** Channels to join: the IRC_CHANNELS override, or every bridged channel. */
export function ircChannels(): string[] {
  return env.IRC_CHANNELS.length > 0 ? env.IRC_CHANNELS : bridgedChannels('irc');
}
