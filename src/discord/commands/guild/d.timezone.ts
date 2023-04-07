/* eslint-disable max-len */
import {
  SlashCommandBuilder,
  GuildMember,
} from 'discord.js';
import { SlashCommand } from '../../@types/commandDef';
import { timezone } from '../../../global/commands/g.timezone';
import { commandContext } from '../../utils/context';
// import log from '../../../global/utils/log';
const F = f(__filename);

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
    log.info(F, await commandContext(interaction));
    await interaction.deferReply({ ephemeral: (interaction.options.getBoolean('ephemeral') === true) });
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
      if (response === null) {
        await interaction.editReply({ content: `${member.displayName} is a timeless treasure <3 (and has not set a time zone)` });
      } else {
        await interaction.editReply({ content: `${response} wherever ${member.displayName} is located.` });
      }
    } else {
      await interaction.editReply({ content: response as string });
    }
    return true;
  },
};

export default dTimezone;
