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
  const guides = await wikiGuides();
  const message = guides
    .map(element => `[${element.split('_').join(' ')}](https://wiki.tripsit.me/wiki/${element})`)
    .join('\n');
  const embed = embedTemplate()
    .setTitle('Wiki Guides')
    .setDescription(`These are the guides currently available on our [Wiki](https://wiki.tripsit.me)\n\n${message}\nYou're welcome to contribute. :heart:`);
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
  const source = 'https://www.oaklandhyphae510.com/post/preliminary-tryptamine-potency-analysis-from-dried-homogenized-fruit-bodies-of-psilocybe-mushrooms';
  const disclaimer = 'The following data is based on preliminary research and development methods, does not represent final data and requires further peer review before being taken more seriously than \'interesting\'. However, this does represent meaningful, comparable data to the cultivators, to the consumers, and to the public.';
  const article = 'https://tripsitter.com/magic-mushrooms/average-potency/';

  const embed = embedTemplate()
    .setTitle('Mushroom Potency Info')
    .setColor(Colors.Green)
    .setDescription(`${disclaimer}\n\nFor more information check out [the source](${source}) and [this article](${article}).`)
    .setImage('attachment://mushroomInfoA.png');

  const files = [new AttachmentBuilder(await getAsset('mushroomInfoA'))];
  const components = [new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('mushroomPageTwo')
      .setLabel('Show Visual')
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
        await interaction.editReply('Unknown subcommand.');
        return false;
    }
  },
};

export default dHR;
