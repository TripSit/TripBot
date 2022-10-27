import {
  ChatInputCommandInteraction,
  // ActionRowBuilder,
  // ModalBuilder,
  // TextInputBuilder,
  // Colors,
  SlashCommandBuilder,
  // TextChannel,
} from 'discord.js';
import {
// TextInputStyle,
} from 'discord-api-types/v10';
import {SlashCommand} from '../../@types/commandDef';
import {embedTemplate} from '../../utils/embedTemplate';
// import env from '../../../global/utils/env.config';
// import fs from 'fs/promises';
import logger from '../../../global/utils/logger';
import * as path from 'path';
// import convert from 'convert-units';
const PREFIX = path.parse(__filename).name;
// import drugDataAll from '../../../global/assets/data/drug_db_combined.json';
// const drugNames = drugDataAll.map((d) => d.name);

/**
 * @param {number} ms
 * @return {Promise<void>}
 */
function sleep(ms:number):Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/**
 *
 * @param {ChatInputCommandInteraction} interaction
 * @param {string} name
 */
async function runCommand(interaction:ChatInputCommandInteraction, name:string) {
  const testInteraction = {
    options: {},
    guild: interaction.guild,
    user: interaction.user,
    channel: interaction.channel,
    reply: (content:string) => {
      return interaction.followUp(content);
    },
  };

  const testableCommands = [
    // 'about', /* updated */
    // 'birthday', /* updatedPostgres */
    // 'breathe', /* updated */
    // 'bug',
    // 'calc_dxm', /* updated */
    // 'calc_ketamine', /* updated */
    // 'calc_psychedelics', /* updated */
    // 'calc_benzo', /* updated */
    // 'clearchat',
    // 'combo',
    // 'contact',
    // 'convert',
    // 'coinflip',
    // 'combochart',
    // 'drug',
    // 'eyeballing',
    // 'grounding',
    // 'h2flow',
    // 'imdb',
    // 'imgur',
    // 'issue',
    // 'karma',
    // 'magick8ball',
    // 'moderate',
    // 'modmail',
    // 'ping',
    // 'profile',
    // 'recovery',
    // 'report',
    // 'say',
    // 'test',
    // 'timezone',
    // 'topic',
    // 'youtube',
    // 'donate',
    // 'dramacounter', /* updatedPostgres */
    // 'ems',
    // 'help',
    // 'helpline',
    // 'hydrate',
    'idose',
    // 'joke',
    // 'kipp',
    // 'lovebomb',
    // 'm_report',
    // 'm_timeout',
    // 'm_warn',
    // 'poll',
    // 'reagents',
    // 'remindme',
    // 'setup',
    // 'testkits',
    // 'triptoys',
    // 'u_ban',
    // 'u_info',
    // 'u_kick',
    // 'u_note',
    // 'u_underban',
    // 'urbanDefine',
    // 'warmline',
  ];

  if (!testableCommands.includes(name)) {
    return false;
  }

  await interaction.channel!.send(`> **${name}** - Starting test!`);

  await sleep(1000);

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
    if (name == 'about') {
      return await command.execute(testInteraction);
    }
    if (name == 'birthday') {
      // Test getting a blank birthday
      await interaction.channel!.send(`> **${name}** - Getting existing record`);
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
      await interaction.channel!.send(`> **${name}** - Setting new birthdate to ${monthName} ${day}`);
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
      await interaction.channel!.send(`> **${name}** - Getting new birthdate (Should be ${monthName} ${day})`);
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
    // if (name == 'botmod') {
    //   await testReply(interaction, name, 'this should be tested manually!');
    // }
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
    // if (name == 'bug') {
    //   // await command.execute(interaction, 'This is a bug report!');
    //   await testReply(interaction, name, 'i havnt set up the test code yet!');
    // }
    // if (name == 'button') {
    //   await testReply(interaction, name, 'this should be tested manually!');
    // }
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
        getInteger: (name:string) => {
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
    // if (name == 'chitragupta') {
    //   await testReply(interaction, name, 'this does not need to be tested!');
    // }
    // if (name == 'clean-db') {
    //   await testReply(interaction, name, 'this does not need to be tested!');
    // }
    // if (name == 'clear-chat') {
    //   await testReply(interaction, name, 'this does not need to be tested!');
    // }
    // if (name == 'combo') {
    //   await command.execute(interaction, ['DXM', 'MDMA']);
    // }
    if (name == 'idose') {
      // Test getting a record
      await interaction.channel!.send(`> **${name}** - Getting existing record`);
      testInteraction.options = {
        get: (name:string) => {
          if (name === 'units') return {value: 'G'};
          if (name === 'roa') return {value: 'RECTAL'};
          if (name === 'offset') return {value: '23 mins ago'};
        },
        getString: (name:string) => {
          if (name === 'substance') return 'Cannabis';
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
      await interaction.channel!.send(`> **${name}** - Setting record`);
      testInteraction.options = {
        get: (name:string) => {
          if (name === 'units') return {value: 'G'};
          if (name === 'roa') return {value: 'RECTAL'};
          if (name === 'offset') return {value: '23 mins ago'};
        },
        getString: (name:string) => {
          if (name === 'substance') return 'Cannabis';
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
      await interaction.channel!.send(`> **${name}** - Get records`);
      testInteraction.options = {
        get: (name:string) => {
          if (name === 'units') return {value: 'G'};
          if (name === 'roa') return {value: 'RECTAL'};
          if (name === 'offset') return {value: '23 mins ago'};
        },
        getString: (name:string) => {
          if (name === 'substance') return 'Cannabis';
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
      await interaction.channel!.send(`> **${name}** - Deleting record`);
      testInteraction.options = {
        get: (name:string) => {
          if (name === 'units') return {value: 'G'};
          if (name === 'roa') return {value: 'RECTAL'};
          if (name === 'offset') return {value: '23 mins ago'};
        },
        getString: (name:string) => {
          if (name === 'substance') return 'Cannabis';
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
      await interaction.channel!.send(`> **${name}** - Get records`);
      testInteraction.options = {
        get: (name:string) => {
          if (name === 'units') return {value: 'G'};
          if (name === 'roa') return {value: 'RECTAL'};
          if (name === 'offset') return {value: '23 mins ago'};
        },
        getString: (name:string) => {
          if (name === 'substance') return 'Cannabis';
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
    if (name == 'dramacounter') {
      // Test getting the existing drama
      await interaction.channel!.send(`> **${name}** - Getting existing record`);
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
      await interaction.channel!.send(
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
      await interaction.channel!.send(`> **${name}** - Get new record, should be the same as above`);
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
    // if (name == 'how-to-tripsit') {
    //   await testReply(interaction, name, 'this should be tested manually!');
    // }
    // if (name == 'idose') {
    //   const drugUnits = [
    //     'mg (milligrams)',
    //     'mL (milliliters)',
    //     'µg (micrograms/ug/mcg)',
    //     'g (grams)',
    //     'oz (ounces)',
    //     'fl oz (fluid ounces)',
    //     'tabs',
    //     'caps',
    //     'pills',
    //     'drops',
    //     'sprays',
    //     'inhales',
    //   ];

    //   // get a random drug from drugNames
    //   const drug = drugNames[Math.floor(Math.random() * drugNames.length)];
    //   // Get a random value between 1 and 100
    //   const doseValue = Math.floor(Math.random() * 100) + 1;
    //   // Get a random unit from drugUnits
    //   const doseUnit = drugUnits[Math.floor(Math.random() * drugUnits.length)];
    //   // Get a random value between 1 and 10
    //   const timeValue = Math.floor(Math.random() * 10) + 1;
    //   // Make the offset string
    //   const offset = `${timeValue} week, ${timeValue} days, ${timeValue} hrs ${timeValue} mins`;
    //   logger.debug(`[${PREFIX}] Testing ${name} with ${drug} ${doseValue} ${doseUnit} in ${offset}`);
    //   await command.execute(interaction, ['set', drug, doseValue, doseUnit, offset]);
    //   // await sleep(1000);
    //   // await command.execute(interaction, ['get']);
    // }
    // if (name == 'info') {
    //   await command.execute(interaction, ['DMT', 'Summary']);
    //   await sleep(1000);
    //   await command.execute(interaction, ['DMT', 'Dosage']);
    //   await sleep(1000);
    //   await command.execute(interaction, ['DMT', 'Combos']);
    // }
    // if (name == 'invite') {
    //   await testReply(interaction, name, 'this should be tested manually!');
    // }
    // if (name == 'issue') {
    //   await testReply(interaction, name, 'this should be tested manually!');
    // }
    // if (name == 'karma') {
    //   await testReply(interaction, name, 'i havnt set up the test code yet!');
    //   await command.execute(interaction, '1');
    // }
    // if (name == 'mod') {
    //   await testReply(interaction, name, 'i havnt set up the test code yet!');
    //   await command.execute(interaction, '1');
    // }
    // if (name == 'pill-id') {
    //   await testReply(interaction, name, 'this is in development!');
    // }
    // if (name == 'ping') {
    //   await testReply(interaction, name, 'i havnt set up the test code yet!');
    //   await command.execute(interaction, '1');
    // }
    // if (name == 'remindme') {
    //   await testReply(interaction, name, 'i havnt set up the test code yet!');
    //   await command.execute(interaction, '1');
    // }
    // if (name == 'report') {
    //   await testReply(interaction, name, 'i havnt set up the test code yet!');
    //   await command.execute(interaction, '1');
    // }
    // if (name == 'rules') {
    //   await testReply(interaction, name, 'this should be tested manually!');
    // }
    // if (name == 'start-here') {
    //   await testReply(interaction, name, 'this should be tested manually!');
    // }
    // if (name == 'test') {
    //   await testReply(interaction, name, 'this would create a black hole!');
    // }
    // if (name == 'time') {
    //   await testReply(interaction, name, 'i havnt set up the test code yet!');
    //   await command.execute(interaction, '1');
    // }
    // if (name == 'tripsit') {
    //   await testReply(interaction, name, 'this should be tested manually!');
    // }
    // if (name == 'tripsitme') {
    //   await testReply(interaction, name, 'this does not need to be tested (use button)!');
    // }
    // if (name == 'triptoys') {
    //   await testReply(interaction, name, 'i havnt set up the test code yet!');
    //   await command.execute(interaction, '1');
    // }
    // if (name == 'urban_define') {
    //   await command.execute(interaction, 'tripsit');
    // }
    // if (name == 'update-guilds') {
    //   await testReply(interaction, name, 'this does not need to be tested!');
    // }
    // // No-parameter commands fall down here, including:
    // // - button, joke, kipp, motivate, ping, topic
    // await command.execute(interaction);
  } else {
    interaction.channel!.send(`**${name}** - command not found!`);
  }
};

type resultsObject = {
  total:number
  passed:number
  failed:number
}

/**
 *
 * @param {ChatInputCommandInteraction} interaction
 */
async function testGlobal(interaction:ChatInputCommandInteraction):Promise<resultsObject> {
  const scope = interaction.options.getString('scope') || 'All';
  const results = {total: 0, passed: 0, failed: 0};
  if (scope === 'All' || scope === 'Global') {
    await client.application?.commands.fetch({force: true})
      .then(async (globalCommands) => {
        results.total = globalCommands.size;
        await interaction.followUp(`> Testing ${globalCommands.size} global commands!`);
        for (const command of globalCommands) {
          // logger.debug(`[${PREFIX}] Testing global command ${command[1].name}`);
          await runCommand(interaction, command[1].name)
            .then((result) => {
              if (result) {
                // logger.debug(`[${PREFIX}] Global command ${command[1].name} passed!`);
                results.passed++;
              } else {
                // logger.debug(`[${PREFIX}] Global command ${command[1].name} failed!`);
                results.failed++;
              }
            });
        };
      });
    // .finally(() => {
    //   // logger.debug(`[${PREFIX}] Global commands results: ${JSON.stringify(results)}`);
    // });
  }
  return results;
}

/**
 *
 * @param {ChatInputCommandInteraction} interaction
 */
async function testGuild(interaction:ChatInputCommandInteraction):Promise<resultsObject> {
  const scope = interaction.options.getString('scope') || 'All';
  const results = {total: 0, passed: 0, failed: 0};
  if (scope === 'All' || scope === 'Guild') {
    await interaction.guild!.commands.fetch({force: true})
      .then(async (guildCommands) => {
        results.total = guildCommands.size;
        await interaction.followUp(`> Testing ${guildCommands.size} guild commands!`);
        for (const command of guildCommands) {
          // logger.debug(`[${PREFIX}] Testing guild command ${command[1].name}`);
          await runCommand(interaction, command[1].name)
            .then((result) => {
              if (result) {
                // logger.debug(`[${PREFIX}] Global command ${command[1].name} passed!`);
                results.passed++;
              } else {
                // logger.debug(`[${PREFIX}] Global command ${command[1].name} failed!`);
                results.failed++;
              }
            });
        };
      });
    // .finally(() => {
    //   // logger.debug(`[${PREFIX}] Guild commands finished!`);
    //   // logger.debug(`[${PREFIX}] Guild commands results: ${JSON.stringify(results)}`);
    // });
  }
  return results;
}

export const test: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('test')
    .setDescription('This will test the bot and show all functionality!')
    .addStringOption((option) => option.setName('scope')
      .setDescription('Global, guild, or all?')
      .addChoices(
        {name: 'All', value: 'All'},
        {name: 'Guild', value: 'Guild'},
        {name: 'Global', value: 'Global'},
      )),
  async execute(interaction) {
    const scope = interaction.options.getString('scope') || 'All';
    await interaction.reply(`Testing ${scope} commands!`);

    await testGlobal(interaction)
      .then(async (globalResults) => {
        logger.debug(`[${PREFIX}] Global results: ${JSON.stringify(globalResults)}`);
        await testGuild(interaction)
          .then(async (guildResults) => {
            logger.debug(`[${PREFIX}] Guild results: ${JSON.stringify(guildResults)}`);
            const embed = embedTemplate()
              .setTitle('Testing Results')
              .addFields(
                {name: 'Global Tested', value: `${globalResults.total}`, inline: true},
                {name: 'Global Success', value: `${globalResults.passed}`, inline: true},
                {name: 'Global Failed', value: `${globalResults.failed}`, inline: true},
                {name: 'Guild Tested', value: `${guildResults.total}`, inline: true},
                {name: 'Guild Success', value: `${guildResults.passed}`, inline: true},
                {name: 'Guild Failed', value: `${guildResults.failed}`, inline: true},
              );
            await interaction.channel!.send({embeds: [embed]});
          });
      });
  },
};
