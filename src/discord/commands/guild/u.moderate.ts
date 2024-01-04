import {
  ContextMenuCommandBuilder,
} from 'discord.js';
import {
  ApplicationCommandType,
} from 'discord-api-types/v10';
import { UserCommand } from '../../@types/commandDef';
import commandContext from '../../utils/context';
import { modButtons, userInfoEmbed } from './d.moderate';

const F = f(__filename);

export const uModerate: UserCommand = {
  data: new ContextMenuCommandBuilder()
    .setName('Moderate')
    .setType(ApplicationCommandType.User),
  async execute(interaction) {
    log.info(F, await commandContext(interaction));
    await interaction.reply({
      embeds: [await userInfoEmbed(interaction.targetUser.id, 'INFO')],
      ephemeral: true,
      components: [modButtons(interaction.targetId)],
    });
    return true;
  },
};

export default uModerate;
