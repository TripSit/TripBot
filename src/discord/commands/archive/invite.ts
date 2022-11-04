import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
} from 'discord.js';
import {stripIndents} from 'common-tags';
import {SlashCommand} from '../../@types/commandDef';
import env from '../../../global/utils/env.config';
import log from '../../../global/utils/log';
import {parse} from 'path';
const PREFIX = parse(__filename).name;

const bridgeMap = {
  [env.CATEGORY_GATEWAY]: null,
  [env.CHANNEL_TICKETBOOTH]: null,
  [env.CHANNEL_START]: null,
  [env.CHANNEL_ANNOUNCEMENTS]: null,
  [env.CHANNEL_BOTSPAM]: null,
  [env.CHANNEL_RULES]: null,
  // [env.CHANNEL_TECHHELP]: null,
  // [env.CATEGORY_VOLUNTEERS]: null,
  // [env.CHANNEL_HOWTOTRIPSIT]: null,
  // [env.CHANNEL_TRIPSITTERS]: '#tripsitters',
  [env.CHANNEL_RTRIPSIT]: null,
  [env.CATEGROY_HARMREDUCTIONCENTRE]: null,
  [env.CHANNEL_TRIPSIT]: null,
  // [env.CHANNEL_OPENTRIPSIT]: '#tripsit',
  [env.CHANNEL_OPENTRIPSIT1]: '#tripsit1',
  [env.CHANNEL_OPENTRIPSIT2]: '#tripsit2',
  [env.CHANNEL_CLOSEDTRIPSIT]: '#tripsit3',
  [env.CHANNEL_SANCTUARY]: '#sanctuary',
  [env.CHANNEL_HRRESOURCES]: null,
  [env.CHANNEL_DRUGQUESTIONS]: null,
  [env.CATEGORY_CAMPGROUND]: null,
  [env.CHANNEL_GENERAL]: null,
  [env.CHANNEL_PETS]: null,
  [env.CHANNEL_FOOD]: null,
  [env.CHANNEL_MUSIC]: null,
  [env.CHANNEL_MOVIES]: null,
  [env.CHANNEL_SCIENCE]: null,
  [env.CHANNEL_GAMING]: null,
  [env.CHANNEL_CREATIVE]: null,
  [env.CHANNEL_MEMES]: null,
  [env.CHANNEL_TRIVIA]: null,
  [env.CATEGORY_BACKSTAGE]: null,
  [env.CHANNEL_LOUNGE]: '#lounge',
  [env.CHANNEL_OPIATES]: '#opiates',
  [env.CHANNEL_STIMULANTS]: '#stims',
  [env.CHANNEL_DEPRESSANTS]: '#depressants',
  [env.CHANNEL_DISSOCIATIVES]: '#dissociatives',
  [env.CHANNEL_PSYCHEDELICS]: '#psychedelics',
  // [env.CATEGORY_VIPCABINS]: null,
  [env.CHANNEL_KUDOS]: null,
  [env.CHANNEL_VIPLOUNGE]: null,
  // [env.CHANNEL_ADULTSWIM]: null,
  [env.CHANNEL_GOLDLOUNGE]: null,
  [env.CHANNEL_TALKTOTS]: null,
  [env.CHANNEL_BESTOF]: null,
  [env.CHANNEL_MINECRAFT]: null,
  // [env.CHANNEL_HUB]: null,
  [env.CATEGORY_COLLABORATION]: null,
  [env.CATEGORY_TEAMTRIPSIT]: null,
  [env.CHANNEL_TRIPSITME]: '#tripsit.me',
  [env.CHANNEL_MODHAVEN]: '#modhaven',
  [env.CHANNEL_TEAMTRIPSIT]: '#tripsit',
  [env.CHANNEL_MODERATORS]: '#moderators',
  [env.CHANNEL_OPERATORS]: '#operations',
  [env.CHANNEL_MODLOG]: null,
  [env.CHANNEL_TEAMMEETING]: null,
  [env.CATEGORY_DEVELOPMENT]: null,
  // [env.CHANNEL_DEVWELCOME]: null,
  [env.CHANNEL_DEVANNCOUNCE]: null,
  [env.CHANNEL_DEVOFFTOPIC]: null,
  [env.CHANNEL_DEVELOPMENT]: '#tripsit-dev',
  // [env.CHANNEL_DEVPOLLS]: null,
  // [env.CHANNEL_TRIPCORD]: null,
  [env.CHANNEL_TRIPBOT]: null,
  [env.CHANNEL_DESIGN]: null,
  [env.CHANNEL_SANDBOX]: null,
  [env.CHANNEL_SANDBOX_DEV]: null,
  [env.CHANNEL_WIKICONTENT]: '#content',
  [env.CHANNEL_MINECRAFTADMIN]: null,
  // [env.CHANNEL_TRIPBOTLOGS]: null,
  [env.CATEGORY_ARCHIVED]: null,
  // [env.CHANNEL_TRIPBMOBILE]: null,
  [env.CHANNEL_TRIPSITREDDIT]: null,
  [env.CHANNEL_VIPWELCOME]: null,
  [env.CHANNEL_CLEARMIND]: null,
  [env.CHANNEL_PSYCHONAUT]: null,
  [env.CHANNEL_DISSONAUT]: null,
  // [env.CHANNEL_TEMPVOICE]: null,
  // [env.CATEGORY_TEMPVOICE]: null,
  [env.CHANNEL_DELERIANTS]: null,
};

export const dinvite: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('invite')
    .setDescription('Display a message to join a bridged channel on both sides')
    .addChannelOption((option) => option
      .setRequired(true)
      .setDescription('Which channel do you want people to join?')
      .setName('channel')),

  async execute(interaction:ChatInputCommandInteraction) {
    log.debug(`[${PREFIX}] starting!`);

    const discordChannel = interaction.options.getChannel('channel')!;

    const ircChannel = bridgeMap[discordChannel.id];

    if (ircChannel !== null && ircChannel !== undefined) {
      interaction.reply(stripIndents`
        ${interaction.member?.toString()} invites you to '/join ${ircChannel}' on IRC 😄
        This channel is 🔗'd to ${discordChannel} on Discord through the /bridge!
      `);
    } else {
      interaction.reply({
        content: `Sorry but ${discordChannel} isn't bridged to IRC, but maybe one day!`,
        ephemeral: true});
    }

    return true;
  },
};
