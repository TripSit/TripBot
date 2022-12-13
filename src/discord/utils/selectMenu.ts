import {
  SelectMenuInteraction,
} from 'discord.js';
import { applicationStart, applicationReject } from './application';
// import log from '../../global/utils/log';
// import {parse} from 'path';
// const F = f(__filename);

export default selectMenu;

/**
 * This runs whenever a buttion is clicked
 * @param {SelectMenuInteraction} interaction The interaction that initialized this
 * @param {Client} client The client that manages it
 * @return {Promise<void>}
 */
export async function selectMenu(interaction:SelectMenuInteraction): Promise<void> {
  const { customId } = interaction;
  // log.debug(F, `customId: ${customId}`);

  if (customId.startsWith('applicationReject')) {
    await applicationReject(interaction);
  }
  if (customId.startsWith('applicationRoleSelectMenu')) {
    await applicationStart(interaction);
  }
}
