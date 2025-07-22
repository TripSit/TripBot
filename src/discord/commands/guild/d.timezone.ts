import type { GuildMember } from 'discord.js';

import { MessageFlags, SlashCommandBuilder } from 'discord.js';

import type { SlashCommand } from '../../@types/commandDef';

import { timezone } from '../../../global/commands/g.timezone';
import commandContext from '../../utils/context';
import { embedTemplate } from '../../utils/embedTemplate';

const F = f(__filename);

export const dTimezone: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('timezone')
    .setDescription('Get or set timezones!')
    .setIntegrationTypes([0])
    .addSubcommand((subcommand) =>
      subcommand
        .setName('get')
        .setDescription("Get someone's timezone!")
        .addUserOption((option) =>
          option
            // .setRequired(true) If nothing is provided it defaults to the user who ran the command
            .setName('user')
            .setDescription('User to lookup'),
        )
        .addBooleanOption((option) =>
          option
            .setName('ephemeral')
            .setDescription('Set to "True" to show the response only to you'),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('set')
        .setDescription('Set your timezone!')
        .addStringOption((option) =>
          option
            .setName('timezone')
            .setDescription('Timezone value')
            .setRequired(true)
            .setAutocomplete(true),
        ),
    ),
  async execute(interaction) {
    log.info(F, await commandContext(interaction));
    let command = interaction.options.getSubcommand() as 'get' | 'set' | undefined;
    const ephemeral = interaction.options.getBoolean('ephemeral')
      ? MessageFlags.Ephemeral
      : undefined;
    await (command === 'set'
      ? interaction.deferReply({ flags: MessageFlags.Ephemeral })
      : interaction.deferReply({ flags: ephemeral }));
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
      const embed = embedTemplate();
      switch (response) {
        case '': {
          embed.setTitle(
            `${member.displayName} is a timeless treasure <3\n(Has not set a time zone)`,
          );
          await interaction.editReply({ embeds: [embed] });

          break;
        }
        case 'invalid': {
          embed.setTitle(
            'Invalid timezone!\nPlease only use the options from the autocomplete list.',
          );
          await interaction.editReply({ embeds: [embed] });

          break;
        }
        case 'updated': {
          embed.setTitle(`I updated your timezone to ${tzValue}`);
          await interaction.editReply({ embeds: [embed] });

          break;
        }
        default: {
          embed.setTitle(`${response} wherever ${member.displayName} is located`);
          await interaction.editReply({ embeds: [embed] });
          // await interaction.editReply({ content: `${response} wherever ${member.displayName} is located.` });
        }
      }
    } else {
      await interaction.editReply({ content: response });
    }
    return true;
  },
};

export default dTimezone;
