import {
  Client,
  Guild,
  GuildMember,
  Interaction,
  Invite,
  Message,
  MessageReaction,
  User,
  VoiceState,
  DMChannel,
  GuildChannel,
  GuildEmoji,
  Role,
  Sticker,
  ThreadChannel,
  TextBasedChannel,
  RateLimitData,
  TextChannel,
  NewsChannel,
  VoiceChannel,
  GuildBan,
  InvalidRequestWarningData,
  Snowflake,
  Collection,
} from 'discord.js';

export interface channelCreateEvent {
  name: string;
  execute: (channel: GuildChannel) => Promise<void>;
}

export interface channelDeleteEvent {
  name: string;
  execute: (channel: DMChannel | GuildChannel) => Promise<void>;
}

export interface channelUpdateEvent {
  name: string;
  execute: (oldChannel: DMChannel | GuildChannel, newChannel: DMChannel | GuildChannel) => Promise<void>;
}

export interface channelPinsUpdateEvent {
  name: string;
  execute: (channel: TextBasedChannel, time: Date) => Promise<void>;
}

export interface readyEvent {
  name: string;
  once: boolean;
  execute: (client: Client) => Promise<void>;
}

export interface debugEvent {
  name: string;
  execute: (info: string) => Promise<void>;
}

export interface emojiCreateEvent {
  name: string;
  execute: (emoji: GuildEmoji) => Promise<void>;
}

export interface emojiDeleteEvent {
  name: string;
  execute: (emoji: GuildEmoji) => Promise<void>;
}

export interface emojiUpdateEvent {
  name: string;
  execute: (oldEmoji: GuildEmoji, newEmoji: GuildEmoji) => Promise<void>;
}

export interface errorEvent {
  name: string;
  execute: (error: Error) => Promise<void>;
}

export interface guildBanAddEvent {
  name: string;
  execute: (ban: GuildBan) => Promise<void>;
}

export interface guildBanRemoveEvent {
  name: string;
  execute: (ban: GuildBan) => Promise<void>;
}

export interface guildCreateEvent {
  name: string;
  execute: (guild: Guild) => Promise<void>;
}

export interface guildDeleteEvent {
  name: string;
  execute: (guild: Guild) => Promise<void>;
}

export interface guildUpdateEvent {
  name: string;
  execute: (oldGuild: Guild, newGuild: Guild) => Promise<void>;
}

export interface guildMemberAddEvent {
  name: string;
  execute: (member: GuildMember) => Promise<void>;
}

export interface guildMemberRemoveEvent {
  name: string;
  execute: (member: GuildMember) => Promise<void>;
}

export interface guildMemberUpdateEvent {
  name: string;
  execute: (oldMember: GuildMember, newMember: GuildMember) => Promise<void>;
}

export interface guildIntegrationsUpdateEvent {
  name: string;
  execute: (guild: Guild) => Promise<void>;
}

export interface interactionCreateEvent {
  name: string;
  execute: (interaction: Interaction) => Promise<void>;
}

export interface inviteCreateEvent {
  name: string;
  execute: (invite: Invite) => Promise<void>;
}

export interface inviteDeleteEvent {
  name: string;
  execute: (invite: Invite) => Promise<void>;
}

export interface invalidRequestWarningEvent {
  name: string;
  execute: (invalidRequestWarningData: InvalidRequestWarningData) => Promise<void>;
}

export interface messageCreateEvent {
  name: string;
  execute: (message: Message) => Promise<void>;
}

export interface messageDeleteEvent {
  name: string;
  execute: (message: Message) => Promise<void>;
}

export interface messageUpdateEvent {
  name: string;
  execute: (oldMessage: Message, newMessage: Message) => Promise<void>;
}

export interface messageDeleteBulkEvent {
  name: string;
  execute: (messages: Collection <Snowflake, Message>) => Promise<void>;
}

export interface messageReactionAddEvent {
  name: string;
  execute: (messageReaction: MessageReaction, user: User) => Promise<void>;
}

export interface messageReactionRemoveEvent {
  name: string;
  execute: (messageReaction: MessageReaction, user: User) => Promise<void>;
}

export interface rateLimitEvent {
  name: string;
  execute: (rateLimitData: RateLimitData) => Promise<void>;
}

export interface roleCreateEvent {
  name: string;
  execute: (role: Role) => Promise<void>;
}

export interface roleDeleteEvent {
  name: string;
  execute: (role: Role) => Promise<void>;
}

export interface roleUpdateEvent {
  name: string;
  execute: (oldRole: Role, newRole: Role) => Promise<void>;
}

export interface stickerCreateEvent {
  name: string;
  execute: (role: Sticker) => Promise<void>;
}

export interface stickerDeleteEvent {
  name: string;
  execute: (role: Sticker) => Promise<void>;
}

export interface stickerUpdateEvent {
  name: string;
  execute: (oldSticker: Sticker, newSticker: Sticker) => Promise<void>;
}

export interface threadCreateEvent {
  name: string;
  execute: (thread: ThreadChannel, newlyCreated: boolean) => Promise<void>;
}

export interface threadDeleteEvent {
  name: string;
  execute: (thread: ThreadChannel) => Promise<void>;
}

export interface threadUpdateEvent {
  name: string;
  execute: (oldThread: ThreadChannel, newThread: ThreadChannel) => Promise<void>;
}

export interface voiceStateUpdateEvent {
  name: string;
  execute: (oldState: VoiceState, newState: VoiceState) => Promise<void>;
}

export interface warnEvent {
  name: string;
  execute: (info: string) => Promise<void>;
}

export interface webhookUpdateEvent {
  name: string;
  execute: (channel: TextChannel | NewsChannel | VoiceChannel) => Promise<void>;
}
