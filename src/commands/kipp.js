const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const logger = require('../utils/logger.js');

const PREFIX = require('path').parse(__filename).name;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('kipp')
        .setDescription('Keep it positive please!'),
    async execute(interaction) {
        const happy_emojis = [
            '😀', '😃', '😄', '😊', '😁', '🥰', '😇', '😍', '😂', '🤣',
            '🙂', '😆', '😋', '😛', '🙃', '😜', '🤪', '😝', '🤗', '🤭',
            '😎', '😺', '😸', '😹', '😻', '👍', '✌'];

        // Get 10 random happy emojis from the list above
        const row_a = happy_emojis.sort(() => 0.5 - Math.random()).slice(0, 8);
        logger.debug(`[${PREFIX}] Row A: ${row_a}`);
        const row_b = '\n💜Keep It Positive Please!💜\n';
        logger.debug(`[${PREFIX}] Row B: ${row_b}`);
        const row_c = happy_emojis.sort(() => 0.5 - Math.random()).slice(0, 8);
        logger.debug(`[${PREFIX}] Row C: ${row_c}`);
        const output = row_a.join(' ') + row_b + row_c.join(' ');
        logger.debug(`[${PREFIX}] Output: ${output}`);

        const embed = new MessageEmbed()
            .setColor('RANDOM')
            .setDescription(output);
        interaction.reply({ embeds: [embed], ephemeral: false });
        logger.debug(`[${PREFIX}] finished!`);
        return;
    },
};
