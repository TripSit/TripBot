/* eslint-disable max-len */
import {
  StringSelectMenuInteraction,
} from 'discord.js';
import { rpgHome, rpgMarketChange } from '../commands/guild/d.rpg';
import { applicationStart, applicationReject } from '../utils/application';
import { startLog } from '../utils/startLog';
// import log from '../../global/utils/log';
// import {parse} from 'path';
const F = f(__filename);

export default selectMenu;

export async function selectMenu(interaction:StringSelectMenuInteraction): Promise<void> {
  const { customId } = interaction;
  startLog(F, interaction);

  const menuID = interaction.customId;

  if (menuID.startsWith('rpg')) {
    if (!menuID.includes(interaction.user.id)) {
      log.debug(F, 'Button clicked by someone other than the user who clicked it');
      return;
    }
    await interaction.deferUpdate();
    if (interaction.customId.startsWith('rpgGeneralSelect')) await interaction.editReply(await rpgMarketChange(interaction));
    else if (interaction.customId.startsWith('rpgBackgroundSelect')) await interaction.editReply(await rpgHome(interaction, ''));
  }

  if (customId.startsWith('applicationReject')) {
    await applicationReject(interaction);
  }
  if (customId.startsWith('applicationRoleSelectMenu')) {
    await applicationStart(interaction);
  }
}
