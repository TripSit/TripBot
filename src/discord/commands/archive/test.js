/* eslint-disable */

// NOTE: I think integration tests might repalce this so I'm wondering if I should bother having it work with the new
// directory structure?
// MB: I'm down to remove this but in the meantime it's still useful for testing

'use strict';

const path = require('path');
const fs = require('fs/promises');
const { SlashCommandBuilder } = require('discord.js');
const logger = require('../../../global/utils/logger');
const template = require('../../utils/embed-template');
const COMMANDS_PATH = path.resolve('src/commands');
const drugDataAll = require('../../../global/assets/data/drug_db_combined.json');
const drugNames = drugDataAll.map(d => d.name);

const PREFIX = path.parse(__filename).name;

function sleep(ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}

async function getCommands(commandType) {
  const files = await fs.readdir(path.join(COMMANDS_PATH, commandType));
  return files
    .filter(file => file.endsWith('.js') && !file.endsWith('index.js'))
    .map(file => file.slice(0, -3))
}

async function testReply(interaction, functionName, message) {
  const embed = template.embedTemplate()
    .setColor('RANDOM')
    .setTitle(`Skipping ${functionName} because ${message}`)
  if (!interaction.replied) {
    interaction.reply({
      embeds: [embed],
      ephemeral: false,
    });
  } else {
    interaction.followUp({
      embeds: [embed],
      ephemeral: false,
    });
  }
}


module.exports = {
  data: new SlashCommandBuilder()
    .setName('test')
    .setDescription('This will test the bot and show all functionality!')
    .addStringOption(option => option.setName('scope')
      .setDescription('Global, guild, or all?')
      .addChoices(
				{ name: 'All', value: 'All' },
				{ name: 'Guild', value: 'Guild' },
				{ name: 'Global', value: 'Global' },
			)),
  async execute(interaction) {
    await interaction.deferReply();
    const scope = interaction.options.getString('scope') || 'All';

    const { channel } = interaction;
    const embed = template.embedTemplate()
      .setTitle('Testing in progress...');
    interaction.editReply({ embeds: [embed], ephemeral: false });
    // await sleep(1000);

    if (scope === 'All' || scope === 'Global') {
      getCommands('global').then(async (globl_command_names) => {
        for (let i = 0; i < globl_command_names.length; i++) {
          const name = globl_command_names[i];

          // For quick testing, disable this in production
          // if (name !== 'idose') {
          //   continue;
          // }

          await sleep(1000);
          const test_embed = template.embedTemplate()
            .setTitle(`Testing ${name}...`);
          await channel.send({ embeds: [test_embed], ephemeral: false });
          await sleep(100);

          const skip_embed = template.embedTemplate()
            .setTitle(`Skipping ${name}...`);

          const command = await interaction.client.commands.get(name);
          if (command) {
            if (name == 'breathe') {
              await command.execute(interaction, '1');
              await sleep(1000);
              await command.execute(interaction, '2');
              await sleep(1000);
              await command.execute(interaction, '3');
              await sleep(1000);
              await command.execute(interaction, '4');
              continue;
            }
            if (name == 'bug') {
              // await command.execute(interaction, 'This is a bug report!');
              await testReply(interaction, name, 'i havnt set up the test code yet!')
              continue;
            }
            if (name == 'calc-benzo') {
              await command.execute(interaction, ['10', 'alprazolam', 'ativan']);
              continue;
            }
            if (name == 'calc-dxm') {
              await command.execute(interaction, ['200', 'lbs', 'RoboTablets (30 mg tablets)']);
              continue;
            }
            if (name == 'calc-ketamine') {
              await command.execute(interaction, ['200', 'lbs']);
              continue;
            }
            if (name == 'calc-psychedelics') {
              await command.execute(interaction, ['2', '4', '4', 'mushrooms']);
              await sleep(1000);
              await command.execute(interaction, ['2', '', '4', 'mushrooms']);
              await sleep(1000);
              await command.execute(interaction, ['200', '400', '4', 'lsd']);
              await sleep(1000);
              await command.execute(interaction, ['200', '', '4', 'lsd']);
              continue;
            }
            if (name == 'combo') {
              await command.execute(interaction, ['DXM', 'MDMA']);
              continue;
            }
            if (name == 'dose') {
              await command.execute(interaction, ['DXM', '10', 'g (grams)']);
              continue;
            }
            if (name == 'info') {
              await command.execute(interaction, ['DMT', 'Summary']);
              await sleep(1000);
              await command.execute(interaction, ['DMT', 'Dosage']);
              await sleep(1000);
              await command.execute(interaction, ['DMT', 'Combos']);
              continue;
            }
            // No-parameter commands fall down here, including:
            // - about, combochart, contact, ems, help, hydrate, reagents, recovery
            await command.execute(interaction);
            continue;
          } else {
            const error_embed = template.embedTemplate()
              .setTitle('Error!')
              .setDescription(`Command ${name} not found!`);
            channel.send({ embeds: [error_embed], ephemeral: false });
          }
        }
      });
      logger.debug(`[${PREFIX}] Global commands finished!`);
    }
    if (scope === 'All' || scope === 'Guild') {
      getCommands('guild').then(async (guild_command_names) => {
        for (let i = 0; i < guild_command_names.length; i++) {
          const name = guild_command_names[i];

          // For quick testing, disable this in production
          // if (name !== 'idose') {
          //   continue;
          // }

          await sleep(1000);
          const test_embed = template.embedTemplate()
            .setTitle(`Testing ${name}...`);
          await channel.send({ embeds: [test_embed], ephemeral: false });
          await sleep(100);

          const skip_embed = template.embedTemplate()
            .setTitle(`Skipping ${name}...`);

          const command = await interaction.client.commands.get(name);
          if (command) {
            if (name == 'birthday') {
              await testReply(interaction, name, 'i havnt set up the test code yet!')
              continue;
              await command.execute(interaction, '1');
            }
            if (name == 'botmod') {
              await testReply(interaction, name, 'this should be tested manually!')
              continue;
            }
            if (name == 'button') {
              await testReply(interaction, name, 'this should be tested manually!')
              continue;
            }
            if (name == 'chitragupta') {
              await testReply(interaction, name, 'this does not need to be tested!')
              continue;
            }
            if (name == 'clean-db') {
              await testReply(interaction, name, 'this does not need to be tested!')
              continue;
            }
            if (name == 'clear-chat') {
              await testReply(interaction, name, 'this does not need to be tested!')
              continue;
            }
            if (name == 'how-to-tripsit') {
              await testReply(interaction, name, 'this should be tested manually!')
              continue;
            }
            if (name == 'idose') {
              const drugUnits = [
              'mg (milligrams)',
              'mL (milliliters)',
              'µg (micrograms/ug/mcg)',
              'g (grams)',
              'oz (ounces)',
              'fl oz (fluid ounces)',
              'tabs',
              'caps',
              'pills',
              'drops',
              'sprays',
              'inhales',
              ]

              // get a random drug from drugNames
              const drug = drugNames[Math.floor(Math.random() * drugNames.length)];
              // Get a random value between 1 and 100
              const doseValue = Math.floor(Math.random() * 100) + 1;
              // Get a random unit from drugUnits
              const doseUnit = drugUnits[Math.floor(Math.random() * drugUnits.length)];
              // Get a random value between 1 and 10
              const timeValue = Math.floor(Math.random() * 10) + 1;
              // Make the offset string
              const offset = `${timeValue} week, ${timeValue} days, ${timeValue} hrs ${timeValue} mins`;
              logger.debug(`[${PREFIX}] Testing ${name} with ${drug} ${doseValue} ${doseUnit} in ${offset}`);
              await command.execute(interaction, ['set', drug, doseValue, doseUnit, offset]);
              // await sleep(1000);
              // await command.execute(interaction, ['get']);
              continue;
            }
            if (name == 'invite') {
              await testReply(interaction, name, 'this should be tested manually!')
              continue;
            }
            if (name == 'issue') {
              await testReply(interaction, name, 'this should be tested manually!')
              continue;
            }
            if (name == 'karma') {
              await testReply(interaction, name, 'i havnt set up the test code yet!')
              continue;
              await command.execute(interaction, '1');
            }
            if (name == 'mod') {
              await testReply(interaction, name, 'i havnt set up the test code yet!')
              continue;
              await command.execute(interaction, '1');
            }
            if (name == 'pill-id') {
              await testReply(interaction, name, 'this is in development!')
              continue;
            }
            if (name == 'ping') {
              await testReply(interaction, name, 'i havnt set up the test code yet!')
              continue;
              await command.execute(interaction, '1');
            }
            if (name == 'remindme') {
              await testReply(interaction, name, 'i havnt set up the test code yet!')
              continue;
              await command.execute(interaction, '1');
            }
            if (name == 'report') {
              await testReply(interaction, name, 'i havnt set up the test code yet!')
              continue;
              await command.execute(interaction, '1');
            }
            if (name == 'rules') {
              await testReply(interaction, name, 'this should be tested manually!')
              continue;
            }
            if (name == 'start-here') {
              await testReply(interaction, name, 'this should be tested manually!')
              continue;
            }
            if (name == 'test') {
              await testReply(interaction, name, 'this would create a black hole!')
              continue;
            }
            if (name == 'time') {
              await testReply(interaction, name, 'i havnt set up the test code yet!')
              continue;
              await command.execute(interaction, '1');
            }
            if (name == 'tripsit') {
              await testReply(interaction, name, 'this should be tested manually!')
              continue;
            }
            if (name == 'tripsitme') {
              await testReply(interaction, name, 'this does not need to be tested (use button)!')
              continue;
            }
            if (name == 'triptoys') {
              await testReply(interaction, name, 'i havnt set up the test code yet!')
              continue;
              await command.execute(interaction, '1');
            }
            if (name == 'urban_define') {
              await command.execute(interaction, 'tripsit');
              continue;
            }
            if (name == 'update-guilds') {
              await testReply(interaction, name, 'this does not need to be tested!')
              continue;
            }
            // No-parameter commands fall down here, including:
            // - button, joke, kipp, motivate, ping, topic
            await command.execute(interaction);
            continue;
          } else {
            const error_embed = template.embedTemplate()
              .setTitle('Error!')
              .setDescription(`Command ${name} not found!`);
            channel.send({ embeds: [error_embed], ephemeral: false });
          }
        }
      });
      logger.debug(`[${PREFIX}] Guild commands finished!`);
    }
  },
};
