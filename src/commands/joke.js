const { SlashCommandBuilder } = require('@discordjs/builders');
const logger = require('../utils/logger.js');
const PREFIX = require('path').parse(__filename).name;
const template = require('../utils/embed_template');
const axios = require('axios');
if (process.env.NODE_ENV !== 'production') {require('dotenv').config();}
const API_KEY = process.env.rapid_api_key;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('joke')
        .setDescription('Random jokes'),
    async execute(interaction) {
        const options = {
            method: 'GET',
            url: 'https://jokeapi-v2.p.rapidapi.com/joke/Misc,Pun',
            params: {
                format: 'json',
                blacklistFlags: 'nsfw,religious,political,racist,sexist,explicit',
                'safe-mode': 'true',
            },
            headers: {
                'X-RapidAPI-Host': 'jokeapi-v2.p.rapidapi.com',
                'X-RapidAPI-Key': API_KEY,
            },
        };

        let data = {};
        axios.request(options).then(function(response) {
            data = response.data;
            console.log(data);
            // logger.debug(`[${PREFIX}] data: ${JSON.stringify(data, null, 2)}`);
            const embed = template.embed_template();
            if (data.type == 'twopart') {
                embed.setTitle(data.setup)
                    .setDescription(data.delivery);
            }
            else {
                embed.setTitle(data.joke);
            }
            if (!interaction.replied) { interaction.reply({ embeds: [embed], ephemeral: false });}
            else {interaction.followUp({ embeds: [embed], ephemeral: false });}
            logger.debug(`[${PREFIX}] finished!`);
        }).catch(function(error) {
            console.error(error);
        });
        return;
    },
};
