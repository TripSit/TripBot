import {
  ContextMenuCommandBuilder,
  GuildMember,
} from 'discord.js';
import {
  ApplicationCommandType,
} from 'discord-api-types/v10';
import { UserCommand } from '../../@types/commandDef';
// import log from '../../../global/utils/log';
import { moderate } from '../../../global/commands/g.moderate';
import { commandContext } from '../../utils/context';

const F = f(__filename);

export const uInfo: UserCommand = {
  data: new ContextMenuCommandBuilder()
    .setName('Info')
    .setType(ApplicationCommandType.User),
  async execute(interaction) {
    log.info(F, await commandContext(interaction));
    await interaction.deferReply({ ephemeral: true });
    await interaction.editReply(await moderate(
      interaction.member as GuildMember,
      'INFO',
      interaction.options.data[0].member as GuildMember,
      null,
      null,
      null,
    ));
    return true;
  },
};

export default uInfo;
