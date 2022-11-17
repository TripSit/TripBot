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
import {SlashCommand} from '../../@types/commandDef';
import {embedTemplate} from '../../utils/embedTemplate';
import {startLog} from '../../utils/startLog';
import env from '../../../global/utils/env.config';
// import fs from 'fs/promises';
import log from '../../../global/utils/log'; // eslint-disable-line
import {parse} from 'path';
const PREFIX = parse(__filename).name;
// import drugDataAll from '../../../global/assets/data/drug_db_combined.json';
// const drugNames = drugDataAll.map((d) => d.name);
type resultsObject = {
  total: string[]
  passed:string[]
  failed:string[]
}


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

export const testSuite: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('bottest')
    .setDescription('This will test the bot and show all functionality!')
    .addStringOption(option => option.setName('scope')
      .setDescription('Global, guild, or all?')
      .addChoices(
        {name: 'All', value: 'All'},
        {name: 'Guild', value: 'Guild'},
        {name: 'Global', value: 'Global'},
      )),
  async execute(interaction) {
    startLog(PREFIX, interaction);
    if (!interaction.channel) {
      await interaction.reply('This command must be used in a channel!');
      return false;
    };
    // const scope = interaction.options.getString('scope') || 'All';
    await interaction.reply(`Testing commands!`);

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
            };
            // log.debug(`[${PREFIX}] Guild results: ${JSON.stringify(guildResults)}`);
            const embed = embedTemplate()
              .setTitle('Testing Results')
              .setDescription(`${guildResults.failed.length > 0 ?
                `The following commands failed testing: ${guildResults.failed.join(', ')}` :
                `All commands passed testing!`}`)
              .addFields(
                {name: 'Tested', value: `${guildResults.total.length}`, inline: true},
                {name: 'Success', value: `${guildResults.passed.length}`, inline: true},
                {name: 'Failed', value: `${guildResults.failed.length}`, inline: true},
              );
            await interaction.channel.send({embeds: [embed]});
          });
      });
    return true;
  },
};

/**
 *
 * @param {ChatInputCommandInteraction} interaction
 * @param {resultsObject} results
 */
async function testGlobal(
  interaction:ChatInputCommandInteraction,
  results: resultsObject,
):Promise<resultsObject> {
  const scope = interaction.options.getString('scope') || 'All';
  if (scope === 'All' || scope === 'Global') {
    await client.application?.commands.fetch({force: true})
      .then(async globalCommands => {
        await interaction.followUp(`> Testing ${globalCommands.size} global commands!`);
        for (const command of globalCommands) {
          // log.debug(`[${PREFIX}] Testing global command ${command[1].name}`);
          await runCommand(interaction, command[1].name)
            .then(result => {
              if (result === true) {
                // log.debug(`[${PREFIX}] Global command ${command[1].name} passed!`);
                results.total.push(command[1].name);
                results.passed.push(command[1].name);
              } else if (result === false) {
                // log.debug(`[${PREFIX}] Global command ${command[1].name} failed!`);
                results.total.push(command[1].name);
                results.failed.push(command[1].name);
              } else if (result === null) {
                // log.debug(`[${PREFIX}] Global command ${command[1].name} was not tested!`);
                return;
              };
            });
        };
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
 * @param {resultsObject} results
 */
async function testGuild(
  interaction:ChatInputCommandInteraction,
  results: resultsObject,
):Promise<resultsObject> {
  if (!interaction.guild) {
    await interaction.followUp(`> You must be in a guild to test guild commands!`);
    return results;
  }
  await interaction.guild.commands.fetch({force: true})
    .then(async guildCommands => {
      await interaction.followUp(`> Testing ${guildCommands.size} guild commands!`);
      for (const command of guildCommands) {
        // log.debug(`[${PREFIX}] Testing guild command ${command[1].name}`);
        await runCommand(interaction, command[1].name)
          .then(result => {
            if (result === true) {
              // log.debug(`[${PREFIX}] Global command ${command[1].name} passed!`);
              results.total.push(command[1].name);
              results.passed.push(command[1].name);
            } else if (result === false) {
              // log.debug(`[${PREFIX}] Global command ${command[1].name} failed!`);
              results.total.push(command[1].name);
              results.failed.push(command[1].name);
            } else if (result === null) {
              // log.debug(`[${PREFIX}] Global command ${command[1].name} was not tested!`);
              return;
            };
          });
      };
    });
  return results;
}


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
async function runCommand(interaction:ChatInputCommandInteraction, name:string):Promise<boolean | null> {
  const testInteraction = {
    options: {},
    client: interaction.client,
    guild: interaction.guild,
    user: interaction.user,
    member: interaction.member,
    channel: interaction.channel,
    reply: (content:string) => {
      return interaction.followUp(content);
    },
    editReply: (content:string) => {
      return interaction.followUp(content);
    },
    deferReply: () => {
      return;
    },
  };

  // log.debug(`[${PREFIX}] Running command: ${name}`);

  if (!testableCommands.includes(name) && !replyCommands.includes(name) ) return null;

  // log.debug(`[${PREFIX}] in channel: ${(interaction.channel as TextChannel).name}`);

  if (!interaction.channel) return null;

  await sleep(1000);

  await interaction.channel.send(`> **${name}** - Initializing test!`);

  const command = await interaction.client.commands.get(name);
  if (command) {
    // if (name == 'template') {
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
    if (name == 'birthday') {
      // Test getting a blank birthday
      await interaction.channel.send(`> **${name}** - Getting existing record`);
      testInteraction.options = {
        getString: (name:string) => {
          if (name === 'month') return 'June';
        },
        getInteger: (name:string) => {
          if (name === 'day') return 3;
        },
        getMember: (name:string) => {
          if (name === 'user') return interaction.member;
        },
        getSubcommand: () => {
          return 'get';
        },
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
      await interaction.channel.send(`> **${name}** - Setting new birthdate to ${monthName} ${day}`);
      testInteraction.options = {
        getString: (name:string) => {
          if (name === 'month') return monthName;
        },
        getInteger: (name:string) => {
          if (name === 'day') return day;
        },
        getMember: (name:string) => {
          if (name === 'user') return interaction.member;
        },
        getSubcommand: () => {
          return 'set';
        },
      };
      await command.execute(testInteraction);
      await sleep(1000);

      // Get the new birthday
      await interaction.channel.send(`> **${name}** - Getting new birthdate (Should be ${monthName} ${day})`);
      testInteraction.options = {
        getString: (name:string) => {
          if (name === 'month') return 'june';
        },
        getInteger: (name:string) => {
          if (name === 'day') return 3;
        },
        getMember: (name:string) => {
          if (name === 'user') return interaction.member;
        },
        getSubcommand: () => {
          return 'get';
        },
      };
      return await command.execute(testInteraction);
    }
    if (name == 'bug') {
      return false;
    }
    if (name == 'breathe') {
      testInteraction.options = {
        getString: (name:string) => {
          if (name === 'exercise') {
            return '1';
          }
        },
      };
      await command.execute(testInteraction);
      await sleep(1000);
      testInteraction.options = {
        getString: (name:string) => {
          if (name === 'exercise') {
            return '2';
          }
        },
      };
      await command.execute(testInteraction);
      await sleep(1000);
      testInteraction.options = {
        getString: (name:string) => {
          if (name === 'exercise') {
            return '3';
          }
        },
      };
      await command.execute(testInteraction);
      await sleep(1000);
      testInteraction.options = {
        getString: (name:string) => {
          if (name === 'exercise') {
            return '4';
          }
        },
      };
      return await command.execute(testInteraction);
    }
    if (name == 'calc_benzo') {
      // await command.execute(interaction, ['10', 'alprazolam', 'ativan']);
      testInteraction.options = {
        getString: (name:string) => {
          if (name === 'mg_of') {
            return 'clorazepate';
          }
          if (name === 'and_i_want_the_dose_of') {
            return 'flubromazepam';
          }
        },
        getNumber: (name:string) => {
          if (name === 'i_have') {
            return '14.5';
          }
        },
      };
      return await command.execute(testInteraction);
    }
    if (name == 'calc_dxm') {
      testInteraction.options = {
        getString: (name:string) => {
          if (name === 'units') {
            return 'lbs';
          }
          if (name === 'taking') {
            return 'RoboTablets (30 mg tablets)';
          }
        },
        getInteger: (name:string) => {
          if (name === 'calc_weight') {
            return '200';
          }
        },
      };
      return await command.execute(testInteraction);
    }
    if (name == 'calc_ketamine') {
      testInteraction.options = {
        getString: (name:string) => {
          if (name === 'units') {
            return 'lbs';
          }
        },
        getInteger: (name:string) => {
          if (name === 'weight') {
            return '200';
          }
        },
      };
      return await command.execute(testInteraction);
    }
    if (name == 'calc_psychedelics') {
      // await command.execute(interaction, ['200', '', '4', 'lsd']);
      testInteraction.options = {
        getInteger: (name:string) => {
          if (name === 'last_dose') {
            return 2;
          }
          if (name === 'desired_dose') {
            return 4;
          }
          if (name === 'days') {
            return 4;
          }
        },
        getSubcommand: () => {
          return 'mushrooms';
        },
      };
      await command.execute(testInteraction);
      await sleep(1000);
      testInteraction.options = {
        getInteger: (name:string) => {
          if (name === 'last_dose') {
            return 2;
          }
          if (name === 'desired_dose') {
            return null;
          }
          if (name === 'days') {
            return 4;
          }
        },
        getSubcommand: (name:string) => {
          return 'mushrooms';
        },
      };
      await command.execute(testInteraction);
      await sleep(1000);
      testInteraction.options = {
        getInteger: (name:string) => {
          if (name === 'last_dose') {
            return 200;
          }
          if (name === 'desired_dose') {
            return 400;
          }
          if (name === 'days') {
            return 4;
          }
        },
        getSubcommand: (name:string) => {
          return 'lsd';
        },
      };
      await command.execute(testInteraction);
      await sleep(1000);
      testInteraction.options = {
        getInteger: (name:string) => {
          if (name === 'last_dose') {
            return 200;
          }
          if (name === 'desired_dose') {
            return null;
          }
          if (name === 'days') {
            return 4;
          }
        },
        getSubcommand: (name:string) => {
          return 'lsd';
        },
      };
      return await command.execute(testInteraction);
    }
    if (name == 'combo') {
      testInteraction.options = {
        getString: (name:string) => {
          if (name === 'first_drug') {
            return 'DXM';
          }
          if (name === 'second_drug') {
            return 'MDMA';
          }
        },
      };
      return await command.execute(testInteraction);
    }
    if (name == 'convert') {
      testInteraction.options = {
        getString: (name:string) => {
          if (name === 'units') {
            return 'km';
          }
          if (name === 'into_units') {
            return 'mi';
          }
        },
        getNumber: (name:string) => {
          if (name === 'value') {
            return 14.56;
          }
        },
      };
      return await command.execute(testInteraction);
    }
    if (name == 'dramacounter') {
      // Test getting the existing drama
      await interaction.channel.send(`> **${name}** - Getting existing record`);
      testInteraction.options = {
        getString: (name:string) => {
          if (name === 'dramatime') return ``;
          if (name === 'dramaissue') return ``;
        },
        getSubcommand: () => {
          return 'get';
        },
      };
      await command.execute(testInteraction);
      await sleep(1000);

      // Get random value 1-10
      const randomValue = Math.floor(Math.random() * 10) + 1;
      // Test getting the existing drama
      await interaction.channel.send(
        `> **${name}** - Setting new value: 'Testing ${randomValue} - ${randomValue} hours ago`);
      testInteraction.options = {
        getString: (name:string) => {
          if (name === 'dramatime') return `${randomValue} hours ago`;
          if (name === 'dramaissue') return `Testing ${randomValue}`;
        },
        getSubcommand: () => {
          return 'set';
        },
      };
      await command.execute(testInteraction);
      await sleep(1000);

      // Test getting the existing drama
      await interaction.channel.send(`> **${name}** - Get new record, should be the same as above`);
      testInteraction.options = {
        getString: (name:string) => {
          if (name === 'dramatime') return ``;
          if (name === 'dramaissue') return ``;
        },
        getSubcommand: () => {
          return 'get';
        },
      };
      return await command.execute(testInteraction);
    }
    if (name == 'drug') {
      testInteraction.options = {
        getString: (name:string) => {
          if (name === 'substance') {
            return 'DXM';
          }
        },
      };
      return await command.execute(testInteraction);
    }
    if (name == 'idose') {
      // Test getting a record
      await interaction.channel.send(`> **${name}** - Getting existing record`);
      testInteraction.options = {
        getString: (name:string) => {
          if (name === 'substance') return 'Cannabis';
          if (name === 'units') return 'G';
          if (name === 'roa') return 'RECTAL';
          if (name === 'offset') return '23 mins ago';
        },
        getNumber: (name:string) => {
          if (name === 'volume') return 10;
          if (name === 'record') return 0;
        },
        getSubcommand: () => {
          return 'get';
        },
      };
      await command.execute(testInteraction);
      await sleep(1000);

      // Set a dose
      await interaction.channel.send(`> **${name}** - Setting record`);
      testInteraction.options = {
        getString: (name:string) => {
          if (name === 'substance') return 'Cannabis';
          if (name === 'units') return 'G';
          if (name === 'roa') return 'RECTAL';
          if (name === 'offset') return '23 mins ago';
        },
        getNumber: (name:string) => {
          if (name === 'volume') return 10;
          if (name === 'record') return 0;
        },
        getSubcommand: () => {
          return 'set';
        },
      };
      await command.execute(testInteraction);
      await sleep(1000);

      // Get history
      await interaction.channel.send(`> **${name}** - Get records`);
      testInteraction.options = {
        getString: (name:string) => {
          if (name === 'substance') return 'Cannabis';
          if (name === 'units') return 'G';
          if (name === 'roa') return 'RECTAL';
          if (name === 'offset') return '23 mins ago';
        },
        getNumber: (name:string) => {
          if (name === 'volume') return 10;
          if (name === 'record') return 0;
        },
        getSubcommand: () => {
          return 'get';
        },
      };
      await command.execute(testInteraction);
      await sleep(1000);

      // Delete record
      await interaction.channel.send(`> **${name}** - Deleting record`);
      testInteraction.options = {
        getString: (name:string) => {
          if (name === 'substance') return 'Cannabis';
          if (name === 'units') return 'G';
          if (name === 'roa') return 'RECTAL';
          if (name === 'offset') return '23 mins ago';
        },
        getNumber: (name:string) => {
          if (name === 'volume') return 10;
          if (name === 'record') return 0;
        },
        getSubcommand: () => {
          return 'delete';
        },
      };
      await command.execute(testInteraction);
      await sleep(1000);

      // Get history
      await interaction.channel.send(`> **${name}** - Get records`);
      testInteraction.options = {
        getString: (name:string) => {
          if (name === 'substance') return 'Cannabis';
          if (name === 'units') return 'G';
          if (name === 'roa') return 'RECTAL';
          if (name === 'offset') return '23 mins ago';
        },
        getNumber: (name:string) => {
          if (name === 'volume') return 10;
          if (name === 'record') return 0;
        },
        getSubcommand: () => {
          return 'get';
        },
      };
      return await command.execute(testInteraction);
    }
    if (name == 'imdb') {
      testInteraction.options = {
        getString: (name:string) => {
          if (name === 'title') return 'Jurrassic Park';
        },
      };
      return await command.execute(testInteraction);
    }
    if (name == 'imgur') {
      testInteraction.options = {
        getString: (name:string) => {
          if (name === 'search') return 'Puppies';
        },
      };
      return await command.execute(testInteraction);
    }
    if (name == 'karma') {
      testInteraction.options = {
        getMember: (name:string) => {
          return interaction.member;
        },
      };
      return await command.execute(testInteraction);
    }
    if (name == 'leaderboard') {
      testInteraction.options = {
        getString: (name:string) => {
          if (name === 'category') return 'OVERALL';
        },
      };
      await command.execute(testInteraction);
      sleep(1000);

      testInteraction.options = {
        getString: (name:string) => {
          if (name === 'category') return 'TOTAL';
        },
      };
      await command.execute(testInteraction);
      sleep(1000);

      testInteraction.options = {
        getString: (name:string) => {
          if (name === 'category') return 'GENERAL';
        },
      };
      await command.execute(testInteraction);
      sleep(1000);

      testInteraction.options = {
        getString: (name:string) => {
          if (name === 'category') return 'TRIPSITTER';
        },
      };
      await command.execute(testInteraction);
      sleep(1000);

      testInteraction.options = {
        getString: (name:string) => {
          if (name === 'category') return 'DEVELOPER';
        },
      };
      await command.execute(testInteraction);
      sleep(1000);

      testInteraction.options = {
        getString: (name:string) => {
          if (name === 'category') return 'TEAM';
        },
      };
      await command.execute(testInteraction);
      sleep(1000);

      testInteraction.options = {
        getString: (name:string) => {
          if (name === 'category') return 'IGNORED';
        },
      };
      return await command.execute(testInteraction);
    }
    if (name == 'poll') {
      testInteraction.options = {
        getString: (name:string) => {
          if (name === 'question') return 'Is TripBot Awesome?';
          if (name === 'options') return 'Yes,Also Yes,No...but yes';
        },
      };
      return await command.execute(testInteraction);
    }
    if (name == 'profile') {
      testInteraction.options = {
        getMember: (name:string) => {
          return interaction.member;
        },
      };
      return await command.execute(testInteraction);
    }
    if (name == 'remindme') {
      // Get existing reminders
      await interaction.channel.send(`> **${name}** - Getting existing record`);
      testInteraction.options = {
        getString: (name:string) => {
          if (name === 'offset') return '2 mins';
          if (name === 'reminder') return 'Test reminder A';
        },
        getNumber: (name:string) => {
          if (name === 'record') return 0;
        },
        getSubcommand: () => {
          return 'get';
        },
      };
      await command.execute(testInteraction);
      await sleep(1000);

      // Set a dose
      await interaction.channel.send(`> **${name}** - Setting record`);
      testInteraction.options = {
        getString: (name:string) => {
          if (name === 'offset') return '2 mins';
          if (name === 'reminder') return 'Test reminder A';
        },
        getNumber: (name:string) => {
          if (name === 'record') return 0;
        },
        getSubcommand: () => {
          return 'set';
        },
      };
      await command.execute(testInteraction);
      await sleep(1000);

      // Set a dose
      await interaction.channel.send(`> **${name}** - Setting record`);
      testInteraction.options = {
        getString: (name:string) => {
          if (name === 'offset') return '3 mins';
          if (name === 'reminder') return 'Test reminder B';
        },
        getNumber: (name:string) => {
          if (name === 'record') return 0;
        },
        getSubcommand: () => {
          return 'set';
        },
      };
      await command.execute(testInteraction);
      await sleep(1000);

      // Get history
      await interaction.channel.send(`> **${name}** - Get records`);
      testInteraction.options = {
        getString: (name:string) => {
          if (name === 'offset') return '2 mins';
          if (name === 'reminder') return 'Test reminder A';
        },
        getNumber: (name:string) => {
          if (name === 'record') return 0;
        },
        getSubcommand: () => {
          return 'get';
        },
      };
      await command.execute(testInteraction);
      await sleep(1000);

      // Delete record
      await interaction.channel.send(`> **${name}** - Deleting record`);
      testInteraction.options = {
        getString: (name:string) => {
          if (name === 'offset') return '2 mins';
          if (name === 'reminder') return 'Test reminder A';
        },
        getNumber: (name:string) => {
          if (name === 'record') return 0;
        },
        getSubcommand: () => {
          return 'delete';
        },
      };
      await command.execute(testInteraction);
      await sleep(1000);

      // Get history
      await interaction.channel.send(`> **${name}** - Get records`);
      testInteraction.options = {
        getString: (name:string) => {
          if (name === 'offset') return '2 mins';
          if (name === 'reminder') return 'Test reminder A';
        },
        getNumber: (name:string) => {
          if (name === 'record') return 0;
        },
        getSubcommand: () => {
          return 'get';
        },
      };
      return await command.execute(testInteraction);
    }
    if (name == 'reminder') {
      testInteraction.channel = await interaction.guild?.channels.fetch(env.CHANNEL_TEAMTRIPSIT) as TextChannel;
      await command.execute(testInteraction);
      sleep(1000);

      testInteraction.channel = await interaction.guild?.channels.fetch(env.CHANNEL_GENERAL) as TextChannel;
      await command.execute(testInteraction);
      sleep(1000);

      testInteraction.channel = await interaction.guild?.channels.fetch(env.CHANNEL_SANCTUARY) as TextChannel;
      return await command.execute(testInteraction);
    }
    if (name == 'say') {
      testInteraction.options = {
        getChannel: (name:string) => {
          if (name === 'channel') return interaction.channel;
        },
        getString: (name:string) => {
          if (name === 'say') return 'TripBot Is Awesome!';
        },
      };
      return await command.execute(testInteraction);
    }
    if (name == 'timezone') {
      // Test getting a blank timezone
      await interaction.channel.send(`> **${name}** - Getting existing record`);
      testInteraction.options = {
        getString: (name:string) => {
          if (name === 'timezone') return 'Pacific/Tahiti';
        },
        getMember: (name:string) => {
          if (name === 'user') return interaction.member;
        },
        getSubcommand: () => {
          return 'get';
        },
      };
      await command.execute(testInteraction);
      await sleep(1000);

      // Set the record
      await interaction.channel.send(`> **${name}** - Setting new timezone to 'America/Chicago'`);
      testInteraction.options = {
        getString: (name:string) => {
          if (name === 'timezone') return '(GMT-10:00) Hawaii Time';
        },
        getMember: (name:string) => {
          if (name === 'user') return interaction.member;
        },
        getSubcommand: () => {
          return 'set';
        },
      };
      await command.execute(testInteraction);
      await sleep(1000);

      // Get the new record
      await interaction.channel.send(`> **${name}** - Getting new record (Should be same as above)`);
      testInteraction.options = {
        getString: (name:string) => {
          if (name === 'timezone') return '(GMT-09:00) Alaska Time';
        },
        getMember: (name:string) => {
          if (name === 'user') return interaction.member;
        },
        getSubcommand: () => {
          return 'get';
        },
      };
      await command.execute(testInteraction);

      // Set the record
      await interaction.channel.send(`> **${name}** - Setting new timezone to 'America/New_York'`);
      testInteraction.options = {
        getString: (name:string) => {
          if (name === 'timezone') return '(GMT-08:00) Pacific Time';
        },
        getMember: (name:string) => {
          if (name === 'user') return interaction.member;
        },
        getSubcommand: () => {
          return 'set';
        },
      };
      await command.execute(testInteraction);
      await sleep(1000);

      // Get the new record
      await interaction.channel.send(`> **${name}** - Getting new record (Should be same as above)`);
      testInteraction.options = {
        getString: (name:string) => {
          if (name === 'timezone') return '(GMT-08:00) Pacific Time';
        },
        getMember: (name:string) => {
          if (name === 'user') return interaction.member;
        },
        getSubcommand: () => {
          return 'get';
        },
      };
      return await command.execute(testInteraction);
    }
    if (name == 'triptoys') {
      testInteraction.options = {
        getString: (name:string) => {
          if (name === 'toy') return '25';
        },
      };
      return await command.execute(testInteraction);
    }
    if (name == 'urban_define') {
      testInteraction.options = {
        getString: (name:string) => {
          if (name === 'define') return 'TripSit';
        },
      };
      return await command.execute(testInteraction);
    }
    if (name == 'youtube') {
      testInteraction.options = {
        getString: (name:string) => {
          if (name === 'search') return 'TripSit find the others';
        },
      };
      return await command.execute(testInteraction);
    }

    // No-parameter commands fall down here, including:
    // - button, joke, kipp, motivate, ping, topic
    return await command.execute(testInteraction);
  } else {
    interaction.channel.send(`**${name}** - command not found!`);
    return false;
  }
};
