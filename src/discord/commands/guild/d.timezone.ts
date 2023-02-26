/* eslint-disable max-len */
import {
  SlashCommandBuilder,
  GuildMember,
} from 'discord.js';
import { SlashCommand } from '../../@types/commandDef';
import { timezone } from '../../../global/commands/g.timezone';
import { startLog } from '../../utils/startLog';
// import log from '../../../global/utils/log';
const F = f(__filename);

export default dTimezone;

export const dTimezone: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('timezone')
    .setDescription('Get or set timezones!')
    .addSubcommand(subcommand => subcommand
      .setName('get')
      .setDescription('Get someone\'s timezone!')
      .addUserOption(option => option
        .setName('user')
        .setDescription('User to lookup'))
      .addBooleanOption(option => option.setName('ephemeral')
        .setDescription('Set to "True" to show the response only to you')))
    .addSubcommand(subcommand => subcommand
      .setName('set')
      .setDescription('Set your timezone!')
      .addStringOption(option => option
        .setName('timezone')
        .setDescription('Timezone value')
        .setRequired(true)
        .setAutocomplete(true))),
  async execute(interaction) {
    startLog(F, interaction);
    let command = interaction.options.getSubcommand() as 'get' | 'set' | undefined;
    const tzValue = interaction.options.getString('timezone');
    let member = interaction.options.getMember('user') as GuildMember | null;

    if (command === undefined) {
      command = 'get';
    }

    if (member === null) {
      member = interaction.member as GuildMember;
    }

    const response = await timezone(command, member.id, tzValue);

    // log.debug(F, `response: ${response}`);

    if (command === 'get') {
      const ephemeral = (interaction.options.getBoolean('ephemeral') === true);
      if (response === null) {
        interaction.reply({ content: `${member.displayName} is a timeless treasure <3 (and has not set a time zone)`, ephemeral });
      } else {
        interaction.reply({ content: `${response} wherever ${member.displayName} is located.`, ephemeral });
      }
    } else {
      interaction.reply({ content: response as string, ephemeral: true });
    }
    return true;
  },
};
