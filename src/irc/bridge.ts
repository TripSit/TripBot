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
const RELAYED_LABELS = Object.values(BRIDGE_LABELS).map(label => `/${label}`);

interface QueuedLine {
  channel: string;
  nick: string;
  text: string;
  action: boolean;
}

const queue: QueuedLine[] = [];
let drainTimer: NodeJS.Timeout | undefined;
let relayMsgDenied = false;

function canRelayMsg(client: Client): boolean {
  return !relayMsgDenied && client.network.cap.isEnabled(RELAYMSG_CAP);
}

function sendLine(client: Client, line: QueuedLine): void {
  const {
    channel, nick, text, action,
  } = line;
  if (canRelayMsg(client)) {
    client.raw('RELAYMSG', channel, nick, action ? `\x01ACTION ${text}\x01` : text);
  } else {
    client.say(channel, action ? `* ${nick} ${text}` : `<${nick}> ${text}`);
  }
}

function drain(client: Client): void {
  const line = queue.shift();
  if (!line) {
    drainTimer = undefined;
    return;
  }
  if (client.connected) sendLine(client, line);
  drainTimer = setTimeout(() => drain(client), IRC_MESSAGE_DELAY_MS);
}

function enqueue(client: Client, lines: QueuedLine[]): void {
  const accepted = lines.slice(0, IRC_MESSAGE_QUEUE - queue.length);
  if (accepted.length < lines.length) {
    log.warn(F, `IRC relay queue is full, dropped ${lines.length - accepted.length} line(s)`);
  }
  queue.push(...accepted);
  if (!drainTimer) drain(client);
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
      enqueue(client, lines.map(text => ({
        channel, nick, text, action: message.action,
      })));
    },
  };
}

function isRelayedByUs(client: Client, { nick, tags }: MessageEvent): boolean {
  const relayer = tags[RELAYMSG_CAP];
  if (relayer !== undefined) return relayer === client.user.nick;
  // Ergo reserves the RELAYMSG separator, so only relayed nicks end in one of our labels
  return RELAYED_LABELS.some(label => nick.endsWith(label));
}

function relayIrcMessage(client: Client, event: MessageEvent, action: boolean): void {
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
  client.requestCap(RELAYMSG_CAP);
  registerBridgeTarget(createIrcBridgeTarget(client));

  client.on('privmsg', event => relayIrcMessage(client, event, false));
  client.on('action', event => relayIrcMessage(client, event, true));
  client.on('unknown command', ({ command, params }: IrcCommand) => {
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
