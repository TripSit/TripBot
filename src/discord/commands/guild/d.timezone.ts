import {
  SlashCommandBuilder,
  GuildMember,
} from 'discord.js';
import {SlashCommand1} from '../../@types/commandDef';
import {timezone} from '../../../global/commands/g.timezone';
import logger from '../../../global/utils/logger';
import * as path from 'path';
const PREFIX = path.parse(__filename).name;

export const time: SlashCommand1 = {
  data: new SlashCommandBuilder()
    .setName('timezone')
    .setDescription('Get or set timezones!')
    .addSubcommand((subcommand) => subcommand
      .setName('get')
      .setDescription('Get someone\'s timezone!')
      .addUserOption((option) => option
        .setName('user')
        .setDescription('User to lookup'),
      ),
    )
    .addSubcommand((subcommand) => subcommand
      .setName('set')
      .setDescription('Set your timezone!')
      .addStringOption((option) => option
        .setName('timezone')
        .setDescription('Timezone value')
        .setRequired(true)
        .setAutocomplete(true)),
    ),
  execute: async (interaction) => {
    let command = interaction.options.getSubcommand() as 'get' | 'set' | undefined;
    const tzValue = interaction.options.getString('timezone')!;
    let member = interaction.options.getMember('user') as GuildMember | null;

    if (command === undefined) {
      command = 'get';
    }

    if (member === null) {
      member = interaction.member as GuildMember;
    }

    const response = await timezone(command, member.id, tzValue);

    logger.debug(`[${PREFIX}] response: ${response}`);

    if (command === 'get') {
      if (response.length === 0) {
        interaction.reply(`${member.displayName} is a timeless treasure <3 (and has not set a time zone)`);
      } else {
        interaction.reply(`${response} wherever ${member.displayName} is located.`);
      }
    } else {
      interaction.reply({content: response, ephemeral: true});
    }
    // logger.debug(`[${PREFIX}] finished!`);
    return true;
  },
};
