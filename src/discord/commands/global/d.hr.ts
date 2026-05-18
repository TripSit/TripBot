/* eslint-disable max-len */
/* eslint-disable sonarjs/no-duplicate-string */
import {
  ActionRowBuilder,
  AttachmentBuilder,
  ButtonBuilder,
  ButtonStyle,
  SlashCommandBuilder,
  MessageFlags,
  ChatInputCommandInteraction,
  Colors,
  InteractionReplyOptions,
} from 'discord.js';
import { stripIndents } from 'common-tags';
import { embedTemplate } from '../../utils/embedTemplate';
import { crisis } from '../../../global/commands/g.crisis';
import { combochart } from '../../../global/commands/g.combochart';
import { breathe } from '../../../global/commands/g.breathe';
import { wikiGuides } from '../../../global/commands/g.guides';
import { grounding } from '../../../global/commands/g.grounding';
import testkits from '../../../global/commands/g.testkits';
import { warmline } from '../../../global/commands/g.warmline';
import { recovery } from '../../../global/commands/g.recovery';
import { reagents } from '../../../global/commands/g.reagents';
import getAsset from '../../utils/getAsset';
import { t, getLocale, getCommandLocalizations } from '../../../i18n/index';

async function dCombochart(interaction: ChatInputCommandInteraction): Promise<boolean> {
  const content = await combochart();
  try {
    await interaction.editReply({ content });
    return true;
  } catch (error) {
    await interaction.deleteReply();
    await interaction.followUp({ content, flags: MessageFlags.Ephemeral });
    return false;
  }
}

async function dBreathe(interaction: ChatInputCommandInteraction): Promise<boolean> {
  const exercise = interaction.options.getString('exercise');
  const content = await breathe(exercise);
  try {
    await interaction.editReply({ content });
    return true;
  } catch (error) {
    await interaction.deleteReply();
    await interaction.followUp({ content, flags: MessageFlags.Ephemeral });
    return false;
  }
}

async function dGrounding(interaction: ChatInputCommandInteraction): Promise<boolean> {
  const content = await grounding();
  try {
    await interaction.editReply({ content });
    return true;
  } catch (error) {
    await interaction.deleteReply();
    await interaction.followUp({ content, flags: MessageFlags.Ephemeral });
    return false;
  }
}

async function dRecovery(interaction: ChatInputCommandInteraction): Promise<boolean> {
  const content = await recovery();
  try {
    await interaction.editReply({ content });
    return true;
  } catch (error) {
    await interaction.deleteReply();
    await interaction.followUp({ content, flags: MessageFlags.Ephemeral });
    return false;
  }
}

async function dReagents(interaction: ChatInputCommandInteraction): Promise<boolean> {
  const content = await reagents();
  try {
    await interaction.editReply({ content });
    return true;
  } catch (error) {
    await interaction.deleteReply();
    await interaction.followUp({ content, flags: MessageFlags.Ephemeral });
    return false;
  }
}

async function dCrisis(interaction: ChatInputCommandInteraction): Promise<boolean> {
  const locale = await getLocale(interaction, 'hr');
  const emsInfo = await crisis();
  const embed = embedTemplate().setTitle(t(locale, 'hr', 'crisisTitle'));
  emsInfo.forEach(entry => {
    const country = entry.country ? `(${entry.country})` : '';
    const website = entry.website ? `\n[Website](${entry.website})` : '';
    const webchat = entry.webchat ? `\n[Webchat](${entry.webchat})` : '';
    const phone = entry.phone ? `\nCall: ${entry.phone}` : '';
    const text = entry.text ? `\nText: ${entry.text}` : '';
    embed.addFields({
      name: `${entry.name} ${country}`,
      value: stripIndents`${website}${webchat}${phone}${text}` || t(locale, 'hr', 'noDetailsAvailable'),
      inline: true,
    });
  });
  try {
    await interaction.editReply({ embeds: [embed] });
    return true;
  } catch (error) {
    await interaction.deleteReply();
    await interaction.followUp({ embeds: [embed], flags: MessageFlags.Ephemeral });
    return false;
  }
}

async function dGuides(interaction: ChatInputCommandInteraction): Promise<boolean> {
  const locale = await getLocale(interaction, 'hr');
  const guides = await wikiGuides();
  const message = guides
    .map(element => `[${element.split('_').join(' ')}](https://wiki.tripsit.me/wiki/${element})`)
    .join('\n');
  const embed = embedTemplate()
    .setTitle(t(locale, 'hr', 'wikiGuidesTitle'))
    .setDescription(t(locale, 'hr', 'wikiGuidesDescription', { message }));
  try {
    await interaction.editReply({ embeds: [embed] });
    return true;
  } catch (error) {
    await interaction.deleteReply();
    await interaction.followUp({ embeds: [embed], flags: MessageFlags.Ephemeral });
    return false;
  }
}

async function dWarmline(interaction: ChatInputCommandInteraction): Promise<boolean> {
  const locale = await getLocale(interaction, 'hr');
  const emsInfo = await warmline();
  const embed = embedTemplate()
    .setTitle(t(locale, 'hr', 'warmlineTitle'));
  emsInfo.forEach(entry => {
    const country = entry.country ? `(${entry.country})` : '';
    const website = entry.website ? `\n[Website](${entry.website})` : '';
    const webchat = entry.webchat ? `\n[Webchat](${entry.webchat})` : '';
    const phone = entry.phone ? `\nCall: ${entry.phone}` : '';
    const text = entry.text ? `\nText: ${entry.text}` : '';
    embed.addFields({
      name: `${entry.name} ${country}`,
      value: stripIndents`${website}${webchat}${phone}${text}` || t(locale, 'hr', 'noDetailsAvailable'),
      inline: true,
    });
  });
  try {
    await interaction.editReply({ embeds: [embed] });
    return true;
  } catch (error) {
    await interaction.deleteReply();
    await interaction.followUp({ embeds: [embed], flags: MessageFlags.Ephemeral });
    return false;
  }
}

async function dDrugChecking(interaction: ChatInputCommandInteraction): Promise<boolean> {
  const locale = await getLocale(interaction, 'hr');
  const embed = embedTemplate()
    .setTitle(t(locale, 'hr', 'drugCheckingTitle'))
    .setColor(Colors.Blurple)
    .setDescription(t(locale, 'hr', 'drugCheckingDescription'));
  try {
    await interaction.editReply({ embeds: [embed] });
    return true;
  } catch (error) {
    await interaction.deleteReply();
    await interaction.followUp({ embeds: [embed], flags: MessageFlags.Ephemeral });
    return false;
  }
}

async function dTestKits(interaction: ChatInputCommandInteraction): Promise<boolean> {
  const locale = await getLocale(interaction, 'hr');
  const emsInfo = await testkits();
  const embed = embedTemplate()
    .setTitle(t(locale, 'hr', 'testKitResourcesTitle'));
  const fieldsPerRow = 3;
  const totalFields = emsInfo.length;
  const rows = Math.ceil(totalFields / fieldsPerRow);
  for (let rowIndex = 0; rowIndex < rows; rowIndex += 1) {
    const startIndex = rowIndex * fieldsPerRow;
    const endIndex = Math.min(startIndex + fieldsPerRow, totalFields);
    const rowFields = emsInfo.slice(startIndex, endIndex);
    rowFields.forEach((entry, index) => {
      const website = entry.website ? `\n[Website](${entry.website})` : '';
      const description = entry.description ? `\n${entry.description}` : '';
      embed.addFields({
        name: `${startIndex + index + 1}. ${entry.name} (${entry.country})`,
        value: stripIndents`${website}${description}`,
        inline: true,
      });
    });
    if (rowFields.length < fieldsPerRow) {
      const remainingSpaces = fieldsPerRow - rowFields.length;
      for (let i = 0; i < remainingSpaces; i += 1) {
        embed.addFields({
          name: '\u200b',
          value: '\u200b',
          inline: true,
        });
      }
    }
  }
  embed.setDescription(t(locale, 'hr', 'testKitDescription'));
  try {
    await interaction.editReply({ embeds: [embed] });
    return true;
  } catch (error) {
    await interaction.deleteReply();
    await interaction.followUp({ embeds: [embed], flags: MessageFlags.Ephemeral });
    return false;
  }
}

async function dMushroomInfo(interaction: ChatInputCommandInteraction): Promise<boolean> {
  const locale = await getLocale(interaction, 'hr');
  const source = 'https://www.oaklandhyphae510.com/post/preliminary-tryptamine-potency-analysis-from-dried-homogenized-fruit-bodies-of-psilocybe-mushrooms';
  const article = 'https://tripsitter.com/magic-mushrooms/average-potency/';

  const embed = embedTemplate()
    .setTitle(t(locale, 'hr', 'mushroomPotencyTitle'))
    .setColor(Colors.Green)
    .setDescription(t(locale, 'hr', 'mushroomPotencyDescription', {
      disclaimer: t(locale, 'hr', 'mushroomPotencyDisclaimer'),
      source,
      article,
    }))
    .setImage('attachment://mushroomInfoA.png');

  const files = [new AttachmentBuilder(await getAsset('mushroomInfoA'))];
  const components = [new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('mushroomPageTwo')
      .setLabel(t(locale, 'hr', 'mushroomShowVisual'))
      .setStyle(ButtonStyle.Primary),
  )];

  const reply: InteractionReplyOptions = {
    embeds: [embed],
    files,
    components,
  };

  try {
    const { flags, ...editReplyOptions } = reply;
    await interaction.editReply(editReplyOptions);
    return true;
  } catch (error) {
    await interaction.deleteReply();
    reply.flags = MessageFlags.Ephemeral;
    await interaction.followUp(reply);
    return false;
  }
}

export const dHR = {
  data: new SlashCommandBuilder()
    .setName('hr')
    .setDescription('Access harm reduction resources')
    .setNameLocalizations(getCommandLocalizations('hr', 'commandName'))
    .setDescriptionLocalizations(getCommandLocalizations('hr', 'commandDescription'))
    .addSubcommand(sub => sub
      .setName('crisis')
      .setDescription('Information that may be helpful in a serious situation.')
      .setNameLocalizations(getCommandLocalizations('hr', 'crisisName'))
      .setDescriptionLocalizations(getCommandLocalizations('hr', 'crisisDescription'))
      .addBooleanOption(option => option.setName('ephemeral')
        .setDescription('Set to "True" to show the response only to you')
        .setDescriptionLocalizations(getCommandLocalizations('hr', 'ephemeralOption'))))
    .addSubcommand(sub => sub
      .setName('combochart')
      .setDescription('Display TripSit\'s Combo Chart')
      .setNameLocalizations(getCommandLocalizations('hr', 'combochartName'))
      .setDescriptionLocalizations(getCommandLocalizations('hr', 'combochartDescription'))
      .addBooleanOption(option => option.setName('ephemeral')
        .setDescription('Set to "True" to show the response only to you')
        .setDescriptionLocalizations(getCommandLocalizations('hr', 'ephemeralOption'))))
    .addSubcommand(sub => sub
      .setName('breathe')
      .setDescription('Remember to breathe')
      .setNameLocalizations(getCommandLocalizations('hr', 'breatheName'))
      .setDescriptionLocalizations(getCommandLocalizations('hr', 'breatheDescription'))
      .addStringOption(option => option.setName('exercise')
        .setDescription('Which exercise?')
        .setDescriptionLocalizations(getCommandLocalizations('hr', 'exerciseOption'))
        .addChoices(
          { name: '1', value: '1' },
          { name: '2', value: '2' },
          { name: '3', value: '3' },
          { name: '4', value: '4' },
        ))
      .addBooleanOption(option => option.setName('ephemeral')
        .setDescription('Set to "True" to show the response only to you')
        .setDescriptionLocalizations(getCommandLocalizations('hr', 'ephemeralOption'))))
    .addSubcommand(sub => sub
      .setName('guides')
      .setDescription('Show wiki guides')
      .setNameLocalizations(getCommandLocalizations('hr', 'guidesName'))
      .setDescriptionLocalizations(getCommandLocalizations('hr', 'guidesDescription'))
      .addBooleanOption(option => option.setName('ephemeral')
        .setDescription('Set to "True" to show the response only to you')
        .setDescriptionLocalizations(getCommandLocalizations('hr', 'ephemeralOption'))))
    .addSubcommand(sub => sub
      .setName('grounding')
      .setDescription('Show grounding exercise')
      .setNameLocalizations(getCommandLocalizations('hr', 'groundingName'))
      .setDescriptionLocalizations(getCommandLocalizations('hr', 'groundingDescription'))
      .addBooleanOption(option => option.setName('ephemeral')
        .setDescription('Set to "True" to show the response only to you')
        .setDescriptionLocalizations(getCommandLocalizations('hr', 'ephemeralOption'))))
    .addSubcommand(sub => sub
      .setName('drug_checking')
      .setDescription('Show drug checking resources')
      .setNameLocalizations(getCommandLocalizations('hr', 'drugCheckingName'))
      .setDescriptionLocalizations(getCommandLocalizations('hr', 'drugCheckingDescription'))
      .addBooleanOption(option => option.setName('ephemeral')
        .setDescription('Set to "True" to show the response only to you')
        .setDescriptionLocalizations(getCommandLocalizations('hr', 'ephemeralOption'))))
    .addSubcommand(sub => sub
      .setName('warmline')
      .setDescription('Need someone to talk to, but don\'t need a "hotline"?')
      .setNameLocalizations(getCommandLocalizations('hr', 'warmlineName'))
      .setDescriptionLocalizations(getCommandLocalizations('hr', 'warmlineDescription'))
      .addBooleanOption(option => option.setName('ephemeral')
        .setDescription('Set to "True" to show the response only to you')
        .setDescriptionLocalizations(getCommandLocalizations('hr', 'ephemeralOption'))))
    .addSubcommand(sub => sub
      .setName('testkits')
      .setDescription('Information on how to get a test kit')
      .setNameLocalizations(getCommandLocalizations('hr', 'testkitsName'))
      .setDescriptionLocalizations(getCommandLocalizations('hr', 'testkitsDescription'))
      .addBooleanOption(option => option.setName('ephemeral')
        .setDescription('Set to "True" to show the response only to you')
        .setDescriptionLocalizations(getCommandLocalizations('hr', 'ephemeralOption'))))
    .addSubcommand(sub => sub
      .setName('recovery')
      .setDescription('Information that may be helpful in a recovery situation.')
      .setNameLocalizations(getCommandLocalizations('hr', 'recoveryName'))
      .setDescriptionLocalizations(getCommandLocalizations('hr', 'recoveryDescription'))
      .addBooleanOption(option => option.setName('ephemeral')
        .setDescription('Set to "True" to show the response only to you')
        .setDescriptionLocalizations(getCommandLocalizations('hr', 'ephemeralOption'))))
    .addSubcommand(sub => sub
      .setName('reagents')
      .setDescription('Display reagent color chart!')
      .setNameLocalizations(getCommandLocalizations('hr', 'reagentsName'))
      .setDescriptionLocalizations(getCommandLocalizations('hr', 'reagentsDescription'))
      .addBooleanOption(option => option.setName('ephemeral')
        .setDescription('Set to "True" to show the response only to you')
        .setDescriptionLocalizations(getCommandLocalizations('hr', 'ephemeralOption'))))
    .addSubcommand(sub => sub
      .setName('mushroom_info')
      .setDescription('Displays different potencies of mushroom strains.')
      .setNameLocalizations(getCommandLocalizations('hr', 'mushroomInfoName'))
      .setDescriptionLocalizations(getCommandLocalizations('hr', 'mushroomInfoDescription'))
      .addBooleanOption(option => option.setName('ephemeral')
        .setDescription('Set to "True" to show the response only to you')
        .setDescriptionLocalizations(getCommandLocalizations('hr', 'ephemeralOption')))) as SlashCommandBuilder,

  async execute(interaction: ChatInputCommandInteraction) {
    const locale = await getLocale(interaction, 'hr');
    const subcommand = interaction.options.getSubcommand();
    const ephemeral = interaction.options.getBoolean('ephemeral') ? MessageFlags.Ephemeral : undefined;
    await interaction.deferReply({ flags: ephemeral });

    switch (subcommand) {
      case 'combochart':
        return dCombochart(interaction);
      case 'breathe':
        return dBreathe(interaction);
      case 'grounding':
        return dGrounding(interaction);
      case 'recovery':
        return dRecovery(interaction);
      case 'reagents':
        return dReagents(interaction);
      case 'crisis':
        return dCrisis(interaction);
      case 'guides':
        return dGuides(interaction);
      case 'drug_checking':
        return dDrugChecking(interaction);
      case 'warmline':
        return dWarmline(interaction);
      case 'testkits':
        return dTestKits(interaction);
      case 'mushroom_info':
        return dMushroomInfo(interaction);
      default:
        await interaction.editReply(t(locale, 'hr', 'unknownSubcommand'));
        return false;
    }
  },
};

export default dHR;
