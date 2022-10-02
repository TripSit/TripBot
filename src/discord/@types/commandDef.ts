import {
  ChatInputCommandInteraction,
  ContextMenuCommandBuilder,
  SlashCommandBuilder,
  SlashCommandSubcommandsOnlyBuilder,
  MessageContextMenuCommandInteraction,
  UserContextMenuCommandInteraction,
  ModalSubmitInteraction,
} from 'discord.js';

export interface SlashCommand {
  data:
    | Omit<SlashCommandBuilder, 'addSubcommandGroup' | 'addSubcommand'>
    | SlashCommandSubcommandsOnlyBuilder;
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
  submit?: (interaction: ModalSubmitInteraction) => Promise<void>;
}

export interface SlashCommand1 {
  data:
    | Omit<SlashCommandBuilder, 'addSubcommandGroup' | 'addSubcommand'>
    | SlashCommandSubcommandsOnlyBuilder;
  execute: (interaction: ChatInputCommandInteraction) => Promise<boolean>;
  submit?: (interaction: ModalSubmitInteraction) => Promise<void>;
}

export interface MessageCommand {
  data: ContextMenuCommandBuilder;
  execute: (interaction: MessageContextMenuCommandInteraction) => Promise<void>;
  submit?: (interaction: ModalSubmitInteraction) => Promise<void>;
}

export interface UserCommand {
  data: ContextMenuCommandBuilder;
  execute: (interaction: UserContextMenuCommandInteraction) => Promise<void>;
  submit?: (interaction: ModalSubmitInteraction) => Promise<void>;
}
