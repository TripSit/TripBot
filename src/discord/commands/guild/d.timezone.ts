/* eslint-disable max-len */
import {
  SlashCommandBuilder,
  GuildMember,
} from 'discord.js';
import { SlashCommand } from '../../@types/commandDef';
import { timezone } from '../../../global/commands/g.timezone';
import { embedTemplate } from '../../utils/embedTemplate';
import commandContext from '../../utils/context';
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
        // .setRequired(true) If nothing is provided it defaults to the user who ran the command
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
    let command = interaction.options.getSubcommand() as 'get' | 'set' | undefined;
    if (command === 'set') {
      await interaction.deferReply({ ephemeral: true });
    } else {
      await interaction.deferReply({ ephemeral: (interaction.options.getBoolean('ephemeral') === true) });
    }
    const tzValue = interaction.options.getString('timezone');
    let member = interaction.options.getMember('user') as GuildMember | null;

    if (command === undefined) {
      command = 'get';
    }

    if (member === null) {
      member = interaction.member as GuildMember;
    }

    const response = await timezone(command, member.id, tzValue, interaction);

    // log.debug(F, `response: ${response}`);

    if (command === 'get') {
      const embed = embedTemplate();
      if (response === '') {
        embed.setTitle(`${member.displayName} is a timeless treasure <3\n(Has not set a time zone)`);
        await interaction.editReply({ embeds: [embed] });
        // await interaction.editReply({ content: `${member.displayName} is a timeless treasure <3 (and has not set a time zone)` });
      } else {
        embed.setTitle(`${response} wherever ${member.displayName} is located`);
        await interaction.editReply({ embeds: [embed] });
        // await interaction.editReply({ content: `${response} wherever ${member.displayName} is located.` });
      }
    } else {
      await interaction.editReply({ content: response as string });
    }
    return true;
  },
};

export default dTimezone;
