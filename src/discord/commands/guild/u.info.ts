import {
  ContextMenuCommandBuilder,
  GuildMember,
} from 'discord.js';
import {
  ApplicationCommandType,
} from 'discord-api-types/v10';
import { UserCommand } from '../../@types/commandDef';
import commandContext from '../../utils/context';
import { info } from './d.moderate';

const F = f(__filename);

export const uInfo: UserCommand = {
  data: new ContextMenuCommandBuilder()
    .setName('Info')
    .setType(ApplicationCommandType.User),
  async execute(interaction) {
    log.info(F, await commandContext(interaction));
    await info(
      interaction,
      (interaction.targetMember as GuildMember).id,
    );
    return true;
  },
};

export default uInfo;
