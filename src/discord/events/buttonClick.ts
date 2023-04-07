/* eslint-disable max-len */
import {
  ButtonInteraction,
  Client,
} from 'discord.js';
import { commandContext } from '../utils/context';
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
} from '../commands/archive/modmail';
import { verifyButton } from '../utils/verifyButton';
import { buttonReactionRole } from '../commands/global/d.reactionRole';
import {
  rpgArcade, rpgArcadeGame, rpgArcadeWager, rpgBounties, rpgHelp, rpgHome, rpgHomeAccept, rpgHomeNameChange, rpgMarket, rpgMarketAccept, rpgMarketPreview, rpgTown, rpgTrivia,
} from '../commands/guild/d.rpg';

const F = f(__filename);

export default buttonClick;

export async function buttonClick(interaction:ButtonInteraction, client:Client) {
  log.info(F, await commandContext(interaction));
  log.debug(F, 'Interaction deferred!');
  const buttonID = interaction.customId;

  if (buttonID.startsWith('rpg')) {
    if (!buttonID.includes(interaction.user.id)) {
      log.debug(F, 'Button clicked by someone other than the user who clicked it');
      return;
    }
    await interaction.deferUpdate();
    if (interaction.customId.split(',')[0] === 'rpgTown') await interaction.editReply(await rpgTown(interaction)); // The reply to this interaction has not been sent or deferred.
    else if (interaction.customId.split(',')[0] === 'rpgBounties') await interaction.editReply(await rpgBounties(interaction, null));
    else if (interaction.customId.split(',')[0] === 'rpgArcade') await interaction.editReply(await rpgArcade(interaction));
    else if (interaction.customId.split(',')[0] === 'rpgHelp') await interaction.editReply(await rpgHelp(interaction));
    else if (interaction.customId.split(',')[0] === 'rpgWager1') await interaction.editReply(await rpgArcadeWager(interaction));
    else if (interaction.customId.split(',')[0] === 'rpgWager10') await interaction.editReply(await rpgArcadeWager(interaction));
    else if (interaction.customId.split(',')[0] === 'rpgWager100') await interaction.editReply(await rpgArcadeWager(interaction));
    else if (interaction.customId.split(',')[0] === 'rpgWager1000') await interaction.editReply(await rpgArcadeWager(interaction));
    else if (interaction.customId.split(',')[0] === 'rpgWager10000') await interaction.editReply(await rpgArcadeWager(interaction));
    else if (interaction.customId.split(',')[0] === 'rpgCoinFlip') await interaction.editReply(await rpgArcadeGame(interaction, 'Coinflip'));
    else if (interaction.customId.split(',')[0] === 'rpgTrivia') await interaction.editReply(await rpgTrivia(interaction));
    else if (interaction.customId.split(',')[0] === 'rpgDifficulty') await interaction.editReply(await rpgTrivia(interaction));
    else if (interaction.customId.split(',')[0] === 'rpgQuestionLimit') await interaction.editReply(await rpgTrivia(interaction));
    else if (interaction.customId.split(',')[0] === 'rpgStart') await interaction.editReply(await rpgTrivia(interaction));
    else if (interaction.customId.split(',')[0] === 'rpgRouletteRed') await interaction.editReply(await rpgArcadeGame(interaction, 'Roulette', 'red'));
    else if (interaction.customId.split(',')[0] === 'rpgRouletteBlack') await interaction.editReply(await rpgArcadeGame(interaction, 'Roulette', 'black'));
    else if (interaction.customId.split(',')[0] === 'rpgRouletteFirst') await interaction.editReply(await rpgArcadeGame(interaction, 'Roulette', 'first'));
    else if (interaction.customId.split(',')[0] === 'rpgRouletteSecond') await interaction.editReply(await rpgArcadeGame(interaction, 'Roulette', 'second'));
    else if (interaction.customId.split(',')[0] === 'rpgRouletteThird') await interaction.editReply(await rpgArcadeGame(interaction, 'Roulette', 'third'));
    else if (interaction.customId.split(',')[0] === 'rpgRouletteOdd') await interaction.editReply(await rpgArcadeGame(interaction, 'Roulette', 'odds'));
    else if (interaction.customId.split(',')[0] === 'rpgRouletteEven') await interaction.editReply(await rpgArcadeGame(interaction, 'Roulette', 'evens'));
    else if (interaction.customId.split(',')[0] === 'rpgRoulette1to12') await interaction.editReply(await rpgArcadeGame(interaction, 'Roulette', '1-12'));
    else if (interaction.customId.split(',')[0] === 'rpgRoulette13to24') await interaction.editReply(await rpgArcadeGame(interaction, 'Roulette', '13-24'));
    else if (interaction.customId.split(',')[0] === 'rpgRoulette25to36') await interaction.editReply(await rpgArcadeGame(interaction, 'Roulette', '25-36'));
    else if (interaction.customId.split(',')[0] === 'rpgRouletteHigh') await interaction.editReply(await rpgArcadeGame(interaction, 'Roulette', 'high'));
    else if (interaction.customId.split(',')[0] === 'rpgRouletteLow') await interaction.editReply(await rpgArcadeGame(interaction, 'Roulette', 'low'));
    else if (interaction.customId.split(',')[0] === 'rpgRouletteZero') await interaction.editReply(await rpgArcadeGame(interaction, 'Roulette', '0'));
    else if (interaction.customId.split(',')[0] === 'rpgRoulette') await interaction.editReply(await rpgArcadeGame(interaction, 'Roulette'));
    else if (interaction.customId.split(',')[0] === 'rpgCoinflipHeads') await interaction.editReply(await rpgArcadeGame(interaction, 'Coinflip', 'heads'));
    else if (interaction.customId.split(',')[0] === 'rpgCoinflipTails') await interaction.editReply(await rpgArcadeGame(interaction, 'Coinflip', 'tails'));
    else if (interaction.customId.split(',')[0] === 'rpgHome') await interaction.editReply(await rpgHome(interaction, ''));
    else if (interaction.customId.split(',')[0] === 'rpgHomePreview') await interaction.editReply(await rpgHome(interaction, ''));
    else if (interaction.customId.split(',')[0] === 'rpgSpecies') await interaction.editReply(await rpgHome(interaction, ''));
    else if (interaction.customId.split(',')[0] === 'rpgClass') await interaction.editReply(await rpgHome(interaction, ''));
    else if (interaction.customId.split(',')[0] === 'rpgGuild') await interaction.editReply(await rpgHome(interaction, ''));
    else if (interaction.customId.split(',')[0] === 'rpgName') await rpgHomeNameChange(interaction);
    else if (interaction.customId.split(',')[0] === 'rpgAccept') await interaction.editReply(await rpgHomeAccept(interaction));
    else if (interaction.customId.split(',')[0] === 'rpgMarketBuy') await interaction.editReply(await rpgMarketAccept(interaction));
    else if (interaction.customId.split(',')[0] === 'rpgMarketPreview') await interaction.editReply(await rpgMarketPreview(interaction));
    else if (interaction.customId.split(',')[0] === 'rpgMarket') await interaction.editReply(await rpgMarket(interaction));
    else if (interaction.customId.split(',')[0] === 'rpgQuest') await interaction.editReply(await rpgBounties(interaction, interaction.customId.split(',')[0].replace('rpg', '').toLowerCase() as 'quest' | 'dungeon' | 'raid'));
    else if (interaction.customId.split(',')[0] === 'rpgDungeon') await interaction.editReply(await rpgBounties(interaction, interaction.customId.split(',')[0].replace('rpg', '').toLowerCase() as 'quest' | 'dungeon' | 'raid'));
    else if (interaction.customId.split(',')[0] === 'rpgRaid') await interaction.editReply(await rpgBounties(interaction, interaction.customId.split(',')[0].replace('rpg', '').toLowerCase() as 'quest' | 'dungeon' | 'raid'));
    return;
  }

  if (buttonID.startsWith('"ID":"RR"')) {
    await buttonReactionRole(interaction);
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
  if (buttonID === 'memberButton') {
    verifyButton(interaction);
    return;
  }

  const command = client.commands.get(interaction.customId);

  if (!command) return;

  try {
    // log.debug(F, `Executing command: ${command.name}`);
    command.execute(interaction);
  } catch (error) {
    log.error(F, error as string);
    await interaction.reply({ content: 'There was an error while executing this command!' });
  }
}
