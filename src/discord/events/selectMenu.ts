/* eslint-disable max-len */
import {
  AnySelectMenuInteraction,
  StringSelectMenuInteraction,
} from 'discord.js';
import { rpgHome, rpgMarketChange } from '../commands/guild/d.rpg';
import { applicationStart, applicationReject } from '../utils/application';
import commandContext from '../utils/context';
import { helpMenu } from '../commands/global/d.help';
import { aiMenu } from '../commands/global/d.ai';
import { purgeMenu } from '../commands/guild/d.purge';
import { modHistoryButton } from '../utils/modHistory';

const F = f(__filename);

export default selectMenu;

async function handleRpgSelect(interaction: StringSelectMenuInteraction): Promise<void> {
  if (!interaction.customId.includes(interaction.user.id)) {
    log.debug(F, 'Button clicked by someone other than the user who clicked it');
    return;
  }
  await interaction.deferUpdate();
  if (interaction.customId.startsWith('rpgGeneralSelect')) await interaction.editReply(await rpgMarketChange(interaction));
  else if (interaction.customId.startsWith('rpgBackgroundSelect')) await interaction.editReply(await rpgHome(interaction, ''));
}

async function handleStringSelect(interaction: StringSelectMenuInteraction): Promise<void> {
  const menuID = interaction.customId;
  if (menuID.startsWith('modHistory')) {
    await modHistoryButton(interaction);
  } else if (menuID.startsWith('helpSelectMenu')) {
    await helpMenu(interaction);
  } else if (menuID.startsWith('rpg')) {
    await handleRpgSelect(interaction);
  } else if (menuID.startsWith('applicationReject')) {
    await applicationReject(interaction);
  } else if (menuID.startsWith('applicationRoleSelectMenu')) {
    await applicationStart(interaction);
  } else if (menuID.startsWith('AI')) {
    await interaction.update(await aiMenu(interaction));
  }
}

export async function selectMenu(
  interaction: AnySelectMenuInteraction,
): Promise<void> {
  log.info(F, await commandContext(interaction));

  const menuID = interaction.customId;

  if (interaction.isStringSelectMenu()) {
    await handleStringSelect(interaction);
  } else if (interaction.isUserSelectMenu() && menuID.startsWith('purge')) {
    await purgeMenu(interaction);
  } else if (interaction.isChannelSelectMenu() && menuID.startsWith('AI')) {
    await interaction.update(await aiMenu(interaction));
  }
}
