const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const logger = require('../utils/logger.js');
const fs = require('fs');

const raw_topics = fs.readFileSync('./src/assets/topics.json');
const topics = JSON.parse(raw_topics);


const PREFIX = require('path').parse(__filename).name;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('topic')
        .setDescription('Sends a random topic!'),
    async execute(interaction) {
        // Pick a random topic from topics.json
        const random_topic = topics[Math.floor(Math.random() * Object.keys(topics).length).toString()];
        logger.debug(`[${PREFIX}] random_topic: ${random_topic}`);
        const embed = new MessageEmbed()
            .setColor('RANDOM')
            .setDescription(random_topic);
        interaction.reply({ embeds: [embed], ephemeral: false });
        logger.debug(`${PREFIX} finished!`);
        return;
    },
};
