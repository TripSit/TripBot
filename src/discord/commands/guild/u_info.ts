import {
  ContextMenuCommandBuilder,
  GuildMember,
} from 'discord.js';
import {
  ApplicationCommandType,
} from 'discord-api-types/v10';
import {UserCommand} from '../../@types/commandDef';
import logger from '../../../global/utils/logger';
import {moderate} from '../../../global/commands/g.moderate';
import * as path from 'path';
const PREFIX = path.parse(__filename).name;

export const info: UserCommand = {
  data: new ContextMenuCommandBuilder()
    .setName('Info')
    .setType(ApplicationCommandType.User),
  async execute(interaction) {
    const actor = interaction.member as GuildMember;
    const target = interaction.options.data[0].member as GuildMember;

    const result = await moderate(
      actor,
      'info',
      target,
      undefined,
      'on',
      undefined,
      undefined,
      undefined,
      interaction,
    );

    logger.debug(`[${PREFIX}] Result: ${result}`);
    interaction.reply(result);

    logger.debug(`[${PREFIX}] finished!`);
  },
};
