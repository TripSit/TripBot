import {
  ContextMenuCommandBuilder,
  GuildMember,
} from 'discord.js';
import {
  ApplicationCommandType,
} from 'discord-api-types/v10';
import { user_action_type } from '@prisma/client';
import { UserCommand } from '../../@types/commandDef';
import commandContext from '../../utils/context';
import { kick } from './d.moderate';

const F = f(__filename);

export const uKick: UserCommand = {
  data: new ContextMenuCommandBuilder()
    .setName('Kick')
    .setType(ApplicationCommandType.User),
  async execute(interaction) {
    log.info(F, await commandContext(interaction));
    await kick(
      interaction,
      interaction.targetMember as GuildMember,
    );

    return true;
  },
};

export default uKick;
