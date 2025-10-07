/* eslint-disable max-len */
import {
  AnySelectMenuInteraction,
} from 'discord.js';
import { rpgHome, rpgMarketChange } from '../commands/guild/d.rpg';
import { applicationStart, applicationReject } from '../utils/application';
import commandContext from '../utils/context';
import { helpMenu } from '../commands/global/d.help';
import { aiMenu } from '../commands/global/d.ai';
import { purgeMenu } from '../commands/guild/d.purge';
import { handleBanReasonSelect } from '../utils/modUtils';
// import log from '../../global/utils/log';
// import {parse} from 'path';
const F = f(__filename);

export default selectMenu;

export async function selectMenu(
  interaction: AnySelectMenuInteraction,
): Promise<void> {
  const { customId } = interaction;
  log.info(F, await commandContext(interaction));

  const menuID = interaction.customId;

  if (interaction.isStringSelectMenu()) {
    if (menuID.startsWith('banReasonSelect')) {
      await handleBanReasonSelect(interaction);
      return;
    }
    if (menuID.startsWith('helpSelectMenu')) {
      await helpMenu(interaction);
      return;
    }
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
    if (menuID.startsWith('AI')) {
      await interaction.update(await aiMenu(interaction));
    }
  }

  // eslint-disable-next-line sonarjs/no-collapsible-if
  if (interaction.isUserSelectMenu()) {
    if (menuID.startsWith('purge')) {
      await purgeMenu(interaction);
    }
  }

  if (interaction.isChannelSelectMenu() && menuID.startsWith('AI')) {
    await interaction.update(await aiMenu(interaction));
  }
}
