const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const axios = require('axios');
const logger = require('../utils/logger.js');
const API_KEY = process.env.rapid_api_key;
const PREFIX = require('path').parse(__filename).name;
const ts_icon_url = process.env.ts_icon_url;
const ts_flame_url = process.env.ts_flame_url;

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
            logger.debug(`[${PREFIX}] data: ${JSON.stringify(data, null, 2)}`);
            const embed = new MessageEmbed()
                .setAuthor({ name: 'TripSit.Me', iconURL: ts_icon_url, url: 'http://www.tripsit.me' })
                .setColor('RANDOM')
                .setFooter({ text: 'Dose responsibly!', iconURL: ts_flame_url });
            if (data.type == 'twopart') {
                embed.setTitle(data.setup)
                    .setDescription(data.delivery);
            }
            else {
                embed.setTitle(data.joke);
            }
            interaction.reply({ embeds: [embed], ephemeral: false });
            logger.debug(`[${PREFIX}] finished!`);
        }).catch(function(error) {
            console.error(error);
        });


        return;
    },
};
