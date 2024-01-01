import {
  ContextMenuCommandBuilder,
  GuildMember,
} from 'discord.js';
import {
  ApplicationCommandType,
} from 'discord-api-types/v10';
import { MessageCommand } from '../../@types/commandDef';
import commandContext from '../../utils/context';
import { timeout } from './d.moderate';

const F = f(__filename);

export const mTimeout: MessageCommand = {
  data: new ContextMenuCommandBuilder()
    .setName('Timeout')
    .setType(ApplicationCommandType.Message),
  async execute(interaction) {
    log.info(F, await commandContext(interaction));

    await timeout(
      interaction,
      (interaction.targetMessage.member as GuildMember),
    );

    return true;
  },
};

export default mTimeout;
