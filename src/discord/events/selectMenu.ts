import {
  SelectMenuInteraction,
} from 'discord.js';
import { applicationStart, applicationReject } from '../utils/application';
import { startLog } from '../utils/startLog';
// import log from '../../global/utils/log';
// import {parse} from 'path';
const F = f(__filename);

export default selectMenu;

/**
 * This runs whenever a buttion is clicked
 * @param {SelectMenuInteraction} interaction The interaction that initialized this
 * @param {Client} client The client that manages it
 * @return {Promise<void>}
 */
export async function selectMenu(interaction:SelectMenuInteraction): Promise<void> {
  const { customId } = interaction;
  startLog(F, interaction);

  if (customId.startsWith('applicationReject')) {
    await applicationReject(interaction);
  }
  if (customId.startsWith('applicationRoleSelectMenu')) {
    await applicationStart(interaction);
  }
}
