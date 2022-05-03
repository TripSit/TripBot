const { SlashCommandBuilder } = require('@discordjs/builders');
const logger = require('../utils/logger.js');
const PREFIX = require('path').parse(__filename).name;
const axios = require('axios');
if (process.env.NODE_ENV !== 'production') {require('dotenv').config();}
const WR_TOKEN = process.env.rapid_api_key;
const WR_API_KEY = process.env.wolfram_alpha_key;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('wolfram')
        .setDescription('Ask a question on Wolfram Alpha')
        .addStringOption(option => option.setName('question').setDescription('What do you want to know?').setRequired(true)),
    async execute(interaction) {
        const question = interaction.options.getString('question');
        logger.debug(`[${PREFIX}] question: ${question}`);

        const encodedParams = new URLSearchParams();
        encodedParams.append('input', question);
        encodedParams.append('apiKey', WR_API_KEY);

        const options = {
            method: 'POST',
            url: 'https://wolframalphavolodimir-kudriachenkov1.p.rapidapi.com/createQuery',
            headers: {
                'content-type': 'application/x-www-form-urlencoded',
                'X-RapidAPI-Host': 'WolframAlphavolodimir-kudriachenkoV1.p.rapidapi.com',
                'X-RapidAPI-Key': WR_TOKEN,
            },
            data: encodedParams,
        };

        axios.request(options).then(function(response) {
            const data = response.data;
            logger.debug(`[${PREFIX}] data: ${JSON.stringify(data, null, 2)}`);
            // const embed = template.embed_template()
            //     .setTitle(`Definition for: ${word}`)
            //     .addFields(
            //         { name: `Definition A (+${data.list[0].thumbs_up}/-${data.list[0].thumbs_down})`, value: `${data.list[0].definition.length > 1024 ? `${data.list[0].definition.slice(0, 1020)}...` : data.list[0].definition}`, inline: false },
            //         { name: 'Example A', value: data.list[0].example, inline: false },
            //         { name: `Definition B (+${data.list[1].thumbs_up}/-${data.list[1].thumbs_down})`, value: `${data.list[1].definition.length > 1024 ? `${data.list[1].definition.slice(0, 1020)}...` : data.list[1].definition}`, inline: false },
            //         { name: 'Example B', value: data.list[1].example, inline: false },
            //         { name: `Definition C (+${data.list[2].thumbs_up}/-${data.list[2].thumbs_down})`, value: `${data.list[2].definition.length > 1024 ? `${data.list[2].definition.slice(0, 1020)}...` : data.list[2].definition}`, inline: false },
            //         { name: 'Example C', value: data.list[2].example, inline: false },
            //     );
            // if (!interaction.replied) {
            //     interaction.reply({ embeds: [embed], ephemeral: false });
            // }
            // else {
            //     interaction.followUp({ embeds: [embed], ephemeral: false });
            // }
            // logger.debug(`[${PREFIX}] finished!`);
            // return;
        }).catch(function(error) {
            console.error(error);
        });
    },
};

