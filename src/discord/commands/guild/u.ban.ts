import {
  ContextMenuCommandBuilder,
  GuildMember,
} from 'discord.js';
import {
  ApplicationCommandType,
} from 'discord-api-types/v10';
import { UserCommand } from '../../@types/commandDef';
// import log from '../../../global/utils/log';
import commandContext from '../../utils/context';
import { ban } from './d.moderate';

const F = f(__filename);

export const uBan: UserCommand = {
  data: new ContextMenuCommandBuilder()
    .setName('Ban')
    .setType(ApplicationCommandType.User),
  async execute(interaction) {
    log.info(F, await commandContext(interaction));
    await ban(
      interaction,
      (interaction.targetMember as GuildMember).id,
    );
    return true;
  },
};

export default uBan;
