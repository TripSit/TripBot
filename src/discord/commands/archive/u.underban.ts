import {
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  ContextMenuCommandBuilder,
  GuildMember,
  ModalSubmitInteraction,
} from 'discord.js';
import {
  ApplicationCommandType,
  TextInputStyle,
} from 'discord-api-types/v10';
import { UserCommand } from '../../@types/commandDef';
// import log from '../../../global/utils/log';
import { moderate } from '../../../global/commands/g.moderate';
import commandContext from '../../utils/context';
// import {startLog} from '../../utils/startLog';
import { UserActionType } from '../../../global/@types/database';
import { embedTemplate } from '../../utils/embedTemplate';
import { ban } from '../guild/d.moderate';

const F = f(__filename);

export const uUnderban: UserCommand = {
  data: new ContextMenuCommandBuilder()
    .setName('Underban')
    .setType(ApplicationCommandType.User),
  async execute(interaction) {
    log.info(F, await commandContext(interaction));
    await ban(
      interaction,
      (interaction.targetMember as GuildMember).id,
      
    )

    return true;
  },
};

export default uUnderban;
