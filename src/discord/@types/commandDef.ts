import {
  ChatInputCommandInteraction,
  ContextMenuCommandBuilder,
  SlashCommandBuilder,
  SlashCommandSubcommandsOnlyBuilder,
  MessageContextMenuCommandInteraction,
  UserContextMenuCommandInteraction,
} from 'discord.js';

export interface SlashCommand {
  data:
  | Omit<SlashCommandBuilder, 'addSubcommandGroup' | 'addSubcommand'>
  | SlashCommandSubcommandsOnlyBuilder;
  execute: (interaction: ChatInputCommandInteraction) => Promise<boolean>;
}

export interface MessageCommand {
  data: ContextMenuCommandBuilder;
  execute: (interaction: MessageContextMenuCommandInteraction) => Promise<boolean>;
}

export interface UserCommand {
  data: ContextMenuCommandBuilder;
  execute: (interaction: UserContextMenuCommandInteraction) => Promise<boolean>;
}
