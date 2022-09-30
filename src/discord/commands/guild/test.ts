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
 * @param {'global'|'guild'} commandType
 * @return {Promise<command[]>}
 */
// async function getCommands(commandType:'global'|'guild') {
//   const files = await fs.readdir(path.join(path.resolve('src/discord/commands'), commandType));
//   return files
//       .filter((file) => file.endsWith('.ts') && !file.endsWith('index.js'))
//       .map((file) => file.slice(0, -3));
// }

/**
 *
 * @param {ChatInputCommandInteraction} interaction
 * @param {string} functionName
 * @param {string }message
 * @return {void}
 */
// async function testReply(
//     interaction:ChatInputCommandInteraction,
//     functionName:string,
//     message:string):Promise<void> {
//   const embed = embedTemplate()
//       .setColor(Colors.Purple)
//       .setTitle(`Skipping ${functionName} because ${message}`);
//   if (!interaction.replied) {
//     interaction.reply({
//       embeds: [embed],
//       ephemeral: false,
//     });
//   } else {
//     interaction.followUp({
//       embeds: [embed],
//       ephemeral: false,
//     });
//   }
// }

/**
 *
 * @param {ChatInputCommandInteraction} interaction
 * @param {string} name
 */
async function runCommand(interaction:ChatInputCommandInteraction, name:string) {
  await sleep(1000);
  await interaction.channel!.send(`**${name}** - Starting test!`);
  await sleep(100);

  const command = await interaction.client.commands.get(name);
  if (command) {
    logger.debug(`Running ${name}!`);
    // if (name == 'birthday') {
    //   await testReply(interaction, name, 'i havnt set up the test code yet!');
    // }
    // if (name == 'botmod') {
    //   await testReply(interaction, name, 'this should be tested manually!');
    // }
    // if (name == 'breathe') {
    //   await command.execute(interaction, '1');
    //   await sleep(1000);
    //   await command.execute(interaction, '2');
    //   await sleep(1000);
    //   await command.execute(interaction, '3');
    //   await sleep(1000);
    //   await command.execute(interaction, '4');
    // }
    // if (name == 'bug') {
    //   // await command.execute(interaction, 'This is a bug report!');
    //   await testReply(interaction, name, 'i havnt set up the test code yet!');
    // }
    // if (name == 'button') {
    //   await testReply(interaction, name, 'this should be tested manually!');
    // }
    // if (name == 'calc-benzo') {
    //   await command.execute(interaction, ['10', 'alprazolam', 'ativan']);
    // }
    // if (name == 'calc-dxm') {
    //   await command.execute(interaction, ['200', 'lbs', 'RoboTablets (30 mg tablets)']);
    // }
    // if (name == 'calc-ketamine') {
    //   await command.execute(interaction, ['200', 'lbs']);
    // }
    // if (name == 'calc-psychedelics') {
    //   await command.execute(interaction, ['2', '4', '4', 'mushrooms']);
    //   await sleep(1000);
    //   await command.execute(interaction, ['2', '', '4', 'mushrooms']);
    //   await sleep(1000);
    //   await command.execute(interaction, ['200', '400', '4', 'lsd']);
    //   await sleep(1000);
    //   await command.execute(interaction, ['200', '', '4', 'lsd']);
    // }
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
    // if (name == 'dose') {
    //   await command.execute(interaction, ['DXM', '10', 'g (grams)']);
    // }
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
    await interaction.reply('Starting testing...');

    const scope = interaction.options.getString('scope') || 'All';

    const globalCommands = await client.application?.commands.fetch({force: true})!;
    const guildCommands = await interaction.guild!.commands.fetch({force: true})!;

    if (scope === 'All' || scope === 'Global') {
      await interaction.followUp(`Testing ${globalCommands.size} global commands...`);
      globalCommands.forEach(async (command) => {
        // logger.debug(JSON.stringify(command, null, 2));
        logger.debug(`[${PREFIX}] ${command.name} - ${command.guild} - ${command.guildId}`);
      });
      // Get a list of all commands registered to the bot
      if (false) {
        runCommand(interaction, 'lol (( butts');
      }
      // getCommands('global').then(async (globalCommandNames) => {
      //   for (let i = 0; i < globalCommandNames.length; i++) {
      //     const name = globalCommandNames[i];
      //     runCommand(interaction, name);
      //     break;
      //   }
      // });
      logger.debug(`[${PREFIX}] Global commands finished!`);
    }
    if (scope === 'All' || scope === 'Guild') {
      await interaction.followUp(`Testing ${guildCommands.size} guild commands...`);
      guildCommands.forEach(async (command) => {
        // logger.debug(JSON.stringify(command, null, 2));
        logger.debug(`[${PREFIX}] ${command.name} - ${command.guild} - ${command.guildId}`);
      });
      // getCommands('guild').then(async (guildCommandNames) => {
      //   for (let i = 0; i < guildCommandNames.length; i++) {
      //     const name = guildCommandNames[i];
      //     runCommand(interaction, name);
      //     break;
      //   }
      // });
      logger.debug(`[${PREFIX}] Guild commands finished!`);
    }
    const embed = embedTemplate();
    embed.setTitle('Testing Results');
    embed.addFields(
        {name: 'Guild Tested', value: `${guildCommands.size}`, inline: true},
        {name: 'Guild Success', value: `X`, inline: true},
        {name: 'Guild Failed', value: `Y`, inline: true},
        {name: 'Global Tested', value: `${globalCommands.size}`, inline: true},
        {name: 'Global Success', value: `A`, inline: true},
        {name: 'Global Failed', value: `B`, inline: true},
    );
    await interaction.followUp({embeds: [embed]});
  },
};
