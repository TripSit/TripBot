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
import { SlashCommand } from '../../@types/commandDef';
import { embedTemplate } from '../../utils/embedTemplate';
import { startLog } from '../../utils/startLog';
// import fs from 'fs/promises'; // eslint-disable-line
const F = f(__filename);
// import drugDataAll from '../../../global/assets/data/drug_db_combined.json';
// const drugNames = drugDataAll.map((d) => d.name);
type ResultsObject = {
  total: string[]
  passed:string[]
  failed:string[]
};

// These commands are not meant to be tested
const manualCommands = [ // eslint-disable-line
  'clearchat', // This would wipe out the results of the test
  'issue', // This is a simple API that will submit a github issue to production
  'moderate',
  'modmail',
  'setup', // This needs to be manually tested
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
const jestCommands = [ // eslint-disable-line
  'about',
  'botstats',
  'breathe',
  'calc_benzo',
  'calc_dxm',
  'calc_ketamine',
  'coinflip',
  'combo',
  'combochart',
  'contact',
  'convert',
  'donate',
  'drug',
  'ems',
  'grounding',
  'hydrate',
  'invite',
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
  'calc_psychedelics',
  'dramacounter',
  'experience',
  'h2flow',
  'help',
  'idose',
  'imdb',
  'imgur',
  'joke',
  'karma',
  'kipp',
  'last',
  'leaderboard',
  'poll',
  'profile',
  'remindMe',
  'reminder',
  'say',
  'timezone',
  // 'tripsitmode', // WIP
  'urban_define',
  // 'youtube', // WIP
];

/**
 * @param {number} ms
 * @return {Promise<void>}
 */
export function sleep(ms:number):Promise<void> {
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
    discordClient: interaction.client,
    guild: interaction.guild,
    user: interaction.user,
    member: interaction.member,
    channel: interaction.channel,
    reply: (content:string) => interaction.followUp(content),
    editReply: (content:string) => interaction.followUp(content),
    followUp: (content:string) => interaction.followUp(content),
    deferReply: () => {},
  };

  // log.debug(F, `Running command: ${name}`);

  if (!testableCommands.includes(commandName)) return null;

  // log.debug(F, `in channel: ${(interaction.channel as TextChannel).name}`);

  if (!interaction.channel) return null;

  await sleep(2000);

  await interaction.channel.send(`> **${commandName}** - Initializing test!`);

  const command = await interaction.client.commands.get(commandName);
  if (command) {
    // if (name === 'template') {
    //   testInteraction.options = {
    //     getString: (name:string) => {
    //       if (name === 'name') return 'value';
    //     },
    //     getNumber: (name:string) => {
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
        getBoolean: (name:string) => {
          if (name === 'ephemeral') return true;
          return null;
        },
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
      await sleep(2000);

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
        getBoolean: (name:string) => {
          if (name === 'ephemeral') return true;
          return null;
        },
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
      await sleep(2000);

      // Get the new birthday
      await interaction.channel.send(`> **${commandName}** - Getting new birthdate (Should be ${monthName} ${day})`);
      testInteraction.options = {
        getBoolean: (name:string) => {
          if (name === 'ephemeral') return true;
          return null;
        },
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
        getBoolean: (name:string) => {
          if (name === 'ephemeral') return true;
          return null;
        },
        getString: (name:string) => {
          if (name === 'exercise') return '1';
          return null;
        },
      };
      await command.execute(testInteraction);
      await sleep(2000);
      testInteraction.options = {
        getBoolean: (name:string) => {
          if (name === 'ephemeral') return true;
          return null;
        },
        getString: (name:string) => {
          if (name === 'exercise') return '2';
          return null;
        },
      };
      await command.execute(testInteraction);
      await sleep(2000);
      testInteraction.options = {
        getBoolean: (name:string) => {
          if (name === 'ephemeral') return true;
          return null;
        },
        getString: (name:string) => {
          if (name === 'exercise') return '3';
          return null;
        },
      };
      await command.execute(testInteraction);
      await sleep(2000);
      testInteraction.options = {
        getBoolean: (name:string) => {
          if (name === 'ephemeral') return true;
          return null;
        },
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
        getBoolean: (name:string) => {
          if (name === 'ephemeral') return true;
          return null;
        },
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
        getBoolean: (name:string) => {
          if (name === 'ephemeral') return true;
          return null;
        },
        getString: (name:string) => {
          if (name === 'units') return 'lbs';
          if (name === 'taking') return 'RoboTablets (30 mg tablets)';
          return null;
        },
        getNumber: (name:string) => {
          if (name === 'calc_weight') return '200';
          return null;
        },
      };
      await command.execute(testInteraction);
      return true;
    }
    if (commandName === 'calc_ketamine') {
      testInteraction.options = {
        getBoolean: (name:string) => {
          if (name === 'ephemeral') return true;
          return null;
        },
        getString: (name:string) => {
          if (name === 'units') return 'lbs';
          return null;
        },
        getNumber: (name:string) => {
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
        getBoolean: (name:string) => {
          if (name === 'ephemeral') return true;
          return null;
        },
        getNumber: (name:string) => {
          if (name === 'last_dose') return 2;
          if (name === 'desired_dose') return 4;
          if (name === 'days') return 4;
          return null;
        },
        getSubcommand: () => 'mushrooms',
      };
      await command.execute(testInteraction);
      await sleep(2000);
      testInteraction.options = {
        getBoolean: (name:string) => {
          if (name === 'ephemeral') return true;
          return null;
        },
        getNumber: (name:string) => {
          if (name === 'last_dose') return 2;
          if (name === 'desired_dose') return null;
          if (name === 'days') return 4;
          return null;
        },
        getSubcommand: () => 'mushrooms',
      };
      await command.execute(testInteraction);
      await sleep(2000);
      testInteraction.options = {
        getBoolean: (name:string) => {
          if (name === 'ephemeral') return true;
          return null;
        },
        getNumber: (name:string) => {
          if (name === 'last_dose') return 200;
          if (name === 'desired_dose') return 400;
          if (name === 'days') return 4;
          return null;
        },
        getSubcommand: () => 'lsd',
      };
      await command.execute(testInteraction);
      await sleep(2000);
      testInteraction.options = {
        getBoolean: (name:string) => {
          if (name === 'ephemeral') return true;
          return null;
        },
        getNumber: (name:string) => {
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
        getBoolean: (name:string) => {
          if (name === 'ephemeral') return true;
          return null;
        },
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
        getBoolean: (name:string) => {
          if (name === 'ephemeral') return true;
          return null;
        },
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
        getBoolean: (name:string) => {
          if (name === 'ephemeral') return true;
          return null;
        },
        getString: (name:string) => {
          if (name === 'dramatime') return '';
          if (name === 'dramaissue') return '';
          return null;
        },
        getSubcommand: () => 'get',
      };
      await command.execute(testInteraction);
      await sleep(2000);

      // Get random value 1-10
      const randomValue = Math.floor(Math.random() * 10) + 1;
      // Test getting the existing drama
      await interaction.channel.send(
        `> **${commandName}** - Setting new value: 'Testing ${randomValue} - ${randomValue} hours ago`,
      );
      testInteraction.options = {
        getBoolean: (name:string) => {
          if (name === 'ephemeral') return true;
          return null;
        },
        getString: (name:string) => {
          if (name === 'dramatime') return `${randomValue} hours ago`;
          if (name === 'dramaissue') return `Testing ${randomValue}`;
          return null;
        },
        getSubcommand: () => 'set',
      };
      await command.execute(testInteraction);
      await sleep(2000);

      // Test getting the existing drama
      await interaction.channel.send(`> **${commandName}** - Get new record, should be the same as above`);
      testInteraction.options = {
        getBoolean: (name:string) => {
          if (name === 'ephemeral') return true;
          return null;
        },
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
        getBoolean: (name:string) => {
          if (name === 'ephemeral') return true;
          return null;
        },
        getString: (name:string) => {
          if (name === 'substance') return 'DXM';
          return null;
        },
      };
      await command.execute(testInteraction);
      return true;
    }
    if (commandName === 'experience') {
      testInteraction.options = {
        getBoolean: (name:string) => {
          if (name === 'ephemeral') return true;
          return null;
        },
        getMember: () => interaction.member,
      };
      await command.execute(testInteraction);
      return true;
    }
    if (commandName === 'idose') {
      // Test getting a record
      await interaction.channel.send(`> **${commandName}** - Getting existing record`);
      const duration = '23 mins ago';
      testInteraction.options = {
        getBoolean: (name:string) => {
          if (name === 'ephemeral') return true;
          return null;
        },
        getString: (name:string) => {
          if (name === 'substance') return 'Cannabis';
          if (name === 'units') return 'G';
          if (name === 'roa') return 'RECTAL';
          if (name === 'offset') return duration;
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
      await sleep(2000);

      // Set a dose
      await interaction.channel.send(`> **${commandName}** - Setting record`);
      testInteraction.options = {
        getBoolean: (name:string) => {
          if (name === 'ephemeral') return true;
          return null;
        },
        getString: (name:string) => {
          if (name === 'substance') return 'Cannabis';
          if (name === 'units') return 'G';
          if (name === 'roa') return 'RECTAL';
          if (name === 'offset') return duration;
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
      await sleep(2000);

      // Get history
      await interaction.channel.send(`> **${commandName}** - Get records`);
      testInteraction.options = {
        getBoolean: (name:string) => {
          if (name === 'ephemeral') return true;
          return null;
        },
        getString: (name:string) => {
          if (name === 'substance') return 'Cannabis';
          if (name === 'units') return 'G';
          if (name === 'roa') return 'RECTAL';
          if (name === 'offset') return duration;
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
      await sleep(2000);

      // Delete record
      await interaction.channel.send(`> **${commandName}** - Deleting record`);
      testInteraction.options = {
        getBoolean: (name:string) => {
          if (name === 'ephemeral') return true;
          return null;
        },
        getString: (name:string) => {
          if (name === 'substance') return 'Cannabis';
          if (name === 'units') return 'G';
          if (name === 'roa') return 'RECTAL';
          if (name === 'offset') return duration;
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
      await sleep(2000);

      // Get history
      await interaction.channel.send(`> **${commandName}** - Get records`);
      testInteraction.options = {
        getBoolean: (name:string) => {
          if (name === 'ephemeral') return true;
          return null;
        },
        getString: (name:string) => {
          if (name === 'substance') return 'Cannabis';
          if (name === 'units') return 'G';
          if (name === 'roa') return 'RECTAL';
          if (name === 'offset') return duration;
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
        getBoolean: (name:string) => {
          if (name === 'ephemeral') return true;
          return null;
        },
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
        getBoolean: (name:string) => {
          if (name === 'ephemeral') return true;
          return null;
        },
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
        getBoolean: (name:string) => {
          if (name === 'ephemeral') return true;
          return null;
        },
        getMember: () => interaction.member,
      };
      await command.execute(testInteraction);
      return true;
    }
    if (commandName === 'last') {
      testInteraction.options = {
        getBoolean: (name:string) => {
          if (name === 'ephemeral') return true;
          return null;
        },
        getMember: () => interaction.member,
      };
      await command.execute(testInteraction);
      return true;
    }
    if (commandName === 'leaderboard') {
      testInteraction.options = {
        getBoolean: (name:string) => {
          if (name === 'ephemeral') return true;
          return null;
        },
        getString: (name:string) => {
          if (name === 'category') return 'OVERALL';
          return null;
        },
      };
      await command.execute(testInteraction);
      sleep(2000);

      testInteraction.options = {
        getBoolean: (name:string) => {
          if (name === 'ephemeral') return true;
          return null;
        },
        getString: (name:string) => {
          if (name === 'category') return 'TOTAL';
          return null;
        },
      };
      await command.execute(testInteraction);
      sleep(2000);

      testInteraction.options = {
        getBoolean: (name:string) => {
          if (name === 'ephemeral') return true;
          return null;
        },
        getString: (name:string) => {
          if (name === 'category') return 'GENERAL';
          return null;
        },
      };
      await command.execute(testInteraction);
      sleep(2000);

      testInteraction.options = {
        getBoolean: (name:string) => {
          if (name === 'ephemeral') return true;
          return null;
        },
        getString: (name:string) => {
          if (name === 'category') return 'TRIPSITTER';
          return null;
        },
      };
      await command.execute(testInteraction);
      sleep(2000);

      testInteraction.options = {
        getBoolean: (name:string) => {
          if (name === 'ephemeral') return true;
          return null;
        },
        getString: (name:string) => {
          if (name === 'category') return 'DEVELOPER';
          return null;
        },
      };
      await command.execute(testInteraction);
      sleep(2000);

      testInteraction.options = {
        getBoolean: (name:string) => {
          if (name === 'ephemeral') return true;
          return null;
        },
        getString: (name:string) => {
          if (name === 'category') return 'TEAM';
          return null;
        },
      };
      await command.execute(testInteraction);
      sleep(2000);

      testInteraction.options = {
        getBoolean: (name:string) => {
          if (name === 'ephemeral') return true;
          return null;
        },
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
        getBoolean: (name:string) => {
          if (name === 'ephemeral') return true;
          return null;
        },
        getString: (name:string) => {
          if (name === 'question') return 'Is TripBot Awesome?';
          if (name === 'choices') return 'Yes,Also Yes,No...but yes';
          return null;
        },
      };
      await command.execute(testInteraction);
      return true;
    }
    if (commandName === 'privacy') {
      // get
      await interaction.channel.send(`> **${commandName}** - Get`);
      testInteraction.options = {
        getBoolean: (name:string) => {
          if (name === 'ephemeral') return true;
          return null;
        },
        getMember: async (name:string) => {
          if (name === 'user') return interaction.member;
          return null;
        },
        getSubcommand: () => 'get',
      };
      await command.execute(testInteraction);
      // await sleep(2000);

      // delete
      await interaction.channel.send(`> **${commandName}** - Delete`);
      testInteraction.options = {
        getBoolean: (name:string) => {
          if (name === 'ephemeral') return true;
          return null;
        },
        getMember: async (name:string) => {
          if (name === 'user') return interaction.member;
          return null;
        },
        getSubcommand: () => 'delete',
      };
      await command.execute(testInteraction);
      return true;
    }
    if (commandName === 'profile') {
      testInteraction.options = {
        getBoolean: (name:string) => {
          if (name === 'ephemeral') return true;
          return null;
        },
        getMember: () => interaction.member,
      };
      await command.execute(testInteraction);
      return true;
    }
    if (commandName === 'remindMe') {
      // Get existing reminders
      await interaction.channel.send(`> **${commandName}** - Getting existing record`);
      const reminderA = 'Test reminder A';
      testInteraction.options = {
        getBoolean: (name:string) => {
          if (name === 'ephemeral') return true;
          return null;
        },
        getString: (name:string) => {
          if (name === 'offset') return '2 mins';
          if (name === 'reminder') return reminderA;
          return null;
        },
        getNumber: (name:string) => {
          if (name === 'record') return 0;
          return null;
        },
        getSubcommand: () => 'get',
      };
      await command.execute(testInteraction);
      await sleep(2000);

      // Set a dose
      await interaction.channel.send(`> **${commandName}** - Setting record`);
      testInteraction.options = {
        getBoolean: (name:string) => {
          if (name === 'ephemeral') return true;
          return null;
        },
        getString: (name:string) => {
          if (name === 'offset') return '2 mins';
          if (name === 'reminder') return reminderA;
          return null;
        },
        getNumber: (name:string) => {
          if (name === 'record') return 0;
          return null;
        },
        getSubcommand: () => 'set',
      };
      await command.execute(testInteraction);
      await sleep(2000);

      // Set a dose
      await interaction.channel.send(`> **${commandName}** - Setting record`);
      testInteraction.options = {
        getBoolean: (name:string) => {
          if (name === 'ephemeral') return true;
          return null;
        },
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
      await sleep(2000);

      // Get history
      await interaction.channel.send(`> **${commandName}** - Get records`);
      testInteraction.options = {
        getBoolean: (name:string) => {
          if (name === 'ephemeral') return true;
          return null;
        },
        getString: (name:string) => {
          if (name === 'offset') return '2 mins';
          if (name === 'reminder') return reminderA;
          return null;
        },
        getNumber: (name:string) => {
          if (name === 'record') return 0;
          return null;
        },
        getSubcommand: () => 'get',
      };
      await command.execute(testInteraction);
      await sleep(2000);

      // Delete record
      await interaction.channel.send(`> **${commandName}** - Deleting record`);
      testInteraction.options = {
        getBoolean: (name:string) => {
          if (name === 'ephemeral') return true;
          return null;
        },
        getString: (name:string) => {
          if (name === 'offset') return '2 mins';
          if (name === 'reminder') return reminderA;
          return null;
        },
        getNumber: (name:string) => {
          if (name === 'record') return 0;
          return null;
        },
        getSubcommand: () => 'delete',
      };
      await command.execute(testInteraction);
      await sleep(2000);

      // Get history
      await interaction.channel.send(`> **${commandName}** - Get records`);
      testInteraction.options = {
        getBoolean: (name:string) => {
          if (name === 'ephemeral') return true;
          return null;
        },
        getString: (name:string) => {
          if (name === 'offset') return '2 mins';
          if (name === 'reminder') return reminderA;
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
      testInteraction.options = {
        getBoolean: (name:string) => {
          if (name === 'ephemeral') return true;
          return null;
        },
      };

      await command.execute(testInteraction);
      sleep(2000);

      // testInteraction.channel = await interaction.guild?.channels.fetch(env.CHANNEL_GENERAL) as TextChannel;
      // await command.execute(testInteraction);
      // sleep(2000);

      testInteraction.channel = await interaction.guild?.channels.fetch(env.CHANNEL_SANCTUARY) as TextChannel;
      await command.execute(testInteraction);
      return true;
    }
    if (commandName === 'say') {
      testInteraction.options = {
        getBoolean: (name:string) => {
          if (name === 'ephemeral') return true;
          return null;
        },
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
        getBoolean: (name:string) => {
          if (name === 'ephemeral') return true;
          return null;
        },
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
      await sleep(2000);

      // Set the record
      await interaction.channel.send(`> **${commandName}** - Setting new timezone to 'America/Chicago'`);
      testInteraction.options = {
        getBoolean: (name:string) => {
          if (name === 'ephemeral') return true;
          return null;
        },
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
      await sleep(2000);

      // Get the new record
      await interaction.channel.send(`> **${commandName}** - Getting new record (Should be same as above)`);
      testInteraction.options = {
        getBoolean: (name:string) => {
          if (name === 'ephemeral') return true;
          return null;
        },
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
        getBoolean: (name:string) => {
          if (name === 'ephemeral') return true;
          return null;
        },
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
      await sleep(2000);

      // Get the new record
      await interaction.channel.send(`> **${commandName}** - Getting new record (Should be same as above)`);
      testInteraction.options = {
        getBoolean: (name:string) => {
          if (name === 'ephemeral') return true;
          return null;
        },
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
        getBoolean: (name:string) => {
          if (name === 'ephemeral') return true;
          return null;
        },
        getString: (name:string) => {
          if (name === 'toy') return '25';
          return null;
        },
      };
      await command.execute(testInteraction);
      return true;
    }
    // if (commandName === 'tripsitmode') {
    //   // Turn on
    //   await interaction.channel.send(`> **${commandName}** - Turn on`);
    //   const target = await interaction.guild?.members.fetch('332687787172167680');
    //   testInteraction.options = {
    //     getMember: async (name:string) => {
    //     // log.debug(F, `target: ${JSON.stringify(target, null, 2)}`);
    //       if (name === 'user') return target;
    //       return null;
    //     },
    //     getSubcommand: () => 'on',
    //   };
    //   await command.execute(testInteraction);
    //   // await sleep(2000);

    //   // // Turn off
    //   // await interaction.channel.send(`> **${commandName}** - Turn off`);
    //   // testInteraction.options = {
    //   //   getMember: async (name:string) => {
    //   //     const target = await interaction.guild?.members.fetch('332687787172167680');
    //   //     if (name === 'user') return target;
    //   //     return null;
    //   //   },
    //   //   getSubcommand: () => 'off',
    //   // };
    //   // await command.execute(testInteraction);
    //   return true;
    // }
    if (commandName === 'urban_define') {
      testInteraction.options = {
        getBoolean: (name:string) => {
          if (name === 'ephemeral') return true;
          return null;
        },
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
        getBoolean: (name:string) => {
          if (name === 'ephemeral') return true;
          return null;
        },
        getString: (name:string) => {
          if (name === 'search') return 'TripSit find the others';
          return null;
        },
      };
      await command.execute(testInteraction);
      return true;
    }

    testInteraction.options = {
      getBoolean: (name:string) => {
        if (name === 'ephemeral') return true;
        return null;
      },
    };

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
    await discordClient.application?.commands.fetch({ force: true })
      .then(async globalCommands => {
        await interaction.followUp(`> Testing ${globalCommands.size} global commands!`);
        for (const command of globalCommands) { // eslint-disable-line no-restricted-syntax
          // log.debug(F, `Testing global command ${command[1].name}`);
          await runCommand(interaction, command[1].name) // eslint-disable-line no-await-in-loop
            .then(result => {
              if (result === true) {
                // log.debug(F, `Global command ${command[1].name} passed!`);
                results.total.push(command[1].name);
                results.passed.push(command[1].name);
              } else if (result === false) {
                // log.debug(F, `Global command ${command[1].name} failed!`);
                results.total.push(command[1].name);
                results.failed.push(command[1].name);
              } else if (result === null) {
                // log.debug(F, `Global command ${command[1].name} was not tested!`);
              }
            });
        }
      });
    // .finally(() => {
    //   // log.debug(F, `Global commands results: ${JSON.stringify(results)}`);
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
      for (const command of guildCommands) { // eslint-disable-line no-restricted-syntax
        // log.debug(F, `Testing guild command ${command[1].name}`);
        await runCommand(interaction, command[1].name) // eslint-disable-line no-await-in-loop
          .then(result => {
            if (result === true) {
              // log.debug(F, `Global command ${command[1].name} passed!`);
              results.total.push(command[1].name);
              results.passed.push(command[1].name);
            } else if (result === false) {
              // log.debug(F, `Global command ${command[1].name} failed!`);
              results.total.push(command[1].name);
              results.failed.push(command[1].name);
            } else if (result === null) {
              // log.debug(F, `Global command ${command[1].name} was not tested!`);

            }
          });
      }
    });
  return results;
}

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
    startLog(F, interaction);
    await interaction.deferReply({ ephemeral: (interaction.options.getBoolean('ephemeral') === true) });
    if (!interaction.channel) {
      await interaction.editReply('This command must be used in a channel!');
      return false;
    }
    // const scope = interaction.options.getString('scope') || 'All';
    await interaction.editReply('Testing commands!');

    const results = {
      total: [] as string[],
      passed: [] as string[],
      failed: [] as string[],
    };

    await testGlobal(interaction, results)
      .then(async globalResults => {
        // log.debug(F, `Global results: ${JSON.stringify(globalResults)}`);
        await testGuild(interaction, globalResults)
          .then(async guildResults => {
            if (!interaction.channel) {
              await interaction.editReply('This command must be used in a channel!');
              return false;
            }
            // log.debug(F, `Guild results: ${JSON.stringify(guildResults)}`);
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

export default dBottest;
