import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  GuildMember,
} from 'discord.js';
import {SlashCommand} from '../../@types/commandDef';
import {timezone} from '../../../global/commands/g.timezone';
import logger from '../../../global/utils/logger';
import * as path from 'path';
const PREFIX = path.parse(__filename).name;

export const time: SlashCommand = {
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
  async execute(interaction:ChatInputCommandInteraction) {
    let command = interaction.options.getSubcommand() as 'get' | 'set' | undefined;
    const tzValue = interaction.options.getString('timezone')!;
    let user = interaction.options.getMember('user');

    if (command === undefined) {
      command = 'get';
    }

    if (user === null) {
      user = interaction.member;
    }

    const response = await timezone(command, (user as GuildMember), tzValue);

    if (command === 'get') {
      interaction.reply(response);
    } else {
      interaction.reply({content: response, ephemeral: true});
    }
    logger.debug(`[${PREFIX}] finished!`);
  },
};
