'use strict';

const path = require('path');
const { SlashCommandBuilder } = require('@discordjs/builders');
// const { stripIndents } = require('common-tags');
const logger = require('../../../global/logger');
const template = require('../../../global/embed-template');
// const emergency = require('../../../assets/emergency_contact.json');
// const { MessageFlags } = require('discord.js');

const PREFIX = path.parse(__filename).name;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ems')
    .setDescription('Information that may be helpful in a serious situation.'),
  // .addStringOption(option => option.setName('country')
  //   .setDescription('Which country? Pick nothing for default.')
  //   .setAutocomplete(true)),
  async execute(interaction) {
    const country = interaction.options.getString('country');
    const embed = template.embedTemplate();
    if (!country) {
      embed.setTitle('EMS Information');
      embed.addFields(
        { name: 'Poison Control (USA)', value: 'Website: https://www.poison.org/\nPhone: (800) 222-1222\nWebhelp: https://triage.webpoisoncontrol.org/', inline: false },
        { name: 'Never Use Alone (USA)', value: 'Website: https://neverusealone.com/\nPhone: (800) 484-3731', inline: false },
        { name: 'National Overdose Response Service (Canada)', value: 'Website: https://www.nors.ca/\nPhone: 1 (888) 688-6677', inline: false },
        { name: 'Talktofrank (UK)', value: 'Website: https://www.talktofrank.com/\nPhone: 0300 123 6600\nWebhelp: https://www.talktofrank.com/livechat', inline: false },
        { name: 'NHS emergency line (UK)', value: 'Website: https://www.nhs.uk/live-well/addiction-support\nPhone: 999', inline: false },
        { name: 'Mindzone (EU/germany)', value: 'Website: https://mindzone.info/gesundheit/drogennotfall/\nPhone: 112 (works EU wide)', inline: false },
      );
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
      logger.debug(`[${PREFIX}] finished!`);
      // return;
    }
    // embed.setTitle(`${country} EMS Information`);
    // const countryData = emergency[country].parsed_batches;
    // logger.debug(`[${PREFIX}] countryData: ${JSON.stringify(countryData, null, 2)}`);
    // let response = '';
    // countryData.forEach(resource => {
    //   const nameInput = resource.description;
    //   // logger.debug(`[${PREFIX}] name: ${nameInput}`);
    //   let valueInput = resource.phones;
    //   if (valueInput === null || valueInput === undefined || valueInput.length === 0) {
    //     logger.debug(`[${PREFIX}] value is blank, setting to invisible char`);
    //     valueInput = '\u200B';
    //   }
    //   // logger.debug(`[${PREFIX}] value: ${valueInput}`);
    //   // embed.addFields(
    //   //   { name: nameInput, value: valueInput.toString(), inline: false },
    //   // );
    //   response += stripIndents`**${nameInput}**
    //   ${valueInput}`;
    //   response += '\n\n';
    // });
    // response = response.replace('tel:', '');
    // response = response.replace('\n\n\n', '\n\n');
    // logger.debug(`[${PREFIX}] response: ${response}`);
    // logger.debug(`[${PREFIX}] response.length: ${response.length}`);

    // if (!interaction.replied) {
    //   // supress embeds in the reply
    //   interaction.reply({
    //     content: response,
    //     ephemeral: false,
    //     fetchReply: true,
    //   }).then(message => message.suppressEmbeds());
    // } else {
    //   interaction.followUp(response);
    // }
    // logger.debug(`[${PREFIX}] finished!`);
  },
};
