/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  Colors,
  SlashCommandBuilder,
  TextChannel,
  ModalSubmitInteraction,
  User,
} from 'discord.js';
import {
  TextInputStyle,
} from 'discord-api-types/v10';
import { SlashCommand } from '../@types/commandDef';
import { embedTemplate } from './embedTemplate';
import { globalTemplate } from '../../global/commands/_g.template';
import { startLog } from './startLog';

const F = f(__filename);

export default dTemplate;

async function getDiscordUser(string:string):Promise<User> {
  let returnUser = {} as User;
  // Check if the string begins with <@ or ends with >
  if (!string.startsWith('<@') || !string.endsWith('>')) {
    log.debug(F, `getDiscordUser: ${string} is a mention!`);
    returnUser = await client.users.fetch(string);
  }

  // Check if the string is a series of numbers
  if (Number.isInteger(string)) {
    log.debug(F, `getDiscordUser: ${string} is a number!`);
  }

  // Chec if the string is a tag
  if (string.includes('#')) {
    log.debug(F, `getDiscordUser: ${string} is a tag!`);
  }

  log.debug(F, `getDiscordUser: ${returnUser})`);
  return returnUser;
}

export const dTemplate: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('template')
    .setDescription('Example!')
    .addSubcommand(subcommand => subcommand
      .setName('subcommand')
      .setDescription('subcommand')
      .addStringOption(option => option.setName('string')
        .setDescription('string')
        .setRequired(true))),
  async execute(interaction) {
    startLog(F, interaction);

    const string = interaction.options.getString('string') as string;

    interaction.reply({ content: string });
    return true;
  },
};
