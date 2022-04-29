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
        .setName('motivate')
        .setDescription('Random motivational quotes'),
    async execute(interaction) {
        const options = {
            method: 'POST',
            url: 'https://motivational-quotes1.p.rapidapi.com/motivation',
            headers: {
                'content-type': 'application/json',
                'X-RapidAPI-Host': 'motivational-quotes1.p.rapidapi.com',
                'X-RapidAPI-Key': API_KEY,
            },
            data: '{"key1":"value","key2":"value"}',
        };

        let data = {};
        axios.request(options).then(function(response) {
            data = response.data;
            console.log(response.data);
            logger.debug(`[${PREFIX}] data: ${JSON.stringify(data, null, 2)}`);
            const embed = new MessageEmbed()
                .setAuthor({ name: 'TripSit.Me', iconURL: ts_icon_url, url: 'http://www.tripsit.me' })
                .setColor('RANDOM')
                .setDescription(`${data}`)
                .setFooter({ text: 'Dose responsibly!', iconURL: ts_flame_url });
            interaction.reply({ embeds: [embed], ephemeral: false });
            logger.debug(`[${PREFIX}] finished!`);
        }).catch(function(error) {
            console.error(error);
        });


        return;
    },
};
