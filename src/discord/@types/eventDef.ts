import type {
  Client,
  Collection,
  DMChannel,
  Guild,
  GuildAuditLogsEntry,
  GuildBan,
  GuildChannel,
  GuildEmoji,
  GuildMember,
  Interaction,
  InvalidRequestWarningData,
  Invite,
  Message,
  MessageReaction,
  NewsChannel,
  RateLimitData,
  Role,
  Snowflake,
  Sticker,
  TextBasedChannel,
  TextChannel,
  ThreadChannel,
  User,
  VoiceChannel,
  VoiceState,
} from 'discord.js';

export interface ChannelCreateEvent {
  execute: (channel: GuildChannel) => Promise<void>;
  name: string;
}

export interface ChannelDeleteEvent {
  execute: (channel: DMChannel | GuildChannel) => Promise<void>;
  name: string;
}

export interface ChannelPinsUpdateEvent {
  execute: (channel: TextBasedChannel, time: Date) => Promise<void>;
  name: string;
}

export interface ChannelUpdateEvent {
  execute: (
    oldChannel: DMChannel | GuildChannel,
    newChannel: DMChannel | GuildChannel,
  ) => Promise<void>;
  name: string;
}

export interface DebugEvent {
  execute: (info: string) => Promise<void>;
  name: string;
}

export interface EmojiCreateEvent {
  execute: (emoji: GuildEmoji) => Promise<void>;
  name: string;
}

export interface EmojiDeleteEvent {
  execute: (emoji: GuildEmoji) => Promise<void>;
  name: string;
}

export interface EmojiUpdateEvent {
  execute: (oldEmoji: GuildEmoji, newEmoji: GuildEmoji) => Promise<void>;
  name: string;
}

export interface ErrorEvent {
  execute: (error: Error) => Promise<void>;
  name: string;
}

export interface GuildAuditLogEntryCreateEvent {
  execute: (auditLogEntry: GuildAuditLogsEntry, guild: Guild) => Promise<void>;
  name: string;
}

export interface GuildBanAddEvent {
  execute: (ban: GuildBan) => Promise<void>;
  name: string;
}

export interface GuildBanRemoveEvent {
  execute: (ban: GuildBan) => Promise<void>;
  name: string;
}

export interface GuildCreateEvent {
  execute: (guild: Guild) => Promise<void>;
  name: string;
}

export interface GuildDeleteEvent {
  execute: (guild: Guild) => Promise<void>;
  name: string;
}

export interface GuildIntegrationsUpdateEvent {
  execute: (guild: Guild) => Promise<void>;
  name: string;
}

export interface GuildMemberAddEvent {
  execute: (member: GuildMember) => Promise<void>;
  name: string;
}

export interface GuildMemberRemoveEvent {
  execute: (member: GuildMember) => Promise<void>;
  name: string;
}

export interface GuildMemberUpdateEvent {
  execute: (oldMember: GuildMember, newMember: GuildMember) => Promise<void>;
  name: string;
}

export interface GuildUpdateEvent {
  execute: (oldGuild: Guild, newGuild: Guild) => Promise<void>;
  name: string;
}

export interface InteractionCreateEvent {
  execute: (interaction: Interaction) => Promise<void>;
  name: string;
}

export interface InvalidRequestWarningEvent {
  execute: (invalidRequestWarningData: InvalidRequestWarningData) => Promise<void>;
  name: string;
}

export interface InviteCreateEvent {
  execute: (invite: Invite) => Promise<void>;
  name: string;
}

export interface InviteDeleteEvent {
  execute: (invite: Invite) => Promise<void>;
  name: string;
}

export interface MessageCreateEvent {
  execute: (message: Message) => Promise<void>;
  name: string;
}

export interface MessageDeleteBulkEvent {
  execute: (messages: Collection<Snowflake, Message>) => Promise<void>;
  name: string;
}

export interface MessageDeleteEvent {
  execute: (message: Message) => Promise<void>;
  name: string;
}

export interface MessageReactionAddEvent {
  execute: (messageReaction: MessageReaction, user: User) => Promise<void>;
  name: string;
}

export interface MessageReactionRemoveEvent {
  execute: (messageReaction: MessageReaction, user: User) => Promise<void>;
  name: string;
}

export interface MessageUpdateEvent {
  execute: (oldMessage: Message, newMessage: Message) => Promise<void>;
  name: string;
}

export interface RateLimitEvent {
  execute: (rateLimitData: RateLimitData) => Promise<void>;
  name: string;
}

export interface ReadyEvent {
  execute: (discordClient: Client) => Promise<void>;
  name: string;
  once: boolean;
}

export interface RoleCreateEvent {
  execute: (role: Role) => Promise<void>;
  name: string;
}

export interface RoleDeleteEvent {
  execute: (role: Role) => Promise<void>;
  name: string;
}

export interface RoleUpdateEvent {
  execute: (oldRole: Role, newRole: Role) => Promise<void>;
  name: string;
}

export interface StickerCreateEvent {
  execute: (role: Sticker) => Promise<void>;
  name: string;
}

export interface StickerDeleteEvent {
  execute: (role: Sticker) => Promise<void>;
  name: string;
}

export interface StickerUpdateEvent {
  execute: (oldSticker: Sticker, newSticker: Sticker) => Promise<void>;
  name: string;
}

export interface ThreadCreateEvent {
  execute: (thread: ThreadChannel, newlyCreated: boolean) => Promise<void>;
  name: string;
}

export interface ThreadDeleteEvent {
  execute: (thread: ThreadChannel) => Promise<void>;
  name: string;
}

export interface ThreadUpdateEvent {
  execute: (oldThread: ThreadChannel, newThread: ThreadChannel) => Promise<void>;
  name: string;
}

export interface VoiceStateUpdateEvent {
  execute: (oldState: VoiceState, newState: VoiceState) => Promise<void>;
  name: string;
}

export interface WarnEvent {
  execute: (info: string) => Promise<void>;
  name: string;
}

export interface WebhookUpdateEvent {
  execute: (channel: NewsChannel | TextChannel | VoiceChannel) => Promise<void>;
  name: string;
}
