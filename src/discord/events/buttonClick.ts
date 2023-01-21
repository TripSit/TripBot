import {
  ButtonInteraction,
  Client,
} from 'discord.js';
import { startLog } from '../utils/startLog';
import { applicationApprove } from '../utils/application';
import {
  tripsitmeButton,
  tripsitmeOwned,
  tripsitmeMeta,
  tripsitmeBackup,
  tripsitmeClose,
  tripsitmeResolve,
} from '../utils/tripsitme';
import { techHelpClick, techHelpClose, techHelpOwn } from '../utils/techHelp';
import {
  modmailCreate, modmailActions,
} from '../commands/guild/modmail';
import { verifyButton } from '../utils/verifyButton';
import { acceptWarning, refuseWarning } from '../utils/warnButtons';
import { processReactionRole } from '../commands/guild/d.reactionRole';

const F = f(__filename);

export default buttonClick;

/**
 * This runs whenever a buttion is clicked
 * @param {ButtonInteraction} interaction The interaction that initialized this
 * @param {Client} client The client that manages it
 * @return {Promise<void>}
 */
export async function buttonClick(interaction:ButtonInteraction, client:Client) {
  startLog(F, interaction);
  const buttonID = interaction.customId;

  if (buttonID.startsWith('"ID":"RR"')) {
    await processReactionRole(interaction);
    return;
  }

  if (buttonID.startsWith('tripsitmeClick')) {
    await tripsitmeButton(interaction);
    return;
  }

  if (buttonID.startsWith('tripsitmeOwned')) {
    await tripsitmeOwned(interaction);
    return;
  }

  if (buttonID.startsWith('tripsitmeClose')) {
    tripsitmeClose(interaction);
    return;
  }

  if (buttonID.startsWith('tripsitmeResolve')) {
    tripsitmeResolve(interaction);
    return;
  }

  if (buttonID.startsWith('tripsitmeMeta')) {
    tripsitmeMeta(interaction);
    return;
  }

  if (buttonID.startsWith('tripsitmeBackup')) {
    tripsitmeBackup(interaction);
    return;
  }

  if (buttonID.startsWith('modmailIssue')) {
    await modmailActions(interaction);
    return;
  }

  if (buttonID.startsWith('applicationApprove')) {
    applicationApprove(interaction);
    return;
  }
  if (buttonID.startsWith('techHelpOwn')) {
    techHelpOwn(interaction);
    return;
  }
  if (buttonID.startsWith('techHelpClose')) {
    techHelpClose(interaction);
    return;
  }
  if (buttonID.startsWith('techHelpClick')) {
    techHelpClick(interaction);
    return;
  }
  if (buttonID === 'modmailTripsitter') {
    modmailCreate(interaction, 'TRIPSIT');
    return;
  }
  if (buttonID === 'modmailFeedback') {
    modmailCreate(interaction, 'FEEDBACK');
    return;
  }
  if (buttonID === 'modmailTechIssue') {
    modmailCreate(interaction, 'TECH');
    return;
  }
  if (buttonID === 'modmailBanAppeal') {
    modmailCreate(interaction, 'APPEAL');
    return;
  }
  if (buttonID === 'memberbutton') {
    verifyButton(interaction);
    return;
  }
  if (buttonID === 'acknowledgebtn') {
    acceptWarning(interaction);
    return;
  }
  if (buttonID === 'refusalbtn') {
    refuseWarning(interaction);
    return;
  }

  const command = client.commands.get(interaction.customId);

  if (!command) return;

  try {
    // log.debug(F, `Executing command: ${command.name}`);
    command.execute(interaction);
  } catch (error) {
    log.error(F, error as string);
    interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
  }
}
