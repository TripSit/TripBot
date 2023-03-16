// 'use strict';

// const path = require('path');
// const { SlashCommandBuilder } = require('discord.js');
// const axios = require('axios');
// const logger = require('../../../global/utils/log');
// const template = require('../../utils/embed-template');

// const F = f(__filename);

// const {
//   rapidApiKey,
// } = require('../../../../env');

// module.exports = {
//   data: new SlashCommandBuilder()
//     .setName('motivate')
//     .setDescription('Random motivational quotes'),

//   async execute(interaction) {
//     const embed = template.embedTemplate();
//     try {
//       const { data } = await axios.post('https://motivational-quotes1.p.rapidapi.com/motivation', {
//         headers: {
//           'content-type': 'application/json',
//           'X-RapidAPI-Host': 'motivational-quotes1.p.rapidapi.com',
//           'X-RapidAPI-Key': rapidApiKey,
//         },
//         data: JSON.stringify({
//           key1: 'value',
//           key2: 'value',
//         }),
//       });
//     // log.debug(F, `data: ${JSON.stringify(data)}`);
//       embed.setDescription(data);
//     } catch (error) {
//       log.error(F, `${error}`);
//       embed.setDescription(`Error with this API! This is not an error with the bot!\n\n${error}`);
//     }

//     if (!interaction.replied) {
//       await interaction.reply({
//         embeds: [embed],
//         ephemeral: false,
//       });
//     } else {
//       interaction.followUp({
//         embeds: [embed],
//         ephemeral: false,
//       });
//     }
//   },
// };
