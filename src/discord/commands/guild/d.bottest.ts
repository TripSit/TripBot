import {
  ChatInputCommandInteraction,
  // ActionRowBuilder,
  // ModalBuilder,
  // TextInputBuilder,
  // Colors,
  SlashCommandBuilder,
  TextChannel,
} from 'discord.js';
import {
// TextInputStyle,
} from 'discord-api-types/v10';
import { parse } from 'path';
import { SlashCommand } from '../../@types/commandDef';
import { embedTemplate } from '../../utils/embedTemplate';
import { startLog } from '../../utils/startLog';
import env from '../../../global/utils/env.config';
// import fs from 'fs/promises';
import log from '../../../global/utils/log'; // eslint-disable-line
const PREFIX = parse(__filename).name;
// import drugDataAll from '../../../global/assets/data/drug_db_combined.json';
// const drugNames = drugDataAll.map((d) => d.name);
type ResultsObject = {
  total: string[]
  passed:string[]
  failed:string[]
};

// These commands are not meant to be tested
  const notTestableCommands = [ // eslint-disable-line
  'clearchat', // This would wipe out the results of the test
  'issue', // This is a simple API that will submit a github issue to production
  'ping', // This is a test command that is not meant to be tested
  'setup', // This needs to be manually tested
  'bottest', // This would start recursion
  'moderate',
  'modmail',
  'u_ban', // Opens a modal and idk how to test modals
  'u_info', // Opens a modal and idk how to test modals
  'u_kick', // Opens a modal and idk how to test modals
  'u_note', // Opens a modal and idk how to test modals
  'u_underban', // Opens a modal and idk how to test modals
  'm_report', // Opens a modal and idk how to test modals
  'm_timeout', // Opens a modal and idk how to test modals
  'm_warn', // Opens a modal and idk how to test modals
  'feedback', // Opens a modal and idk how to test modals
  'report', // Opens a modal and idk how to test modals

];

// These commands are simple replies and CANNOT take input
  const replyCommands = [ // eslint-disable-line
  'about',
  'botstats',
  'coinflip',
  'contact',
  'combochart',
  'donate',
  'ems',
  'grounding',
  'h2flow',
  'help',
  'hydrate',
  'joke',
  'kipp',
  'lovebomb',
  'magick8ball',
  'reagents',
  'recovery',
  'testkits',
  'topic',
  'triptoys',
  'warmline',
];

// The commands REQUIRE input of some sort
  const testableCommands = [ // eslint-disable-line
  'birthday',
  'breathe',
  'calc_benzo',
  'calc_dxm',
  'calc_ketamine',
  'calc_psychedelics',
  'combo',
  'convert',
  'dramacounter',
  'drug',
  'idose',
  'imdb',
  'imgur',
  'karma',
  'leaderboard',
  'poll',
  'profile',
  'remindme',
  'reminder',
  'say',
  'timezone',
  'urban_define',
  'youtube',
];

/**
 * @param {number} ms
 * @return {Promise<void>}
 */
function sleep(ms:number):Promise<void> {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}

/**
 *
 * @param {ChatInputCommandInteraction} interaction
 * @param {string} name
 */
async function runCommand(interaction:ChatInputCommandInteraction, commandName:string):Promise<boolean | null> {
  const testInteraction = {
    options: {},
    client: interaction.client,
    guild: interaction.guild,
    user: interaction.user,
    member: interaction.member,
    channel: interaction.channel,
    reply: (content:string) => interaction.followUp(content),
    editReply: (content:string) => interaction.followUp(content),
    deferReply: () => {

    },
  };

  // log.debug(`[${PREFIX}] Running command: ${name}`);

  if (!testableCommands.includes(commandName) && !replyCommands.includes(commandName)) return null;

  // log.debug(`[${PREFIX}] in channel: ${(interaction.channel as TextChannel).name}`);

  if (!interaction.channel) return null;

  await sleep(1000);

  await interaction.channel.send(`> **${commandName}** - Initializing test!`);

  const command = await interaction.client.commands.get(commandName);
  if (command) {
    // if (name === 'template') {
    //   testInteraction.options = {
    //     getString: (name:string) => {
    //       if (name === 'name') return 'value';
    //     },
    //     getInteger: (name:string) => {
    //       if (name === 'name') return 0;
    //     },
    //     getMember: (name:string) => {
    //       if (name === 'name') return interaction.member;
    //     },
    //     getSubcommand: () => {
    //       return 'name';
    //     },
    //   };
    //   return await command.execute(testInteraction);
    // }
    if (commandName === 'birthday') {
      // Test getting a blank birthday
      await interaction.channel.send(`> **${commandName}** - Getting existing record`);
      testInteraction.options = {
        getString: (name:string) => {
          if (name === 'month') return 'June';
          return null;
        },
        getInteger: (name:string) => {
          if (name === 'day') return 3;
          return null;
        },
        getMember: (name:string) => {
          if (name === 'user') return interaction.member;
          return null;
        },
        getSubcommand: () => 'get',
      };
      await command.execute(testInteraction);
      await sleep(1000);

      // Initialize a variable with a random month and day

      const monthDict = {
        0: 'january',
        1: 'february',
        2: 'march',
        3: 'april',
        4: 'may',
        5: 'june',
        6: 'july',
        7: 'august',
        8: 'september',
        9: 'october',
        10: 'november',
        11: 'december',
      };
      const monthInt = Math.floor(Math.random() * 12) + 1;
      const monthName = monthDict[monthInt as keyof typeof monthDict];
      const day = Math.floor(Math.random() * 28) + 1;

      // Set the birthday
      await interaction.channel.send(`> **${commandName}** - Setting new birthdate to ${monthName} ${day}`);
      testInteraction.options = {
        getString: (name:string) => {
          if (name === 'month') return monthName;
          return null;
        },
        getInteger: (name:string) => {
          if (name === 'day') return day;
          return null;
        },
        getMember: (name:string) => {
          if (name === 'user') return interaction.member;
          return null;
        },
        getSubcommand: () => 'set',
      };
      await command.execute(testInteraction);
      await sleep(1000);

      // Get the new birthday
      await interaction.channel.send(`> **${commandName}** - Getting new birthdate (Should be ${monthName} ${day})`);
      testInteraction.options = {
        getString: (name:string) => {
          if (name === 'month') return 'june';
          return null;
        },
        getInteger: (name:string) => {
          if (name === 'day') return 3;
          return null;
        },
        getMember: (name:string) => {
          if (name === 'user') return interaction.member;
          return null;
        },
        getSubcommand: () => 'get',
      };
      await command.execute(testInteraction);
      return true;
    }
    if (commandName === 'bug') {
      return false;
    }
    if (commandName === 'breathe') {
      testInteraction.options = {
        getString: (name:string) => {
          if (name === 'exercise') return '1';
          return null;
        },
      };
      await command.execute(testInteraction);
      await sleep(1000);
      testInteraction.options = {
        getString: (name:string) => {
          if (name === 'exercise') return '2';
          return null;
        },
      };
      await command.execute(testInteraction);
      await sleep(1000);
      testInteraction.options = {
        getString: (name:string) => {
          if (name === 'exercise') return '3';
          return null;
        },
      };
      await command.execute(testInteraction);
      await sleep(1000);
      testInteraction.options = {
        getString: (name:string) => {
          if (name === 'exercise') return '4';
          return null;
        },
      };
      await command.execute(testInteraction);
      return true;
    }
    if (commandName === 'calc_benzo') {
      // await command.execute(interaction, ['10', 'alprazolam', 'ativan']);
      testInteraction.options = {
        getString: (name:string) => {
          if (name === 'mg_of') return 'clorazepate';
          if (name === 'and_i_want_the_dose_of') return 'flubromazepam';
          return null;
        },
        getNumber: (name:string) => {
          if (name === 'i_have') return '14.5';
          return null;
        },
      };
      await command.execute(testInteraction);
      return true;
    }
    if (commandName === 'calc_dxm') {
      testInteraction.options = {
        getString: (name:string) => {
          if (name === 'units') return 'lbs';
          if (name === 'taking') return 'RoboTablets (30 mg tablets)';
          return null;
        },
        getInteger: (name:string) => {
          if (name === 'calc_weight') return '200';
          return null;
        },
      };
      await command.execute(testInteraction);
      return true;
    }
    if (commandName === 'calc_ketamine') {
      testInteraction.options = {
        getString: (name:string) => {
          if (name === 'units') return 'lbs';
          return null;
        },
        getInteger: (name:string) => {
          if (name === 'weight') return '200';
          return null;
        },
      };
      await command.execute(testInteraction);
      return true;
    }
    if (commandName === 'calc_psychedelics') {
      // await command.execute(interaction, ['200', '', '4', 'lsd']);
      testInteraction.options = {
        getInteger: (name:string) => {
          if (name === 'last_dose') return 2;
          if (name === 'desired_dose') return 4;
          if (name === 'days') return 4;
          return null;
        },
        getSubcommand: () => 'mushrooms',
      };
      await command.execute(testInteraction);
      await sleep(1000);
      testInteraction.options = {
        getInteger: (name:string) => {
          if (name === 'last_dose') return 2;
          if (name === 'desired_dose') return null;
          if (name === 'days') return 4;
          return null;
        },
        getSubcommand: () => 'mushrooms',
      };
      await command.execute(testInteraction);
      await sleep(1000);
      testInteraction.options = {
        getInteger: (name:string) => {
          if (name === 'last_dose') return 200;
          if (name === 'desired_dose') return 400;
          if (name === 'days') return 4;
          return null;
        },
        getSubcommand: () => 'lsd',
      };
      await command.execute(testInteraction);
      await sleep(1000);
      testInteraction.options = {
        getInteger: (name:string) => {
          if (name === 'last_dose') return 200;
          if (name === 'desired_dose') return null;
          if (name === 'days') return 4;
          return null;
        },
        getSubcommand: () => 'lsd',
      };
      await command.execute(testInteraction);
      return true;
    }
    if (commandName === 'combo') {
      testInteraction.options = {
        getString: (name:string) => {
          if (name === 'first_drug') return 'DXM';
          if (name === 'second_drug') return 'MDMA';
          return null;
        },
      };
      await command.execute(testInteraction);
      return true;
    }
    if (commandName === 'convert') {
      testInteraction.options = {
        getString: (name:string) => {
          if (name === 'units') return 'km';
          if (name === 'into_units') return 'mi';
          return null;
        },
        getNumber: (name:string) => {
          if (name === 'value') return 14.56;
          return null;
        },
      };
      await command.execute(testInteraction);
      return true;
    }
    if (commandName === 'dramacounter') {
      // Test getting the existing drama
      await interaction.channel.send(`> **${commandName}** - Getting existing record`);
      testInteraction.options = {
        getString: (name:string) => {
          if (name === 'dramatime') return '';
          if (name === 'dramaissue') return '';
          return null;
        },
        getSubcommand: () => 'get',
      };
      await command.execute(testInteraction);
      await sleep(1000);

      // Get random value 1-10
      const randomValue = Math.floor(Math.random() * 10) + 1;
      // Test getting the existing drama
      await interaction.channel.send(
        `> **${commandName}** - Setting new value: 'Testing ${randomValue} - ${randomValue} hours ago`,
      );
      testInteraction.options = {
        getString: (name:string) => {
          if (name === 'dramatime') return `${randomValue} hours ago`;
          if (name === 'dramaissue') return `Testing ${randomValue}`;
          return null;
        },
        getSubcommand: () => 'set',
      };
      await command.execute(testInteraction);
      await sleep(1000);

      // Test getting the existing drama
      await interaction.channel.send(`> **${commandName}** - Get new record, should be the same as above`);
      testInteraction.options = {
        getString: (name:string) => {
          if (name === 'dramatime') return '';
          if (name === 'dramaissue') return '';
          return null;
        },
        getSubcommand: () => 'get',
      };
      await command.execute(testInteraction);
      return true;
    }
    if (commandName === 'drug') {
      testInteraction.options = {
        getString: (name:string) => {
          if (name === 'substance') return 'DXM';
          return null;
        },
      };
      await command.execute(testInteraction);
      return true;
    }
    if (commandName === 'idose') {
      // Test getting a record
      await interaction.channel.send(`> **${commandName}** - Getting existing record`);
      testInteraction.options = {
        getString: (name:string) => {
          if (name === 'substance') return 'Cannabis';
          if (name === 'units') return 'G';
          if (name === 'roa') return 'RECTAL';
          if (name === 'offset') return '23 mins ago';
          return null;
        },
        getNumber: (name:string) => {
          if (name === 'volume') return 10;
          if (name === 'record') return 0;
          return null;
        },
        getSubcommand: () => 'get',
      };
      await command.execute(testInteraction);
      await sleep(1000);

      // Set a dose
      await interaction.channel.send(`> **${commandName}** - Setting record`);
      testInteraction.options = {
        getString: (name:string) => {
          if (name === 'substance') return 'Cannabis';
          if (name === 'units') return 'G';
          if (name === 'roa') return 'RECTAL';
          if (name === 'offset') return '23 mins ago';
          return null;
        },
        getNumber: (name:string) => {
          if (name === 'volume') return 10;
          if (name === 'record') return 0;
          return null;
        },
        getSubcommand: () => 'set',
      };
      await command.execute(testInteraction);
      await sleep(1000);

      // Get history
      await interaction.channel.send(`> **${commandName}** - Get records`);
      testInteraction.options = {
        getString: (name:string) => {
          if (name === 'substance') return 'Cannabis';
          if (name === 'units') return 'G';
          if (name === 'roa') return 'RECTAL';
          if (name === 'offset') return '23 mins ago';
          return null;
        },
        getNumber: (name:string) => {
          if (name === 'volume') return 10;
          if (name === 'record') return 0;
          return null;
        },
        getSubcommand: () => 'get',
      };
      await command.execute(testInteraction);
      await sleep(1000);

      // Delete record
      await interaction.channel.send(`> **${commandName}** - Deleting record`);
      testInteraction.options = {
        getString: (name:string) => {
          if (name === 'substance') return 'Cannabis';
          if (name === 'units') return 'G';
          if (name === 'roa') return 'RECTAL';
          if (name === 'offset') return '23 mins ago';
          return null;
        },
        getNumber: (name:string) => {
          if (name === 'volume') return 10;
          if (name === 'record') return 0;
          return null;
        },
        getSubcommand: () => 'delete',
      };
      await command.execute(testInteraction);
      await sleep(1000);

      // Get history
      await interaction.channel.send(`> **${commandName}** - Get records`);
      testInteraction.options = {
        getString: (name:string) => {
          if (name === 'substance') return 'Cannabis';
          if (name === 'units') return 'G';
          if (name === 'roa') return 'RECTAL';
          if (name === 'offset') return '23 mins ago';
          return null;
        },
        getNumber: (name:string) => {
          if (name === 'volume') return 10;
          if (name === 'record') return 0;
          return null;
        },
        getSubcommand: () => 'get',
      };
      await command.execute(testInteraction);
      return true;
    }
    if (commandName === 'imdb') {
      testInteraction.options = {
        getString: (name:string) => {
          if (name === 'title') return 'Jurrassic Park';
          return null;
        },
      };
      await command.execute(testInteraction);
      return true;
    }
    if (commandName === 'imgur') {
      testInteraction.options = {
        getString: (name:string) => {
          if (name === 'search') return 'Puppies';
          return null;
        },
      };
      await command.execute(testInteraction);
      return true;
    }
    if (commandName === 'karma') {
      testInteraction.options = {
        getMember: () => interaction.member,
      };
      await command.execute(testInteraction);
      return true;
    }
    if (commandName === 'leaderboard') {
      testInteraction.options = {
        getString: (name:string) => {
          if (name === 'category') return 'OVERALL';
          return null;
        },
      };
      await command.execute(testInteraction);
      sleep(1000);

      testInteraction.options = {
        getString: (name:string) => {
          if (name === 'category') return 'TOTAL';
          return null;
        },
      };
      await command.execute(testInteraction);
      sleep(1000);

      testInteraction.options = {
        getString: (name:string) => {
          if (name === 'category') return 'GENERAL';
          return null;
        },
      };
      await command.execute(testInteraction);
      sleep(1000);

      testInteraction.options = {
        getString: (name:string) => {
          if (name === 'category') return 'TRIPSITTER';
          return null;
        },
      };
      await command.execute(testInteraction);
      sleep(1000);

      testInteraction.options = {
        getString: (name:string) => {
          if (name === 'category') return 'DEVELOPER';
          return null;
        },
      };
      await command.execute(testInteraction);
      sleep(1000);

      testInteraction.options = {
        getString: (name:string) => {
          if (name === 'category') return 'TEAM';
          return null;
        },
      };
      await command.execute(testInteraction);
      sleep(1000);

      testInteraction.options = {
        getString: (name:string) => {
          if (name === 'category') return 'IGNORED';
          return null;
        },
      };
      await command.execute(testInteraction);
      return true;
    }
    if (commandName === 'poll') {
      testInteraction.options = {
        getString: (name:string) => {
          if (name === 'question') return 'Is TripBot Awesome?';
          if (name === 'options') return 'Yes,Also Yes,No...but yes';
          return null;
        },
      };
      await command.execute(testInteraction);
      return true;
    }
    if (commandName === 'profile') {
      testInteraction.options = {
        getMember: () => interaction.member,
      };
      await command.execute(testInteraction);
      return true;
    }
    if (commandName === 'remindme') {
      // Get existing reminders
      await interaction.channel.send(`> **${commandName}** - Getting existing record`);
      testInteraction.options = {
        getString: (name:string) => {
          if (name === 'offset') return '2 mins';
          if (name === 'reminder') return 'Test reminder A';
          return null;
        },
        getNumber: (name:string) => {
          if (name === 'record') return 0;
          return null;
        },
        getSubcommand: () => 'get',
      };
      await command.execute(testInteraction);
      await sleep(1000);

      // Set a dose
      await interaction.channel.send(`> **${commandName}** - Setting record`);
      testInteraction.options = {
        getString: (name:string) => {
          if (name === 'offset') return '2 mins';
          if (name === 'reminder') return 'Test reminder A';
          return null;
        },
        getNumber: (name:string) => {
          if (name === 'record') return 0;
          return null;
        },
        getSubcommand: () => 'set',
      };
      await command.execute(testInteraction);
      await sleep(1000);

      // Set a dose
      await interaction.channel.send(`> **${commandName}** - Setting record`);
      testInteraction.options = {
        getString: (name:string) => {
          if (name === 'offset') return '3 mins';
          if (name === 'reminder') return 'Test reminder B';
          return null;
        },
        getNumber: (name:string) => {
          if (name === 'record') return 0;
          return null;
        },
        getSubcommand: () => 'set',
      };
      await command.execute(testInteraction);
      await sleep(1000);

      // Get history
      await interaction.channel.send(`> **${commandName}** - Get records`);
      testInteraction.options = {
        getString: (name:string) => {
          if (name === 'offset') return '2 mins';
          if (name === 'reminder') return 'Test reminder A';
          return null;
        },
        getNumber: (name:string) => {
          if (name === 'record') return 0;
          return null;
        },
        getSubcommand: () => 'get',
      };
      await command.execute(testInteraction);
      await sleep(1000);

      // Delete record
      await interaction.channel.send(`> **${commandName}** - Deleting record`);
      testInteraction.options = {
        getString: (name:string) => {
          if (name === 'offset') return '2 mins';
          if (name === 'reminder') return 'Test reminder A';
          return null;
        },
        getNumber: (name:string) => {
          if (name === 'record') return 0;
          return null;
        },
        getSubcommand: () => 'delete',
      };
      await command.execute(testInteraction);
      await sleep(1000);

      // Get history
      await interaction.channel.send(`> **${commandName}** - Get records`);
      testInteraction.options = {
        getString: (name:string) => {
          if (name === 'offset') return '2 mins';
          if (name === 'reminder') return 'Test reminder A';
          return null;
        },
        getNumber: (name:string) => {
          if (name === 'record') return 0;
          return null;
        },
        getSubcommand: () => 'get',
      };
      await command.execute(testInteraction);
      return true;
    }
    if (commandName === 'reminder') {
      testInteraction.channel = await interaction.guild?.channels.fetch(env.CHANNEL_TEAMTRIPSIT) as TextChannel;
      await command.execute(testInteraction);
      sleep(1000);

      testInteraction.channel = await interaction.guild?.channels.fetch(env.CHANNEL_GENERAL) as TextChannel;
      await command.execute(testInteraction);
      sleep(1000);

      testInteraction.channel = await interaction.guild?.channels.fetch(env.CHANNEL_SANCTUARY) as TextChannel;
      await command.execute(testInteraction);
      return true;
    }
    if (commandName === 'say') {
      testInteraction.options = {
        getChannel: (name:string) => {
          if (name === 'channel') return interaction.channel;
          return null;
        },
        getString: (name:string) => {
          if (name === 'say') return 'TripBot Is Awesome!';
          return null;
        },
      };
      await command.execute(testInteraction);
      return true;
    }
    if (commandName === 'timezone') {
      // Test getting a blank timezone
      await interaction.channel.send(`> **${commandName}** - Getting existing record`);
      testInteraction.options = {
        getString: (name:string) => {
          if (name === 'timezone') return 'Pacific/Tahiti';
          return null;
        },
        getMember: (name:string) => {
          if (name === 'user') return interaction.member;
          return null;
        },
        getSubcommand: () => 'get',
      };
      await command.execute(testInteraction);
      await sleep(1000);

      // Set the record
      await interaction.channel.send(`> **${commandName}** - Setting new timezone to 'America/Chicago'`);
      testInteraction.options = {
        getString: (name:string) => {
          if (name === 'timezone') return '(GMT-10:00) Hawaii Time';
          return null;
        },
        getMember: (name:string) => {
          if (name === 'user') return interaction.member;
          return null;
        },
        getSubcommand: () => 'set',
      };
      await command.execute(testInteraction);
      await sleep(1000);

      // Get the new record
      await interaction.channel.send(`> **${commandName}** - Getting new record (Should be same as above)`);
      testInteraction.options = {
        getString: (name:string) => {
          if (name === 'timezone') return '(GMT-09:00) Alaska Time';
          return null;
        },
        getMember: (name:string) => {
          if (name === 'user') return interaction.member;
          return null;
        },
        getSubcommand: () => 'get',
      };
      await command.execute(testInteraction);

      // Set the record
      await interaction.channel.send(`> **${commandName}** - Setting new timezone to 'America/New_York'`);
      testInteraction.options = {
        getString: (name:string) => {
          if (name === 'timezone') return '(GMT-08:00) Pacific Time';
          return null;
        },
        getMember: (name:string) => {
          if (name === 'user') return interaction.member;
          return null;
        },
        getSubcommand: () => 'set',
      };
      await command.execute(testInteraction);
      await sleep(1000);

      // Get the new record
      await interaction.channel.send(`> **${commandName}** - Getting new record (Should be same as above)`);
      testInteraction.options = {
        getString: (name:string) => {
          if (name === 'timezone') return '(GMT-08:00) Pacific Time';
          return null;
        },
        getMember: (name:string) => {
          if (name === 'user') return interaction.member;
          return null;
        },
        getSubcommand: () => 'get',
      };
      await command.execute(testInteraction);
      return true;
    }
    if (commandName === 'triptoys') {
      testInteraction.options = {
        getString: (name:string) => {
          if (name === 'toy') return '25';
          return null;
        },
      };
      await command.execute(testInteraction);
      return true;
    }
    if (commandName === 'urban_define') {
      testInteraction.options = {
        getString: (name:string) => {
          if (name === 'define') return 'TripSit';
          return null;
        },
      };
      await command.execute(testInteraction);
      return true;
    }
    if (commandName === 'youtube') {
      testInteraction.options = {
        getString: (name:string) => {
          if (name === 'search') return 'TripSit find the others';
          return null;
        },
      };
      await command.execute(testInteraction);
      return true;
    }

    // No-parameter commands fall down here, including:
    // - button, joke, kipp, motivate, ping, topic
    await command.execute(testInteraction);
    return true;
  }
  interaction.channel.send(`**${commandName}** - command not found!`);
  return false;
}

/**
 *
 * @param {ChatInputCommandInteraction} interaction
 * @param {ResultsObject} results
 */
async function testGlobal(
  interaction:ChatInputCommandInteraction,
  results: ResultsObject,
):Promise<ResultsObject> {
  const scope = interaction.options.getString('scope') || 'All';
  if (scope === 'All' || scope === 'Global') {
    await client.application?.commands.fetch({ force: true })
      .then(async globalCommands => {
        await interaction.followUp(`> Testing ${globalCommands.size} global commands!`);
        // for (const command of globalCommands) {
        globalCommands.forEach(async command => {
          // log.debug(`[${PREFIX}] Testing global command ${command.name}`);
          await runCommand(interaction, command.name)
            .then(result => {
              if (result === true) {
                // log.debug(`[${PREFIX}] Global command ${command.name} passed!`);
                results.total.push(command.name);
                results.passed.push(command.name);
              } else if (result === false) {
                // log.debug(`[${PREFIX}] Global command ${command.name} failed!`);
                results.total.push(command.name);
                results.failed.push(command.name);
              } else if (result === null) {
                // log.debug(`[${PREFIX}] Global command ${command.name} was not tested!`);

              }
            });
        });
      });
    // .finally(() => {
    //   // log.debug(`[${PREFIX}] Global commands results: ${JSON.stringify(results)}`);
    // });
  }
  return results;
}

/**
 *
 * @param {ChatInputCommandInteraction} interaction
 * @param {ResultsObject} results
 */
async function testGuild(
  interaction:ChatInputCommandInteraction,
  results: ResultsObject,
):Promise<ResultsObject> {
  if (!interaction.guild) {
    await interaction.followUp('> You must be in a guild to test guild commands!');
    return results;
  }
  await interaction.guild.commands.fetch({ force: true })
    .then(async guildCommands => {
      await interaction.followUp(`> Testing ${guildCommands.size} guild commands!`);
      // for (const command of guildCommands) {
      guildCommands.forEach(async command => {
        // log.debug(`[${PREFIX}] Testing guild command ${command.name}`);
        await runCommand(interaction, command.name)
          .then(result => {
            if (result === true) {
              // log.debug(`[${PREFIX}] Global command ${command.name} passed!`);
              results.total.push(command.name);
              results.passed.push(command.name);
            } else if (result === false) {
              // log.debug(`[${PREFIX}] Global command ${command.name} failed!`);
              results.total.push(command.name);
              results.failed.push(command.name);
            } else if (result === null) {
              // log.debug(`[${PREFIX}] Global command ${command.name} was not tested!`);

            }
          });
      });
    });
  return results;
}

export default dBottest;

export const dBottest: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('bottest')
    .setDescription('This will test the bot and show all functionality!')
    .addStringOption(option => option.setName('scope')
      .setDescription('Global, guild, or all?')
      .addChoices(
        { name: 'All', value: 'All' },
        { name: 'Guild', value: 'Guild' },
        { name: 'Global', value: 'Global' },
      )),
  async execute(interaction) {
    startLog(PREFIX, interaction);
    if (!interaction.channel) {
      await interaction.reply('This command must be used in a channel!');
      return false;
    }
    // const scope = interaction.options.getString('scope') || 'All';
    await interaction.reply('Testing commands!');

    const results = {
      total: [] as string[],
      passed: [] as string[],
      failed: [] as string[],
    };

    await testGlobal(interaction, results)
      .then(async globalResults => {
        // log.debug(`[${PREFIX}] Global results: ${JSON.stringify(globalResults)}`);
        await testGuild(interaction, globalResults)
          .then(async guildResults => {
            if (!interaction.channel) {
              await interaction.reply('This command must be used in a channel!');
              return false;
            }
            // log.debug(`[${PREFIX}] Guild results: ${JSON.stringify(guildResults)}`);
            const embed = embedTemplate()
              .setTitle('Testing Results')
              .setDescription(`${guildResults.failed.length > 0
                ? `The following commands failed testing: ${guildResults.failed.join(', ')}`
                : 'All commands passed testing!'}`)
              .addFields(
                { name: 'Tested', value: `${guildResults.total.length}`, inline: true },
                { name: 'Success', value: `${guildResults.passed.length}`, inline: true },
                { name: 'Failed', value: `${guildResults.failed.length}`, inline: true },
              );
            await interaction.channel.send({ embeds: [embed] });
            return true;
          });
      });
    return true;
  },
};
