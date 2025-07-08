/* eslint-disable max-len */
/* eslint-disable sonarjs/no-duplicate-string */
import {
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
import { mushroomPageEmbed } from '../../utils/hrUtils';

// Helper function to handle the edit/delete/followup pattern
async function safeReply(
  interaction: ChatInputCommandInteraction,
  replyOptions: any,
): Promise<boolean> {
  try {
    const { flags, ...editReplyOptions } = replyOptions;
    await interaction.editReply(editReplyOptions);
    return true;
  } catch (error) {
    await interaction.deleteReply();
    await interaction.followUp({
      ...replyOptions,
      flags: MessageFlags.Ephemeral,
    });
    return false;
  }
}

// Create a mapping of subcommands to their corresponding functions
const genericContentHandlers = {
  combochart: () => combochart(),
  breathe: (interaction: ChatInputCommandInteraction) => {
    const exercise = interaction.options.getString('exercise');
    return breathe(exercise);
  },
  grounding: () => grounding(),
  recovery: () => recovery(),
  reagents: () => reagents(),
} as const;

// Generic handler function for repetitive content responses
async function handleContentResponse(
  interaction: ChatInputCommandInteraction,
  subcommand: keyof typeof genericContentHandlers,
): Promise<boolean> {
  const handler = genericContentHandlers[subcommand];
  const content = await handler(interaction);
  return safeReply(interaction, { content });
}

async function dCrisis(interaction: ChatInputCommandInteraction): Promise<boolean> {
  const emsInfo = await crisis();
  const embed = embedTemplate().setTitle('Crisis Information');
  emsInfo.forEach(entry => {
    const country = entry.country ? `(${entry.country})` : '';
    const website = entry.website ? `\n[Website](${entry.website})` : '';
    const webchat = entry.webchat ? `\n[Webchat](${entry.webchat})` : '';
    const phone = entry.phone ? `\nCall: ${entry.phone}` : '';
    const text = entry.text ? `\nText: ${entry.text}` : '';
    embed.addFields({
      name: `${entry.name} ${country}`,
      value: stripIndents`${website}${webchat}${phone}${text}` || 'No details available.',
      inline: true,
    });
  });
  return safeReply(interaction, { embeds: [embed] });
}

async function dMushroomInfo(interaction: ChatInputCommandInteraction): Promise<boolean> {
  const mushroomPage = await mushroomPageEmbed(1);
  const reply: InteractionReplyOptions = {
    embeds: [mushroomPage.embeds[0]], files: mushroomPage.files, components: mushroomPage.components,
  };
  return safeReply(interaction, reply);
}

async function dGuides(interaction: ChatInputCommandInteraction): Promise<boolean> {
  const guides = await wikiGuides();
  const message = guides
    .map(element => `[${element.split('_').join(' ')}](https://wiki.tripsit.me/wiki/${element})`)
    .join('\n');
  const embed = embedTemplate()
    .setTitle('Wiki Guides')
    .setDescription(`These are the guides currently available on our [Wiki](https://wiki.tripsit.me)\n\n${message}\nYou're welcome to contribute. :heart:`);
  return safeReply(interaction, { embeds: [embed] });
}

async function dWarmline(interaction: ChatInputCommandInteraction): Promise<boolean> {
  const emsInfo = await warmline();
  const embed = embedTemplate()
    .setTitle('Warmline Information');
  emsInfo.forEach(entry => {
    const country = entry.country ? `(${entry.country})` : '';
    const website = entry.website ? `\n[Website](${entry.website})` : '';
    const webchat = entry.webchat ? `\n[Webchat](${entry.webchat})` : '';
    const phone = entry.phone ? `\nCall: ${entry.phone}` : '';
    const text = entry.text ? `\nText: ${entry.text}` : '';
    embed.addFields({
      name: `${entry.name} ${country}`,
      value: stripIndents`${website}${webchat}${phone}${text}` || 'No details available.',
      inline: true,
    });
  });
  return safeReply(interaction, { embeds: [embed] });
}

async function dDrugChecking(interaction: ChatInputCommandInteraction): Promise<boolean> {
  const embed = embedTemplate()
    .setTitle('Drug Checking Information')
    .setColor(Colors.Blurple)
    .setDescription(stripIndents`
          Drug-checking services allow for laboratory testing of substances to allow people who use drugs to confirm what substances are present in the drugs they are purchasing and taking. In addition, they often publish results and post alerts when there are concerning samples found so are a good resource to check in with even if you do not or cannot send in your own sample.

          For a full list of resources [check out our wiki page](https://wiki.tripsit.me/wiki/Sources_for_Laboratory_Analysis).
          ## Mail-In Services
          ### North America
          [DrugsData](https://drugsdata.org/send_sample.php) (United States)
          [UNC Street Drugs Lab](https://www.streetsafe.supply/) (United States)
          [Get Your Drugs Tested](https://getyourdrugstested.com/canada-wide-drug-checking-by-mail/) (Canada)
          ### Europe
          [Energy Control](https://energycontrol-international.org/drug-testing-service/) (Spain)
          [WEDINOS](http://www.wedinos.org/sample_testing.html) (United Kingdom)
          ## Walk-In Services
          ### Canada
          [British Columbia Centre on Substance Use](https://drugcheckingbc.ca/drug-checking-sites/) (BC)
          [Toronto's Drug Checking Service](https://drugchecking.cdpe.org/about/) (Toronto)
          [Cactus Montreal](https://cactusmontreal.org/en/services-en/drug-testing/) (Montreal)
          [Spectrum Drug Checking](https://ourhealthyeg.ca/spectrum-drug-testing) (Edmonton)
          [AAWEAR](https://aawear.org/events/) (Calgary)
          ### United States
          [OnPoint NYC](https://onpointnyc.org/) (New York City)
          [Rapid Analysis of Drugs - RAD](https://health.maryland.gov/pha/NALOXONE/Pages/RAD.aspx) (Maryland)
          [Street Check](https://www.info.streetcheck.org/how-to-submit-a-sample) (Massachusetts)
          [Chicago Recovery Alliance](https://anypositivechange.org/van-timetable/) (Chicago)
          ### Europe
          [checkit!](https://checkit.wien/) (Vienna)
          [Drugchecking Berlin](https://drugchecking.berlin/checking/ablauf) (Berlin)
          [Saferparty](https://en.saferparty.ch/angebote/drug-checking) (Zurich)
          [Drugs Information and Monitoring System](https://www.drugs-test.nl/en/testlocations/) (Netherlands)
          ## Austrailia
          [CanTEST](https://www.cahma.org.au/services/cantest/) (Canberra)
        `);
  return safeReply(interaction, { embeds: [embed] });
}

async function dTestKits(interaction: ChatInputCommandInteraction): Promise<boolean> {
  const emsInfo = await testkits();
  const embed = embedTemplate()
    .setTitle('Test Kit Resources and information!');
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
  embed.setDescription(stripIndents`
        [How to use a reagent test kit](https://dancesafe.org/testing-kit-instructions/)
        [How to use fentanyl strips](https://dancesafe.org/fentanyl/)
        [More testkit resources on the TripSit wiki!](https://wiki.tripsit.me/wiki/Test_Kits)
      `);
  return safeReply(interaction, { embeds: [embed] });
}

export const dHR = {
  data: new SlashCommandBuilder()
    .setName('hr')
    .setDescription('Access harm reduction resources')
    .addSubcommand(sub => sub
      .setName('crisis')
      .setDescription('Information that may be helpful in a serious situation.')
      .addBooleanOption(option => option.setName('ephemeral')
        .setDescription('Show only to you')))
    .addSubcommand(sub => sub
      .setName('combochart')
      .setDescription('Display TripSit\'s Combo Chart')
      .addBooleanOption(option => option.setName('ephemeral')
        .setDescription('Show only to you')))
    .addSubcommand(sub => sub
      .setName('breathe')
      .setDescription('Remember to breathe')
      .addStringOption(option => option.setName('exercise')
        .setDescription('Which exercise?')
        .addChoices(
          { name: '1', value: '1' },
          { name: '2', value: '2' },
          { name: '3', value: '3' },
          { name: '4', value: '4' },
        ))
      .addBooleanOption(option => option.setName('ephemeral')
        .setDescription('Show only to you')))
    .addSubcommand(sub => sub
      .setName('guides')
      .setDescription('Show wiki guides')
      .addBooleanOption(option => option.setName('ephemeral')
        .setDescription('Show only to you')))
    .addSubcommand(sub => sub
      .setName('grounding')
      .setDescription('Show grounding exercise')
      .addBooleanOption(option => option.setName('ephemeral')
        .setDescription('Show only to you')))
    .addSubcommand(sub => sub
      .setName('drug_checking')
      .setDescription('Show drug checking resources')
      .addBooleanOption(option => option.setName('ephemeral')
        .setDescription('Show only to you')))
    .addSubcommand(sub => sub
      .setName('warmline')
      .setDescription('Need someone to talk to, but don\'t need a "hotline"?')
      .addBooleanOption(option => option.setName('ephemeral')
        .setDescription('Show only to you')))
    .addSubcommand(sub => sub
      .setName('testkits')
      .setDescription('Information on how to get a test kit')
      .addBooleanOption(option => option.setName('ephemeral')
        .setDescription('Show only to you')))
    .addSubcommand(sub => sub
      .setName('recovery')
      .setDescription('Information that may be helpful in a recovery situation.')
      .addBooleanOption(option => option.setName('ephemeral')
        .setDescription('Show only to you')))
    .addSubcommand(sub => sub
      .setName('reagents')
      .setDescription('Display reagent color chart!')
      .addBooleanOption(option => option.setName('ephemeral')
        .setDescription('Show only to you')))
    .addSubcommand(sub => sub
      .setName('mushroom_info')
      .setDescription('Displays different potencies of mushroom strains.')
      .addBooleanOption(option => option.setName('ephemeral')
        .setDescription('Show only to you'))) as SlashCommandBuilder,

  async execute(interaction: ChatInputCommandInteraction) {
    const subcommand = interaction.options.getSubcommand();
    const ephemeral = interaction.options.getBoolean('ephemeral') ? MessageFlags.Ephemeral : undefined;
    await interaction.deferReply({ flags: ephemeral });

    switch (subcommand) {
      case 'combochart':
      case 'breathe':
      case 'grounding':
      case 'recovery':
      case 'reagents':
        return handleContentResponse(interaction, subcommand);
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
        await interaction.editReply('Unknown subcommand.');
        return false;
    }
  },
};

export default dHR;
