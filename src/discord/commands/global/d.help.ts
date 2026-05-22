/* eslint-disable max-len */
import { stripIndents } from 'common-tags';
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Colors,
  InteractionEditReplyOptions,
  MessageFlags,
  SlashCommandBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuInteraction,
} from 'discord.js';
import tripsit from '../../../global/commands/g.about';
import { getCommandLocalizations, getLocale, t } from '../../../i18n/index';
import { SlashCommand } from '../../@types/commandDef';
import commandContext from '../../utils/context';
import { embedTemplate } from '../../utils/embedTemplate';

const F = f(__filename);

function getSelectMenuOptions(locale: string) {
  return new ActionRowBuilder<StringSelectMenuBuilder>().addComponents([
    new StringSelectMenuBuilder()
      .setCustomId('helpSelectMenu')
      .setPlaceholder(t(locale, 'help.selectMenuPlaceholder'))
      .addOptions([
        {
          label: t(locale, 'help.startLabel'),
          value: 'Start',
          description: t(locale, 'help.startDesc'),
          emoji: '🏠',
        },
        {
          label: t(locale, 'help.harmReductionLabel'),
          value: 'HarmReduction',
          description: t(locale, 'help.harmReductionDesc'),
          emoji: '🚑',
        },
        {
          label: t(locale, 'help.tripsitSessionsLabel'),
          value: 'TripSit',
          description: t(locale, 'help.tripsitSessionsDesc'),
          emoji: '🛋️',
        },
        {
          label: t(locale, 'help.tripsitExpLabel'),
          value: 'TripSitExp',
          description: t(locale, 'help.tripsitExpDesc'),
          emoji: '🎖️',
        },
        {
          label: t(locale, 'help.otherSystemsLabel'),
          value: 'Systems',
          description: t(locale, 'help.otherSystemsDesc'),
          emoji: '🔧',
        },
        {
          label: t(locale, 'help.funLabel'),
          value: 'Fun',
          description: t(locale, 'help.funDesc'),
          emoji: '🎉',
        },
        {
          label: t(locale, 'help.tripsitOnlyLabel'),
          value: 'TripSitOnly',
          description: t(locale, 'help.tripsitOnlyDesc'),
          emoji: '🛑',
        },
        {
          label: t(locale, 'help.supportLabel'),
          value: 'Support',
          description: t(locale, 'help.supportDesc'),
          emoji: '💸',
        },
        {
          label: t(locale, 'help.creditsLabel'),
          value: 'Credits',
          description: t(locale, 'help.creditsDesc'),
          emoji: '👏',
        },
        {
          label: t(locale, 'help.feedbackLabel'),
          value: 'Feedback',
          description: t(locale, 'help.feedbackDesc'),
          emoji: '📢',
        },
        {
          label: t(locale, 'help.inviteLabel'),
          value: 'Invite',
          description: t(locale, 'help.inviteDesc'),
          emoji: '💌',
        },
      ]),
  ]);
}

export async function startPage(locale: string):Promise<InteractionEditReplyOptions> {
  return {
    embeds: [
      embedTemplate()
        .setTitle(t(locale, 'help.welcomeTitle'))
        .setURL('https://tripsit.me')
        .addFields(
          {
            name: t(locale, 'help.aboutTripSit'),
            value: t(locale, 'help.aboutTripSitBody'),
          },
          {
            name: t(locale, 'help.aboutTripBot'),
            value: t(locale, 'help.aboutTripBotBody'),
          },
          {
            name: t(locale, 'help.disclaimer'),
            value: t(locale, 'help.disclaimerBody'),
          },
        ),
    ],
    components: [
      getSelectMenuOptions(locale),
    ],
  };
}

export async function hrPage(locale: string):Promise<InteractionEditReplyOptions> {
  return {
    embeds: [
      embedTemplate()
        .setTitle(t(locale, 'help.harmReductionTitle'))
        .setDescription(stripIndents`${t(locale, 'help.harmReductionIntro')}`)
        .addFields(
          { name: '\u200B', value: t(locale, 'help.informational'), inline: false },
          {
            name: t(locale, 'help.drug'),
            value: stripIndents`${t(locale, 'help.drugDesc')}`,
            inline: true,
          },
          {
            name: t(locale, 'help.combo'),
            value: t(locale, 'help.comboDesc'),
            inline: true,
          },
          {
            name: t(locale, 'help.crisis'),
            value: t(locale, 'help.crisisDesc'),
            inline: true,
          },
          {
            name: t(locale, 'help.warmline'),
            value: t(locale, 'help.warmlineDesc'),
            inline: true,
          },
          {
            name: t(locale, 'help.guides'),
            value: t(locale, 'help.guidesDesc'),
            inline: true,
          },
          {
            name: t(locale, 'help.drugChecking'),
            value: t(locale, 'help.drugCheckingDesc'),
            inline: true,
          },
          {
            name: t(locale, 'help.testKits'),
            value: t(locale, 'help.testKitsDesc'),
            inline: true,
          },
          { name: '\u200B', value: t(locale, 'help.pictureReferences'), inline: false },
          {
            name: t(locale, 'help.comboChart'),
            value: t(locale, 'help.comboChartDesc'),
            inline: true,
          },
          {
            name: t(locale, 'help.breathe'),
            value: t(locale, 'help.breatheDesc'),
            inline: true,
          },
          {
            name: t(locale, 'help.grounding'),
            value: t(locale, 'help.groundingDesc'),
            inline: true,
          },
          {
            name: t(locale, 'help.recovery'),
            value: t(locale, 'help.recoveryDesc'),
            inline: true,
          },
          {
            name: t(locale, 'help.reagents'),
            value: t(locale, 'help.reagentsDesc'),
            inline: true,
          },
          {
            name: t(locale, 'help.mushroomInfo'),
            value: t(locale, 'help.mushroomInfoDesc'),
            inline: true,
          },
          { name: '\u200B', value: t(locale, 'help.calculators'), inline: false },
          {
            name: t(locale, 'help.calcDxm'),
            value: t(locale, 'help.calcDxmDesc'),
            inline: true,
          },
          {
            name: t(locale, 'help.calcBenzo'),
            value: t(locale, 'help.calcBenzoDesc'),
            inline: true,
          },
          {
            name: t(locale, 'help.calcKetamine'),
            value: t(locale, 'help.calcKetamineDesc'),
            inline: true,
          },
          {
            name: t(locale, 'help.calcPsych'),
            value: t(locale, 'help.calcPsychDesc'),
            inline: true,
          },
          { name: '\u200B', value: t(locale, 'help.toolsUtils'), inline: false },
          {
            name: t(locale, 'help.iDose'),
            value: t(locale, 'help.iDoseDesc'),
            inline: true,
          },
          {
            name: t(locale, 'help.remindMe'),
            value: t(locale, 'help.remindMeDesc'),
            inline: true,
          },
          {
            name: t(locale, 'help.convert'),
            value: t(locale, 'help.convertDesc'),
            inline: true,
          },
        ),
    ],
    components: [
      getSelectMenuOptions(locale),
    ],
  };
}

export async function funPage(locale: string):Promise<InteractionEditReplyOptions> {
  return {
    embeds: [
      embedTemplate()
        .setTitle(t(locale, 'help.funTitle'))
        .setDescription(t(locale, 'help.funIntro'))
        .addFields(
          {
            name: t(locale, 'help.image'),
            value: t(locale, 'help.imageDesc'),
            inline: true,
          },
          {
            name: t(locale, 'help.avatar'),
            value: t(locale, 'help.avatarDesc'),
            inline: true,
          },
          {
            name: t(locale, 'help.tripToys'),
            value: t(locale, 'help.tripToysDesc'),
            inline: true,
          },
          {
            name: t(locale, 'help.kipp'),
            value: t(locale, 'help.kippDesc'),
            inline: true,
          },
          {
            name: t(locale, 'help.hydrate'),
            value: t(locale, 'help.hydrateDesc'),
            inline: true,
          },
          {
            name: t(locale, 'help.imgur'),
            value: t(locale, 'help.imgurDesc'),
            inline: true,
          },
          {
            name: t(locale, 'help.imdb'),
            value: t(locale, 'help.imdbDesc'),
            inline: true,
          },
          {
            name: t(locale, 'help.magick8'),
            value: t(locale, 'help.magick8Desc'),
            inline: true,
          },
          {
            name: t(locale, 'help.urbanDefine'),
            value: t(locale, 'help.urbanDefineDesc'),
            inline: true,
          },
          {
            name: t(locale, 'help.topic'),
            value: t(locale, 'help.topicDesc'),
            inline: true,
          },
          {
            name: t(locale, 'help.joke'),
            value: t(locale, 'help.jokeDesc'),
            inline: true,
          },
          {
            name: t(locale, 'help.coinFlip'),
            value: t(locale, 'help.coinFlipDesc'),
            inline: true,
          },
          {
            name: t(locale, 'help.loveBomb'),
            value: t(locale, 'help.loveBombDesc'),
            inline: true,
          },
          {
            name: t(locale, 'help.remindMe'),
            value: t(locale, 'help.remindMeDesc'),
            inline: true,
          },
          {
            name: t(locale, 'help.poll'),
            value: t(locale, 'help.pollDesc'),
            inline: true,
          },
          {
            name: t(locale, 'help.wikipedia'),
            value: t(locale, 'help.wikipediaDesc'),
            inline: true,
          },
        ),
    ],
    components: [
      getSelectMenuOptions(locale),
    ],
  };
}

export async function sessionsPage(locale: string):Promise<InteractionEditReplyOptions> {
  return {
    embeds: [embedTemplate()
      .setColor(Colors.Purple)
      .setTitle(t(locale, 'help.tripsitSessionsTitle'))
      .setDescription(t(locale, 'help.tripsitSessionsBody'))],
    components: [
      getSelectMenuOptions(locale),
    ],
  };
}

export async function experiencePage(locale: string):Promise<InteractionEditReplyOptions> {
  return {
    embeds: [embedTemplate()
      .setColor(Colors.Purple)
      .setTitle(t(locale, 'help.experienceTitle'))
      .setDescription(t(locale, 'help.experienceBody'))],
    components: [
      getSelectMenuOptions(locale),
    ],
  };
}

export async function systemsPage(locale: string):Promise<InteractionEditReplyOptions> {
  return {
    embeds: [embedTemplate()
      .setColor(Colors.Purple)
      .setTitle(t(locale, 'help.systemsTitle'))
      .setDescription(t(locale, 'help.systemsIntro'))
      .addFields(
        {
          name: t(locale, 'help.applications'),
          value: stripIndents`${t(locale, 'help.applicationsDesc')}`,
          inline: true,
        },
        {
          name: t(locale, 'help.techHelp'),
          value: stripIndents`${t(locale, 'help.techHelpDesc')}`,
          inline: true,
        },
        {
          name: t(locale, 'help.rules'),
          value: stripIndents`${t(locale, 'help.rulesDesc')}`,
          inline: true,
        },
      )],
    components: [
      getSelectMenuOptions(locale),
    ],
  };
}

export async function tripsitPage(locale: string):Promise<InteractionEditReplyOptions> {
  return {
    embeds: [
      embedTemplate()
        .setTitle(t(locale, 'help.tripsitSpecificTitle'))
        .setDescription(t(locale, 'help.tripsitSpecificIntro'))
        .addFields(
          {
            name: t(locale, 'help.profileSystem'),
            value: stripIndents`${t(locale, 'help.profileSystemDesc', { emojiVoteUp: env.EMOJI_VOTE_UP })}`,
            inline: false,
          },
          {
            name: t(locale, 'help.rpg'),
            value: stripIndents`${t(locale, 'help.rpgDesc')}`,
            inline: false,
          },
          {
            name: t(locale, 'help.quotes'),
            value: stripIndents`${t(locale, 'help.quotesDesc')}`,
            inline: false,
          },
          {
            name: t(locale, 'help.h2flow'),
            value: stripIndents`${t(locale, 'help.h2flowDesc')}`,
            inline: true,
          },
          {
            name: t(locale, 'help.reminder'),
            value: stripIndents`${t(locale, 'help.reminderDesc')}`,
            inline: true,
          },
          {
            name: t(locale, 'help.counting'),
            value: stripIndents`${t(locale, 'help.countingDesc')}`,
            inline: true,
          },
          {
            name: t(locale, 'help.last'),
            value: stripIndents`${t(locale, 'help.lastDesc')}`,
            inline: true,
          },
          {
            name: t(locale, 'help.sheesh'),
            value: stripIndents`${t(locale, 'help.sheeshDesc')}`,
            inline: true,
          },
        ),
    ],
    components: [
      getSelectMenuOptions(locale),
    ],
  };
}

export async function donatePage(locale: string):Promise<InteractionEditReplyOptions> {
  return {
    embeds: [embedTemplate()
      .setColor(Colors.Purple)
      .setTitle(t(locale, 'help.donationTitle'))
      .setURL('https://tripsit.me/donate/')
      .setDescription(t(locale, 'help.supportBody'))],
    components: [
      getSelectMenuOptions(locale),
      new ActionRowBuilder<ButtonBuilder>().addComponents([
        new ButtonBuilder()
          .setLabel(t(locale, 'help.donationButton'))
          .setEmoji('🎩')
          .setStyle(ButtonStyle.Link)
          .setURL(tripsit.patreon),
        new ButtonBuilder()
          .setLabel(t(locale, 'help.kofiButton'))
          .setEmoji('☕')
          .setStyle(ButtonStyle.Link)
          .setURL(tripsit.kofi),
        new ButtonBuilder()
          .setLabel(t(locale, 'help.spreadShopButton'))
          .setEmoji('👕')
          .setStyle(ButtonStyle.Link)
          .setURL(tripsit.spreadshop),
        new ButtonBuilder()
          .setLabel(t(locale, 'help.spreadShirtButton'))
          .setEmoji('👕')
          .setStyle(ButtonStyle.Link)
          .setURL(tripsit.spreadshirt),
      ]),
    ],
  };
}

export async function creditsPage(locale: string):Promise<InteractionEditReplyOptions> {
  return {
    embeds: [embedTemplate()
      .setColor(Colors.Orange)
      .setDescription(t(locale, 'help.creditsBody'))],
    components: [
      getSelectMenuOptions(locale),
    ],
  };
}

export async function feedbackPage(locale: string):Promise<InteractionEditReplyOptions> {
  return {
    embeds: [embedTemplate()
      .setColor(Colors.Green)
      .setDescription(t(locale, 'help.feedbackBody'))],
    components: [
      getSelectMenuOptions(locale),
      new ActionRowBuilder<ButtonBuilder>().addComponents([
        new ButtonBuilder()
          .setCustomId('feedbackReport')
          .setLabel(t(locale, 'help.feedbackButton'))
          .setEmoji('📢')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setLabel(t(locale, 'help.githubButton'))
          .setEmoji('🐙')
          .setStyle(ButtonStyle.Link)
          .setURL(tripsit.github),
      ]),
    ],
  };
}

export async function invitePage(locale: string):Promise<InteractionEditReplyOptions> {
  return {
    embeds: [embedTemplate()
      .setColor(Colors.Yellow)
      .setDescription(t(locale, 'help.inviteInfoBody'))],
    components: [
      getSelectMenuOptions(locale),
      new ActionRowBuilder<ButtonBuilder>().addComponents([
        new ButtonBuilder()
          .setLabel(t(locale, 'help.inviteButton'))
          .setEmoji('💌')
          .setStyle(ButtonStyle.Link)
          .setURL(tripsit.inviteUrl),
      ]),
    ],
  };
}

export async function helpMenu(
  interaction: StringSelectMenuInteraction,
) {
  log.info(F, await commandContext(interaction));
  const locale = 'en';
  const category = interaction.values[0];
  switch (category) {
    case 'Start':
      await interaction.update(await startPage(locale));
      break;
    case 'HarmReduction':
      await interaction.update(await hrPage(locale));
      break;
    case 'Systems':
      await interaction.update(await systemsPage(locale));
      break;
    case 'Fun':
      await interaction.update(await funPage(locale));
      break;
    case 'TripSit':
      await interaction.update(await sessionsPage(locale));
      break;
    case 'TripSitExp':
      await interaction.update(await experiencePage(locale));
      break;
    case 'TripSitOnly':
      await interaction.update(await tripsitPage(locale));
      break;
    case 'Support':
      await interaction.update(await donatePage(locale));
      break;
    case 'Credits':
      await interaction.update(await creditsPage(locale));
      break;
    case 'Feedback':
      await interaction.update(await feedbackPage(locale));
      break;
    case 'Invite':
      await interaction.update(await invitePage(locale));
      break;
    default:
      await interaction.update(await startPage(locale));
      break;
  }
}

export const dHelp: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription(t('en', 'help.commandDescription'))
    .setNameLocalizations(getCommandLocalizations('help.commandName'))
    .setDescriptionLocalizations(getCommandLocalizations('help.commandDescription'))
    .setIntegrationTypes([0])
    .addBooleanOption(option => option.setName('ephemeral')
      .setDescription(t('en', 'help.ephemeralOption'))
      .setDescriptionLocalizations(getCommandLocalizations('help.ephemeralOption'))) as SlashCommandBuilder,

  async execute(interaction) {
    log.info(F, await commandContext(interaction));
    const locale = await getLocale(interaction, 'help');
    // locale resolved; translations are loaded by initI18n at startup
    const ephemeral = interaction.options.getBoolean('ephemeral') ? MessageFlags.Ephemeral : undefined;
    await interaction.deferReply({ flags: ephemeral });
    await interaction.editReply(await startPage(locale));
    return true;
  },
};

export default dHelp;
