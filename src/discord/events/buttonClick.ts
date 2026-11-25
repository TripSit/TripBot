/* eslint-disable max-len */
import {
  ButtonInteraction,
  Client,
} from 'discord.js';
import commandContext from '../utils/context';
import { applicationApprove } from '../utils/application';
import {
  tripsitmeButton,
  tripsitmeOwned,
  tripsitmeMeta,
  tripsitmeBackup,
  tripsitmeTeamClose,
  tripsitmeUserClose,
} from '../utils/tripsitme';
import { techHelpClick, techHelpClose, techHelpOwn } from '../utils/techHelp';
import { verifyButton } from '../utils/verifyButton';
import { buttonReactionRole } from '../commands/global/d.reactionRole';
import { prReviewButton } from '../commands/global/d.prReview';
import {
  rpgArcade, rpgArcadeGame, rpgArcadeWager, rpgBounties, rpgHelp, rpgHome, rpgHomeAccept, rpgHomeDecline, rpgHomeSell, rpgHomeNameChange, rpgMarket, rpgMarketAccept, rpgMarketPreview, rpgTown, rpgFlairAccept, rpgFlairDecline,
} from '../commands/guild/d.rpg';
import { helperButton } from '../commands/global/d.setup';
import { acknowledgeButton, modModal, refusalButton } from '../utils/modUtils';
import { modHistoryButton } from '../utils/modHistory';
import { feedbackReportModal } from '../commands/global/d.feedback';
import { purgeButton } from '../commands/guild/d.purge';
import { mushroomPageEmbed } from '../utils/hrUtils';

const F = f(__filename);

type BountyType = 'quest' | 'dungeon' | 'raid';
type ReplyPayload = Parameters<ButtonInteraction['editReply']>[0];
type ArcadeGame = Parameters<typeof rpgArcadeGame>[1];
type ArcadeBet = Parameters<typeof rpgArcadeGame>[2];
type RpgReply = (interaction: ButtonInteraction) => Promise<ReplyPayload>;

export default buttonClick;

const arcadeGame = (game: ArcadeGame, bet?: ArcadeBet): RpgReply => interaction => (
  bet === undefined ? rpgArcadeGame(interaction, game) : rpgArcadeGame(interaction, game, bet)
);
const bounties = (type: BountyType): RpgReply => interaction => rpgBounties(interaction, type);
const home: RpgReply = interaction => rpgHome(interaction, '');

// Each rpg button, keyed by the first part of its custom id, produces the reply to show
const rpgReplies: Record<string, RpgReply> = {
  rpgTown,
  rpgBounties: interaction => rpgBounties(interaction, null),
  rpgArcade,
  rpgHelp,
  rpgWager500: rpgArcadeWager,
  rpgWager1000: rpgArcadeWager,
  rpgCoinFlip: arcadeGame('Coinflip'),
  rpgRouletteRed: arcadeGame('Roulette', 'red'),
  rpgRouletteBlack: arcadeGame('Roulette', 'black'),
  rpgRouletteFirst: arcadeGame('Roulette', 'first'),
  rpgRouletteSecond: arcadeGame('Roulette', 'second'),
  rpgRouletteThird: arcadeGame('Roulette', 'third'),
  rpgRouletteOdd: arcadeGame('Roulette', 'odds'),
  rpgRouletteEven: arcadeGame('Roulette', 'evens'),
  rpgRoulette1to12: arcadeGame('Roulette', '1-12'),
  rpgRoulette13to24: arcadeGame('Roulette', '13-24'),
  rpgRoulette25to36: arcadeGame('Roulette', '25-36'),
  rpgRouletteHigh: arcadeGame('Roulette', 'high'),
  rpgRouletteLow: arcadeGame('Roulette', 'low'),
  rpgRouletteZero: arcadeGame('Roulette', '0'),
  rpgRoulette: arcadeGame('Roulette'),
  rpgCoinflipHeads: arcadeGame('Coinflip', 'heads'),
  rpgCoinflipTails: arcadeGame('Coinflip', 'tails'),
  rpgHome: home,
  rpgHomePreview: home,
  rpgSpecies: home,
  rpgClass: home,
  rpgGuild: home,
  rpgAccept: rpgHomeAccept,
  rpgDecline: rpgHomeDecline,
  rpgSell: rpgHomeSell,
  rpgFlairAccept: interaction => rpgFlairAccept(interaction, ''),
  rpgFlairDecline,
  rpgMarketBuy: rpgMarketAccept,
  rpgMarketPreview,
  rpgMarket,
  rpgQuest: bounties('quest'),
  rpgDungeon: bounties('dungeon'),
  rpgRaid: bounties('raid'),
};

async function handleRpgButton(interaction: ButtonInteraction): Promise<void> {
  if (!interaction.customId.includes(interaction.user.id)) {
    log.debug(F, 'Button clicked by someone other than the user who clicked it');
    return;
  }
  await interaction.deferUpdate();
  const key = interaction.customId.split(',')[0];
  if (key === 'rpgName') {
    await rpgHomeNameChange(interaction);
    return;
  }
  const reply = rpgReplies[key];
  if (reply) await interaction.editReply(await reply(interaction)); // The reply to this interaction has not been sent or deferred.
}

async function handleMushroomButton(interaction: ButtonInteraction): Promise<boolean> {
  const lowerId = interaction.customId.toLowerCase();
  if (lowerId.includes('pageone')) {
    interaction.update(await mushroomPageEmbed(1));
    return true;
  }
  if (lowerId.includes('pagetwo')) {
    interaction.update(await mushroomPageEmbed(2));
    return true;
  }
  return false;
}

// Buttons are routed by the start of their custom id; the first matching prefix wins.
// Handlers that were never awaited are wrapped so they stay fire-and-forget.
const buttonRoutes: [string, (interaction: ButtonInteraction) => Promise<unknown>][] = [
  ['feedbackReport', feedbackReportModal],
  ['purge', purgeButton],
  ['modHistory', modHistoryButton],
  ['moderate', modModal],
  ['acknowledgeButton', acknowledgeButton],
  ['refusalButton', refusalButton],
  ['rpg', handleRpgButton],
  ['helperButton', helperButton],
  ['"ID":"RR"', buttonReactionRole],
  ['"ID":"PR"', prReviewButton],
  ['tripsitmeClick', tripsitmeButton],
  ['tripsitmeOwned', tripsitmeOwned],
  ['tripsitmeTeamClose', async interaction => { tripsitmeTeamClose(interaction); }],
  ['tripsitmeUserClose', async interaction => { tripsitmeUserClose(interaction); }],
  ['tripsitmeMeta', async interaction => { tripsitmeMeta(interaction); }],
  ['tripsitmeBackup', async interaction => { tripsitmeBackup(interaction); }],
  ['applicationApprove', async interaction => { applicationApprove(interaction); }],
  ['techHelpOwn', async interaction => { techHelpOwn(interaction); }],
  ['techHelpClose', async interaction => { techHelpClose(interaction); }],
  ['techHelpClick', async interaction => { techHelpClick(interaction); }],
];

export async function buttonClick(interaction:ButtonInteraction, discordClient:Client) {
  log.info(F, await commandContext(interaction));
  const buttonID = interaction.customId;

  if (buttonID.startsWith('mushroom') && await handleMushroomButton(interaction)) {
    return;
  }

  const route = buttonRoutes.find(([prefix]) => buttonID.startsWith(prefix));
  if (route) {
    await route[1](interaction);
    return;
  }

  if (buttonID === 'memberButton') {
    verifyButton(interaction);
    return;
  }

  const command = discordClient.commands.get(interaction.customId);

  if (!command) return;

  try {
    command.execute(interaction);
  } catch (error) {
    log.error(F, error as string);
    await interaction.reply({ content: 'There was an error while executing this command!' });
  }
}
