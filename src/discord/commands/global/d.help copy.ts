/* eslint-disable max-len */
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  InteractionEditReplyOptions,
  SlashCommandBuilder,
} from 'discord.js';
import { stripIndents } from 'common-tags';
import { SlashCommand } from '../../@types/commandDef';
import { embedTemplate } from '../../utils/embedTemplate';
import commandContext from '../../utils/context';
import { botStats } from '../../../global/commands/g.botstats';

const F = f(__filename);

const startButton = new ButtonBuilder()
  .setCustomId('helpButton~Start')
  .setLabel('Home')
  .setStyle(ButtonStyle.Danger);

const hrButton = new ButtonBuilder()
  .setCustomId('helpButton~HarmReduction')
  .setLabel('Harm Reduction Modules')
  .setStyle(ButtonStyle.Danger);

const funButton = new ButtonBuilder()
  .setCustomId('helpButton~Fun')
  .setLabel('Other Modules')
  .setStyle(ButtonStyle.Success);

const tripsitButton = new ButtonBuilder()
  .setCustomId('helpButton~TripSit')
  .setLabel('Tripsit-Only Modules')
  .setStyle(ButtonStyle.Primary);

async function startEmbedBuilder():Promise<InteractionEditReplyOptions> {
  const statData = await botStats();
  return {
    embeds: [
      embedTemplate()
        .setTitle('Welcome to TripSit\'s TripBot')
        .setDescription(stripIndents`
        TripBot is an omni-bot that does a bit of everything, and is one of the only bots on the TripSit discord guild. 
        
        It currently has ${statData.commandCount} commands, and of those, it has a couple main features:

        * You can set up a channel to host a TripSit sessions, like a support ticket system but for TripSitting.
        * It has an AI chatbot that you can talk to, and it will respond to you, using OpenAI GPT-3.5.
        * It has a bunch of other features, like a calculator, a harm reduction database, and a bunch of other stuff.
        
        Features are grouped into categories, and you can use the buttons below to navigate between them.

        Some important things to remember:
        * Use /feedback to send feedback directly to the bot owner, <@!${process.env.OWNER_ID}>.
        * Use /about to see attribution info
        * Use /donate to see different ways to support TripSit/TripBot.
        `)
        .setFooter({ text: 'TripBot is not a medical professional. If you are experiencing a medical emergency, please call 911 or your local emergency number.' }),
    ],
    components: [new ActionRowBuilder<ButtonBuilder>().addComponents([
      hrButton,
      funButton,
      tripsitButton,
    ])],
  };
}

async function hrEmbedBuilder():Promise<InteractionEditReplyOptions> {
  // embed.addFields({ name: 'Drug', value: getDesc('drug') ?? '', inline: true });
  // embed.addFields({ name: 'Combo', value: getDesc('drug') ?? '', inline: true });
  // embed.addFields({ name: 'iDose', value: getDesc('idose') ?? '', inline: true });
  // embed.addFields({ name: 'ComboChart', value: getDesc('drug') ?? '', inline: true });
  // embed.addFields({ name: 'Reagents', value: getDesc('drug') ?? '', inline: true });
  // embed.addFields({ name: 'Calc Psychedelics', value: getDesc('calc_psychedelics') ?? '', inline: true });
  // embed.addFields({ name: 'Calc DXM', value: getDesc('calc_dxm') ?? '', inline: true });
  // embed.addFields({ name: 'Calc Benzos', value: getDesc('calc_benzo') ?? '', inline: true });
  // embed.addFields({ name: 'Calc Ketamine', value: getDesc('calc_ketamine') ?? '', inline: true });
  // embed.addFields({ name: 'Recovery', value: getDesc('recovery') ?? '', inline: true });
  // embed.addFields({ name: 'Breathe', value: getDesc('breathe') ?? '', inline: true });
  // embed.addFields({ name: 'Warmline', value: getDesc('warmline') ?? '', inline: true });
  // embed.addFields({ name: 'KIPP', value: getDesc('kipp') ?? '', inline: true });
  // embed.addFields({ name: 'Hydrate', value: getDesc('hydrate') ?? '', inline: true });
  // embed.addFields({ name: 'Crisis', value: getDesc('crisis') ?? '', inline: true });
  return {
    embeds: [
      embedTemplate()
        .setTitle('Harm Reduction Modules')
        .setDescription(stripIndents`
        These commands are for harm reduction purposes only, and are not intended to replace the advice of a medical professional.

        Harm reduction is a set of practical strategies and ideas aimed at reducing negative consequences associated with drug use. Harm Reduction is also a movement for social justice built on a belief in, and respect for, the rights of people who use drugs.

        # Drug
        Display 
        
        `),
    ],
    components: [new ActionRowBuilder<ButtonBuilder>().addComponents([
      startButton,
      funButton,
      tripsitButton,
    ])],
  };
}

async function funEmbedBuilder():Promise<InteractionEditReplyOptions> {
  // embed.addFields({ name: 'About', value: getDesc('about') ?? '', inline: true });
  // embed.addFields({ name: 'Contact', value: getDesc('contact') ?? '', inline: true });
  // embed.addFields({ name: 'Feedback', value: getDesc('feedback') ?? '', inline: true });
  // embed.addFields({ name: 'Triptoys', value: getDesc('triptoys') ?? '', inline: true });
  // embed.addFields({ name: 'Imgur', value: getDesc('imgur') ?? '', inline: true });
  // embed.addFields({ name: 'Magick8Ball', value: getDesc('magick8ball') ?? '', inline: true });
  // embed.addFields({ name: 'Urban Define', value: getDesc('urban_define') ?? '', inline: true });
  // embed.addFields({ name: 'Topic', value: getDesc('topic') ?? '', inline: true });
  // embed.addFields({ name: 'Joke', value: getDesc('joke') ?? '', inline: true });
  // embed.addFields({ name: 'Youtube', value: getDesc('youtube') ?? '', inline: true });
  // embed.addFields({ name: 'Coinflip', value: getDesc('coinflip') ?? '', inline: true });
  // embed.addFields({ name: 'Lovebomb', value: getDesc('lovebomb') ?? '', inline: true });
  // embed.addFields({ name: 'Remindme', value: getDesc('remind_me') ?? '', inline: true });
  // embed.addFields({ name: 'Convert', value: getDesc('convert') ?? '', inline: true });
  // embed.addFields({ name: 'Poll', value: getDesc('poll') ?? '', inline: true });
  // funEmbed.addFields({name: 'Youtube', value: getDesc('youtube'), inline: true});

  return {
    embeds: [
      embedTemplate()
        .setTitle('Fun Modules')
        .setDescription('These commands are for fun and general use.'),
    ],
    components: [new ActionRowBuilder<ButtonBuilder>().addComponents([
      startButton,
      hrButton,
      tripsitButton,
    ])],
  };
}

async function tripsitEmbedBuilder():Promise<InteractionEditReplyOptions> {
  // embed.addFields({ name: 'TripSit', value: getDesc('tripsit'), inline: true });
  // embed.addFields({ name: 'Clearchat', value: getDesc('clear-chat') ?? '', inline: true });
  // embed.addFields({ name: 'Birthday', value: getDesc('birthday') ?? '', inline: true });
  // embed.addFields({ name: 'Timezone', value: getDesc('timezone') ?? '', inline: true });
  // embed.addFields({ name: 'Profile', value: getDesc('profile') ?? '', inline: true });
  // embed.addFields({ name: 'Moderate', value: getDesc('mod') ?? '', inline: true });
  // embed.addFields({ name: 'Report', value: getDesc('report') ?? '', inline: true });

  return {
    embeds: [
      embedTemplate()
        .setTitle('TripSit Specific Modules')
        .setDescription('These commands are only available in TripSit\'s Discord server.'),
    ],
    components: [new ActionRowBuilder<ButtonBuilder>().addComponents([
      startButton,
      hrButton,
      funButton,
    ])],
  };
}

export async function helpButton(
  interaction: ButtonInteraction,
) {
  const [, category] = interaction.customId.split('~');
  log.info(F, await commandContext(interaction));
  switch (category) {
    case 'Start':
      await interaction.update(await startEmbedBuilder());
      break;
    case 'HarmReduction':
      await interaction.update(await hrEmbedBuilder());
      break;
    case 'Fun':
      await interaction.update(await funEmbedBuilder());
      break;
    case 'TripSit':
      await interaction.update(await tripsitEmbedBuilder());
      break;
    default:
      await interaction.update(await startEmbedBuilder());
      break;
  }
}

export const dHelp: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Information about TripBot Commands')
    .addBooleanOption(option => option.setName('ephemeral')
      .setDescription('Set to "True" to show the response only to you')),

  async execute(interaction) {
    log.info(F, await commandContext(interaction));
    await interaction.deferReply({ ephemeral: (interaction.options.getBoolean('ephemeral') === true) });
    await interaction.editReply(await startEmbedBuilder());
    return true;
  },
};

export default dHelp;
