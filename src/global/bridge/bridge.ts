import { bridgeGateways } from './bridge.gateways';
import {
  BridgeGateway, BridgeMessage, BridgePlatform, BridgeTarget,
} from './bridge.types';

const F = f(__filename);

/** How each platform labels relayed users, e.g. `name/d` on IRC for Discord users. */
export const BRIDGE_LABELS: Record<BridgePlatform, string> = {
  discord: 'd',
  irc: 'i',
  matrix: 'M',
};

export const EDIT_SUFFIX = ' (edited)';

// Old bridge and bot accounts that should never be relayed
const IGNORED_NICKS = new Set(['github', 'tsdev', 'tsdev1', 'ts1', 'ts11']);
const NICK_REPLACEMENTS: [RegExp, string][] = [[/zmzm/g, 'zimzim'], [/zımzım/g, 'zimzim']];
const MESSAGE_REPLACEMENTS: [RegExp, string][] = [[/@everyone/g, 'everyone'], [/@here/g, 'here']];

const targets = new Map<BridgePlatform, BridgeTarget>();

export function registerBridgeTarget(target: BridgeTarget): void {
  targets.set(target.platform, target);
}

export function unregisterBridgeTarget(platform: BridgePlatform): void {
  targets.delete(platform);
}

/** The platform's channel for a gateway in the current environment, if it has one. */
export function gatewayChannel(gateway: BridgeGateway, platform: BridgePlatform): string | undefined {
  if (platform === 'discord') {
    const channelId = gateway.discord ? env[gateway.discord] : undefined;
    return typeof channelId === 'string' && channelId.length > 0 ? channelId : undefined;
  }
  return gateway[platform];
}

function sameChannel(platform: BridgePlatform, a: string, b: string): boolean {
  // IRC channel names are case-insensitive
  return platform === 'irc' ? a.toLowerCase() === b.toLowerCase() : a === b;
}

export function findGateways(platform: BridgePlatform, channel: string): BridgeGateway[] {
  return bridgeGateways.filter(gateway => {
    const gatewayChannelName = gatewayChannel(gateway, platform);
    return gatewayChannelName !== undefined && sameChannel(platform, gatewayChannelName, channel);
  });
}

/** Every channel bridged on a platform in the current environment. */
export function bridgedChannels(platform: BridgePlatform): string[] {
  const channels = bridgeGateways
    .map(gateway => gatewayChannel(gateway, platform))
    .filter((channel): channel is string => channel !== undefined);
  return [...new Set(channels)];
}

const applyReplacements = (text: string, replacements: [RegExp, string][]) => replacements
  .reduce((result, [pattern, replacement]) => result.replace(pattern, replacement), text);

/** Sends a message to the matching channel on every other platform with a registered target. */
export async function relayMessage(message: BridgeMessage): Promise<void> {
  if (IGNORED_NICKS.has(message.nick.toLowerCase())) return;
  if (message.text.trim().length === 0) return;

  const nick = applyReplacements(message.nick, NICK_REPLACEMENTS);
  const text = applyReplacements(message.text, MESSAGE_REPLACEMENTS);
  const sent = new Set<string>();

  const deliveries = findGateways(message.platform, message.channel).flatMap(gateway => [...targets.values()]
    .filter(target => target.platform !== message.platform)
    .map(target => ({ target, channel: gatewayChannel(gateway, target.platform), gatewayName: gateway.name }))
    .filter(({ target, channel }) => {
      // A channel in several gateways (e.g. Movies/TV-Movies) should only receive a message once
      const key = `${target.platform}:${channel}`;
      if (channel === undefined || sent.has(key)) return false;
      sent.add(key);
      return true;
    })
    .map(async ({ target, channel, gatewayName }) => {
      try {
        await target.send(channel as string, {
          gateway: gatewayName,
          sourcePlatform: message.platform,
          nick,
          text,
          action: message.action ?? false,
          avatarUrl: message.avatarUrl,
        });
      } catch (err) {
        log.error(F, `Failed to relay ${message.platform} message to ${target.platform} ${channel}: ${err}`);
      }
    }));

  await Promise.all(deliveries);
}
