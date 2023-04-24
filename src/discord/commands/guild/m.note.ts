import {
  ContextMenuCommandBuilder,
} from 'discord.js';
import {
  ApplicationCommandType,
} from 'discord-api-types/v10';
import { MessageCommand } from '../../@types/commandDef';
import commandContext from '../../utils/context';
// import log from '../../../global/utils/log';
import { note } from './d.moderate';

const F = f(__filename);

export const mNote: MessageCommand = {
  data: new ContextMenuCommandBuilder()
    .setName('Note')
    .setType(ApplicationCommandType.Message),
  async execute(interaction) {
    log.info(F, await commandContext(interaction));

    await note(
      interaction,
      interaction.targetMessage.member ?? interaction.targetMessage.author,
    );

    return true;
  },
};

export default mNote;
