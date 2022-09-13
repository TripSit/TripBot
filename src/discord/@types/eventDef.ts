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
} from 'discord.js';

export interface voiceEvent {
  name: string;
  execute: (Old: VoiceState, New: VoiceState) => Promise<void>;
}

export interface reactionEvent {
  name: string;
  execute: (reaction: MessageReaction, user: User) => Promise<void>;
}

export interface messageEvent {
  name: string;
  execute: (message: Message) => Promise<void>;
}

export interface interactionEvent {
  name: string;
  execute: (interaction: Interaction, client: Client) => Promise<void>;
}

export interface inviteEvent {
  name: string;
  execute: (invite: Invite) => Promise<void>;
}

export interface clientEvent {
  name: string;
  once?: boolean;
  execute: (client: Client) => Promise<void>;
}

export interface guildEvent {
  name: string;
  once?: boolean;
  execute: (guild: Guild) => Promise<void>;
}

export interface guildMemberEvent {
  name: string;
  once?: boolean;
  execute: (member: GuildMember, client: Client) => Promise<void>;
}

export interface guildMemberUpdateEvent {
  name: string;
  once?: boolean;
  execute: (oldMember: GuildMember, newMember: GuildMember) => Promise<void>;
}

export interface errorEvent {
  name: string;
  once?: boolean;
  execute: (error: Error) => Promise<void>;
}
