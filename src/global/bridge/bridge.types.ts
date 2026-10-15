export type BridgePlatform = 'discord' | 'irc' | 'matrix';

/** One bridged conversation: the same channel on each platform. */
export interface BridgeGateway {
  name: string;
  /** Name of the env.config channel key, so production and development resolve to their own IDs. */
  discord?: string;
  irc?: string;
  /** Matrix room ID. */
  matrix?: string;
}

/** A message received on one platform. */
export interface BridgeMessage {
  platform: BridgePlatform;
  /** Discord channel ID, IRC channel name, or Matrix room ID. */
  channel: string;
  nick: string;
  text: string;
  /** IRC /me or Discord-style emote. */
  action?: boolean;
  avatarUrl?: string;
}

/** A message ready to be sent to another platform. */
export interface BridgeOutgoing {
  gateway: string;
  sourcePlatform: BridgePlatform;
  nick: string;
  text: string;
  action: boolean;
  avatarUrl?: string;
}

export interface BridgeTarget {
  platform: BridgePlatform;
  send(channel: string, message: BridgeOutgoing): Promise<void>;
}
