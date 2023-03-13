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
  GuildAuditLogsEntry,
} from 'discord.js';

export interface GuildAuditLogEntryCreateEvent {
  name: string;
  execute: (auditLogEntry: GuildAuditLogsEntry, guild: Guild) => Promise<void>;
}

export interface ChannelCreateEvent {
  name: string;
  execute: (channel: GuildChannel) => Promise<void>;
}

export interface ChannelDeleteEvent {
  name: string;
  execute: (channel: DMChannel | GuildChannel) => Promise<void>;
}

export interface ChannelUpdateEvent {
  name: string;
  execute: (oldChannel: DMChannel | GuildChannel, newChannel: DMChannel | GuildChannel) => Promise<void>;
}

export interface ChannelPinsUpdateEvent {
  name: string;
  execute: (channel: TextBasedChannel, time: Date) => Promise<void>;
}

export interface ReadyEvent {
  name: string;
  once: boolean;
  execute: (client: Client) => Promise<void>;
}

export interface DebugEvent {
  name: string;
  execute: (info: string) => Promise<void>;
}

export interface EmojiCreateEvent {
  name: string;
  execute: (emoji: GuildEmoji) => Promise<void>;
}

export interface EmojiDeleteEvent {
  name: string;
  execute: (emoji: GuildEmoji) => Promise<void>;
}

export interface EmojiUpdateEvent {
  name: string;
  execute: (oldEmoji: GuildEmoji, newEmoji: GuildEmoji) => Promise<void>;
}

export interface ErrorEvent {
  name: string;
  execute: (error: Error) => Promise<void>;
}

export interface GuildBanAddEvent {
  name: string;
  execute: (ban: GuildBan) => Promise<void>;
}

export interface GuildBanRemoveEvent {
  name: string;
  execute: (ban: GuildBan) => Promise<void>;
}

export interface GuildCreateEvent {
  name: string;
  execute: (guild: Guild) => Promise<void>;
}

export interface GuildDeleteEvent {
  name: string;
  execute: (guild: Guild) => Promise<void>;
}

export interface GuildUpdateEvent {
  name: string;
  execute: (oldGuild: Guild, newGuild: Guild) => Promise<void>;
}

export interface GuildMemberAddEvent {
  name: string;
  execute: (member: GuildMember) => Promise<void>;
}

export interface GuildMemberRemoveEvent {
  name: string;
  execute: (member: GuildMember) => Promise<void>;
}

export interface GuildMemberUpdateEvent {
  name: string;
  execute: (oldMember: GuildMember, newMember: GuildMember) => Promise<void>;
}

export interface GuildIntegrationsUpdateEvent {
  name: string;
  execute: (guild: Guild) => Promise<void>;
}

export interface InteractionCreateEvent {
  name: string;
  execute: (interaction: Interaction) => Promise<void>;
}

export interface InviteCreateEvent {
  name: string;
  execute: (invite: Invite) => Promise<void>;
}

export interface InviteDeleteEvent {
  name: string;
  execute: (invite: Invite) => Promise<void>;
}

export interface InvalidRequestWarningEvent {
  name: string;
  execute: (invalidRequestWarningData: InvalidRequestWarningData) => Promise<void>;
}

export interface MessageCreateEvent {
  name: string;
  execute: (message: Message) => Promise<void>;
}

export interface MessageDeleteEvent {
  name: string;
  execute: (message: Message) => Promise<void>;
}

export interface MessageUpdateEvent {
  name: string;
  execute: (oldMessage: Message, newMessage: Message) => Promise<void>;
}

export interface MessageDeleteBulkEvent {
  name: string;
  execute: (messages: Collection <Snowflake, Message>) => Promise<void>;
}

export interface MessageReactionAddEvent {
  name: string;
  execute: (messageReaction: MessageReaction, user: User) => Promise<void>;
}

export interface MessageReactionRemoveEvent {
  name: string;
  execute: (messageReaction: MessageReaction, user: User) => Promise<void>;
}

export interface RateLimitEvent {
  name: string;
  execute: (rateLimitData: RateLimitData) => Promise<void>;
}

export interface RoleCreateEvent {
  name: string;
  execute: (role: Role) => Promise<void>;
}

export interface RoleDeleteEvent {
  name: string;
  execute: (role: Role) => Promise<void>;
}

export interface RoleUpdateEvent {
  name: string;
  execute: (oldRole: Role, newRole: Role) => Promise<void>;
}

export interface StickerCreateEvent {
  name: string;
  execute: (role: Sticker) => Promise<void>;
}

export interface StickerDeleteEvent {
  name: string;
  execute: (role: Sticker) => Promise<void>;
}

export interface StickerUpdateEvent {
  name: string;
  execute: (oldSticker: Sticker, newSticker: Sticker) => Promise<void>;
}

export interface ThreadCreateEvent {
  name: string;
  execute: (thread: ThreadChannel, newlyCreated: boolean) => Promise<void>;
}

export interface ThreadDeleteEvent {
  name: string;
  execute: (thread: ThreadChannel) => Promise<void>;
}

export interface ThreadUpdateEvent {
  name: string;
  execute: (oldThread: ThreadChannel, newThread: ThreadChannel) => Promise<void>;
}

export interface VoiceStateUpdateEvent {
  name: string;
  execute: (oldState: VoiceState, newState: VoiceState) => Promise<void>;
}

export interface WarnEvent {
  name: string;
  execute: (info: string) => Promise<void>;
}

export interface WebhookUpdateEvent {
  name: string;
  execute: (channel: TextChannel | NewsChannel | VoiceChannel) => Promise<void>;
}
