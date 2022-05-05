const fs = require('fs');
const { SlashCommandBuilder } = require('@discordjs/builders');
const logger = require('../../utils/logger.js');
const PREFIX = require('path').parse(__filename).name;
const template = require('../../utils/embed_template');
const raw_topics = fs.readFileSync('./src/assets/topics.json');
const topics = JSON.parse(raw_topics);

module.exports = {
    data: new SlashCommandBuilder()
        .setName('topic')
        .setDescription('Sends a random topic!'),
    async execute(interaction) {
        // Pick a random topic from topics.json
        const random_topic = topics[Math.floor(Math.random() * Object.keys(topics).length).toString()];
        logger.debug(`[${PREFIX}] random_topic: ${random_topic}`);
        const embed = template.embed_template()
            .setDescription(random_topic);
        if (!interaction.replied) { interaction.reply({ embeds: [embed], ephemeral: false });}
        else {interaction.followUp({ embeds: [embed], ephemeral: false });}
        logger.debug(`[${PREFIX}] finished!`);
        return;
    },
};
