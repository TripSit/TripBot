import {
  ContextMenuCommandBuilder,
  GuildMember,
} from 'discord.js';
import {
  ApplicationCommandType,
} from 'discord-api-types/v10';
import { stripIndents } from 'common-tags';
import { user_action_type } from '@prisma/client';
import { MessageCommand } from '../../@types/commandDef';
import commandContext from '../../utils/context';
import { warn } from './d.moderate';

const F = f(__filename);

export const mWarn: MessageCommand = {
  data: new ContextMenuCommandBuilder()
    .setName('Warn')
    .setType(ApplicationCommandType.Message),
  async execute(interaction) {
    log.info(F, await commandContext(interaction));

    await warn(
      interaction,
      (interaction.targetMessage.member as GuildMember),
    );

    return true;
  },
};

export default mWarn;
