/* eslint-disable max-len */
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Colors,
  InteractionEditReplyOptions,
  SlashCommandBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuInteraction,
} from 'discord.js';
import { stripIndents } from 'common-tags';
import { SlashCommand } from '../../@types/commandDef';
import { embedTemplate } from '../../utils/embedTemplate';
import commandContext from '../../utils/context';
import tripsit from '../../../global/commands/g.about';

const F = f(__filename);

const selectAPage = 'Select a Page';

const selectMenuOptions = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents([
  new StringSelectMenuBuilder()
    .setCustomId('helpSelectMenu')
    .setPlaceholder(selectAPage)
    .addOptions([
      {
        label: 'Start',
        value: 'Start',
        description: 'Return to the main menu.',
        emoji: '🏠',
      },
      {
        label: 'Harm Reduction Tools',
        value: 'HarmReduction',
        description: 'Harm reduction tools and information.',
        emoji: '🚑',
      },
      {
        label: 'TripSit Sessions',
        value: 'TripSit',
        description: 'TripSit\'s help system.',
        emoji: '🛋️',
      },
      {
        label: 'TripSit Experience',
        value: 'TripSitExp',
        description: 'TripSit\'s experience system.',
        emoji: '🎖️',
      },
      {
        label: 'Other Systems',
        value: 'Systems',
        description: 'Various systems you can set up',
        emoji: '🔧',
      },
      {
        label: 'Fun',
        value: 'Fun',
        description: 'Commands for fun and general use.',
        emoji: '🎉',
      },
      {
        label: 'TripSit Only',
        value: 'TripSitOnly',
        description: 'Commands only available in TripSit\'s Discord server.',
        emoji: '🛑',
      },
      {
        label: 'Support TripSit',
        value: 'Support',
        description: 'Support TripSit\'s mission.',
        emoji: '💸',
      },
      {
        label: 'Credits',
        value: 'Credits',
        description: 'People and projects who have contributed to TripBot.',
        emoji: '👏',
      },
      {
        label: 'Feedback / Development',
        value: 'Feedback',
        description: 'Provide feedback or get involved in development.',
        emoji: '📢',
      },
      {
        label: 'Invite',
        value: 'Invite',
        description: 'Invite TripBot to your server.',
        emoji: '💌',
      },
    ]),
]);

export async function startPage():Promise<InteractionEditReplyOptions> {
  return {
    embeds: [
      embedTemplate()
        .setTitle('Welcome to TripSit\'s TripBot')
        .setURL('https://tripsit.me')
        .addFields(
          {
            name: 'About TripSit',
            value: tripsit.description,
          },
          {
            name: 'About TripBot',
            value: tripsit.botInfo,
          },
          {
            name: 'Disclaimer',
            value: tripsit.disclaimer,
          },
        ),
    ],
    components: [
      selectMenuOptions,
    ],
  };
}

export async function hrPage():Promise<InteractionEditReplyOptions> {
  return {
    embeds: [
      embedTemplate()
        .setTitle('Harm Reduction Modules')
        .setDescription(stripIndents`
        These commands are for harm reduction purposes, and are not intended to replace the advice of a medical professional.

        Harm reduction is a set of practical strategies and ideas aimed at reducing negative consequences associated with drug use. Harm Reduction is also a movement for social justice built on a belief in, and respect for, the rights of people who use drugs.
        `)
        .addFields(
          { name: '\u200B', value: '**Informational**', inline: false },
          {
            name: 'Drug',
            value: stripIndents`Display drug information sourced from both TripSit and Psychonaut Wiki. 
            Accepts alias and common names for substances.`,
            inline: true,
          },
          {
            name: 'Combo',
            value: 'Display drug combination information sourced from both TripSit and Psychonaut Wiki.',
            inline: true,
          },
          {
            name: 'Crisis',
            value: 'Display information about crisis resources.',
            inline: true,
          },
          {
            name: 'Warmline',
            value: 'Display information on various warmlines people can call.',
            inline: true,
          },
          {
            name: 'Guides',
            value: 'Display a list of guides from the TripSit Wiki.',
            inline: true,
          },
          {
            name: 'Drug Checking',
            value: 'Display information about drug checking services.',
            inline: true,
          },
          {
            name: 'Test Kits',
            value: 'Display information on how to get drug testing kits, including coupon codes',
            inline: true,
          },
          { name: '\u200B', value: '**Picture References**', inline: false },
          {
            name: 'ComboChart',
            value: 'Display a chart of drug combinations and their safety ratings.',
            inline: true,
          },
          {
            name: 'Breathe',
            value: 'Display various breathing techniques.',
            inline: true,
          },
          {
            name: 'Grounding',
            value: 'Steps to help the user ground themselves.',
            inline: true,
          },
          {
            name: 'Recovery',
            value: 'Display the recovery position.',
            inline: true,
          },
          {
            name: 'Reagents',
            value: 'Display information about common substances and their reagent reactions.',
            inline: true,
          },
          {
            name: 'Mushroom Info',
            value: 'Display dosage information about common mushrooms.',
            inline: true,
          },
          { name: '\u200B', value: '**Calculators**', inline: false },
          {
            name: 'Calc DXM',
            value: 'Calculate a safe dosage of DXM based on weight and product.',
            inline: true,
          },
          {
            name: 'Calc Benzodiazipine',
            value: 'Convert one benzodiazepine to another, very roughly.',
            inline: true,
          },
          {
            name: 'Calc Ketamine',
            value: 'Calculate a safe dosage of Ketamine based on weight.',
            inline: true,
          },
          {
            name: 'Calc Psychedelics',
            value: 'Calculate dosage of tryptamines (LSD/Mushrooms) based on last dosage.',
            inline: true,
          },
          { name: '\u200B', value: '**Tools and Utils**', inline: false },
          {
            name: 'iDose',
            value: 'Record your dosages and recall them at a later time.',
            inline: true,
          },
          {
            name: 'Remind Me',
            value: 'Set a reminder for a specific time.',
            inline: true,
          },
          {
            name: 'Convert',
            value: 'Convert one unit to another.',
            inline: true,
          },
        ),
    ],
    components: [
      selectMenuOptions,
    ],
  };
}

export async function funPage():Promise<InteractionEditReplyOptions> {
  return {
    embeds: [
      embedTemplate()
        .setTitle('Fun Modules')
        .setDescription('These commands are for fun and general use.')
        .addFields(
          {
            name: 'Image',
            value: 'Generate an image using DALL-E. Only available to active subscribers!',
            inline: true,
          },
          {
            name: 'Avatar',
            value: "Get a user's avatar.",
            inline: true,
          },
          {
            name: 'TripToys',
            value: 'Display a list of trip toys.',
            inline: true,
          },
          {
            name: 'KIPP',
            value: 'Remind people to Keep It Positive Please.',
            inline: true,
          },
          {
            name: 'Hydrate',
            value: 'Remind people to stay hydrated',
            inline: true,
          },
          {
            name: 'Imgur',
            value: 'Search Imgur for images.',
            inline: true,
          },
          {
            name: 'IMDB',
            value: 'Search IMDB for movies/tv shows.',
            inline: true,
          },
          {
            name: 'Magick8Ball',
            value: 'Ask the magic 8 ball a question.',
            inline: true,
          },
          {
            name: 'Urban Define',
            value: 'Define a word using Urban Dictionary.',
            inline: true,
          },
          {
            name: 'Topic',
            value: 'Get a random topic to discuss.',
            inline: true,
          },
          {
            name: 'Joke',
            value: 'Get a random joke.',
            inline: true,
          },
          {
            name: 'Coin Flip',
            value: 'Flip a coin.',
            inline: true,
          },
          {
            name: 'Love Bomb',
            value: 'Send a love bomb.',
            inline: true,
          },
          {
            name: 'Remind Me',
            value: 'Set a reminder for a specific time.',
            inline: true,
          },
          {
            name: 'Poll',
            value: 'Create a poll.',
            inline: true,
          },
          {
            name: 'Wikipedia',
            value: 'Search Wikipedia for articles.',
            inline: true,
          },
        ),
    ],
    components: [
      selectMenuOptions,
    ],
  };
}

export async function sessionsPage():Promise<InteractionEditReplyOptions> {
  return {
    embeds: [embedTemplate()
      .setColor(Colors.Purple)
      .setTitle('**TripSit Sessions**')
      .setDescription(tripsit.tripsitSessionsDesc)],
    components: [
      selectMenuOptions,
    ],
  };
}

export async function experiencePage():Promise<InteractionEditReplyOptions> {
  return {
    embeds: [embedTemplate()
      .setColor(Colors.Purple)
      .setTitle('**Experience System**')
      .setDescription(tripsit.experienceDesc)],
    components: [
      selectMenuOptions,
    ],
  };
}

export async function systemsPage():Promise<InteractionEditReplyOptions> {
  return {
    embeds: [embedTemplate()
      .setColor(Colors.Purple)
      .setTitle('🚀 **TripBot Systems!** 🚀')
      .setDescription('TripBot has a few systems you can set up to help manage your server.')
      .addFields(
        {
          name: 'Applications',
          value: stripIndents`
            This allows you to setup a system for users to apply for roles.
            It allows people to submit an application, and then the staff can review and approve or deny the application.
            It is not used on TripSit anymore but is available for use in other servers.`,
          inline: true,
        },
        {
          name: 'Tech Help',
          value: stripIndents`
            This creates a "talk to moderators" message where people can fill in a form to get help with issues
            It doesn't need to be technical issues, it can be moderation or whatever.`,
          inline: true,
        },
        {
          name: 'Rules',
          value: stripIndents`
            This creates a series of messages in the channel to display your rules. It comes with some default rules that TripSit uses.`,
          inline: true,
        },
      )],
    components: [
      selectMenuOptions,
    ],
  };
}

export async function tripsitPage():Promise<InteractionEditReplyOptions> {
  return {
    embeds: [
      embedTemplate()
        .setTitle('TripSit Specific Modules')
        .setDescription('These commands are only available in TripSit\'s Discord server.')
        .addFields(
          {
            name: 'Profile System',
            value: stripIndents`
              This will display your profile card for all to see!
              Your profile card includes information such as:
              - Your birthday, set with \`/birthday\`.
              - Your timezone, set with \`/timezone\`.
              - A rough calculations on how many messages you've sent.
              - A rough calculation on how much time you've spent in voice chat.
              - How much karma you have, which is given to you when people react to your posts with ${env.EMOJI_VOTE_UP}.
              - How many tokens you have, which are gained via the \`/rpg\` system.
              - Your current level and progress to next level.
              `,
            inline: false,
          },
          {
            name: 'RPG',
            value: stripIndents`
              TripBot has its own RPG game system where you can generate tokens and buy flavor stuff for your profile.
              You can do tasks to gain tokens, and then spend them on things like:
              - Backgrounds for your profile card.
              - Titles for your profile card.
              ... More to come!`,
            inline: false,
          },
          {
            name: 'Quotes',
            value: stripIndents`
              Right click on a message and click 'add quote' to add a quote to the quote database.
              Anyone can add a quote, you can always delete your own quotes if you want.`,
            inline: false,
          },
          {
            name: 'H2Flow',
            value: stripIndents`
              Every so often TripBot will prompt the chat to either: hydrate, move around, send appreciation to someone.
              React to these messages to gain points, that's all. It's just a fun little thing to keep people engaged and active.`,
            inline: true,
          },
          {
            name: 'Reminder',
            value: stripIndents`
              Sends various reminders into chat, to remind people to keep things on topic.`,
            inline: true,
          },
          {
            name: 'Counting',
            value: stripIndents`
              Counting channels, exactly what it sounds like. You count up from 1, and if you mess up, you start over.`,
            inline: true,
          },
          {
            name: 'Last',
            value: stripIndents`
              See the last message someone sent in chat.`,
            inline: true,
          },
          {
            name: 'Sheesh',
            value: stripIndents`
              Start a smoke sheesh session.`,
            inline: true,
          },
        ),
    ],
    components: [
      selectMenuOptions,
    ],
  };
}

export async function donatePage():Promise<InteractionEditReplyOptions> {
  return {
    embeds: [embedTemplate()
      .setColor(Colors.Purple)
      .setTitle('🚀 **TripSit\'s Donation Info!** 🚀')
      .setURL('https://tripsit.me/donate/')
      .setDescription(tripsit.support)],
    components: [
      selectMenuOptions,
      new ActionRowBuilder<ButtonBuilder>().addComponents([
        new ButtonBuilder()
          .setLabel('Patreon')
          .setEmoji('🎩')
          .setStyle(ButtonStyle.Link)
          .setURL(tripsit.patreon),
        new ButtonBuilder()
          .setLabel('Ko-Fi')
          .setEmoji('☕')
          .setStyle(ButtonStyle.Link)
          .setURL(tripsit.kofi),
        new ButtonBuilder()
          .setLabel('Spread Shop')
          .setEmoji('👕')
          .setStyle(ButtonStyle.Link)
          .setURL(tripsit.spreadshop),
        new ButtonBuilder()
          .setLabel('Spread Shirt')
          .setEmoji('👕')
          .setStyle(ButtonStyle.Link)
          .setURL(tripsit.spreadshirt),
      ]),
    ],
  };
}

export async function creditsPage():Promise<InteractionEditReplyOptions> {
  return {
    embeds: [embedTemplate()
      .setColor(Colors.Orange)
      .setDescription(tripsit.credits)],
    components: [
      selectMenuOptions,
    ],
  };
}

export async function feedbackPage():Promise<InteractionEditReplyOptions> {
  return {
    embeds: [embedTemplate()
      .setColor(Colors.Green)
      .setDescription(tripsit.feedback)],
    components: [
      selectMenuOptions,
      new ActionRowBuilder<ButtonBuilder>().addComponents([
        new ButtonBuilder()
          .setCustomId('feedbackReport')
          .setLabel('Feedback')
          .setEmoji('📢')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setLabel('Github Repo')
          .setEmoji('🐙')
          .setStyle(ButtonStyle.Link)
          .setURL(tripsit.github),
      ]),
    ],
  };
}

export async function invitePage():Promise<InteractionEditReplyOptions> {
  return {
    embeds: [embedTemplate()
      .setColor(Colors.Yellow)
      .setDescription(tripsit.inviteInfo)],
    components: [
      selectMenuOptions,
      new ActionRowBuilder<ButtonBuilder>().addComponents([
        new ButtonBuilder()
          .setLabel('Invite')
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
  const category = interaction.values[0];
  switch (category) {
    case 'Start':
      await interaction.update(await startPage());
      break;
    case 'HarmReduction':
      await interaction.update(await hrPage());
      break;
    case 'Systems':
      await interaction.update(await systemsPage());
      break;
    case 'Fun':
      await interaction.update(await funPage());
      break;
    case 'TripSit':
      await interaction.update(await sessionsPage());
      break;
    case 'TripSitExp':
      await interaction.update(await experiencePage());
      break;
    case 'TripSitOnly':
      await interaction.update(await tripsitPage());
      break;
    case 'Support':
      await interaction.update(await donatePage());
      break;
    case 'Credits':
      await interaction.update(await creditsPage());
      break;
    case 'Feedback':
      await interaction.update(await feedbackPage());
      break;
    case 'Invite':
      await interaction.update(await invitePage());
      break;
    default:
      await interaction.update(await startPage());
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
    await interaction.editReply(await startPage());
    return true;
  },
};

export default dHelp;
