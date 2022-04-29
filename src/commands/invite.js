const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const logger = require('../utils/logger.js');
const PREFIX = require('path').parse(__filename).name;
const welcome_channel_id = process.env.channel_welcome;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('invite')
        .setDescription('Creates new invites!')
        .addChannelOption(option => option.setName('channel').setDescription('To what channel?'))
        .addBooleanOption(option => option.setName('temporary').setDescription('Temporary?'))
        .addIntegerOption(option => option.setName('max_age').setDescription('Max age?'))
        .addIntegerOption(option => option.setName('max_uses').setDescription('Max uses?')),
    async execute(interaction) {
        let channel = interaction.options.getChannel('channel');
        let temporary = interaction.options.getBoolean('temporary');
        let maxAge = interaction.options.getInteger('maxAge');
        let maxUses = interaction.options.getInteger('maxUses');

        if (!channel) {
            channel = interaction.client.channels.cache.get(welcome_channel_id);
        }
        if (!temporary) {
            temporary = false;
        }
        if (!maxAge) {
            maxAge = 0;
        }
        if (!maxUses) {
            maxUses = 0;
        }
        const unique = true;
        const reason = 'Invite requested by ' + interaction.member.user.username;
        try {
            channel.createInvite({
                maxAge,
                maxUses,
                temporary,
                unique,
                reason,
            }).then(invite => {
                const embed = new MessageEmbed()
                    .setColor('RANDOM')
                    .setDescription(`Created an invite to ${channel} with a code of ${invite.code}`);
                interaction.reply({ embeds: [embed], ephemeral: false });
            }).catch(err => {
                logger.error(`${PREFIX}/invite: ${err}`);
                const embed = new MessageEmbed()
                    .setColor('RANDOM')
                    .setDescription(err);
                interaction.reply({ embeds: [embed], ephemeral: false });
            });
        }
        catch (err) {
            const embed = new MessageEmbed()
                .setColor('RANDOM')
                .setDescription('Make sure you entered a channel!');
            interaction.reply({ embeds: [embed], ephemeral: false });
        }
        logger.debug(`[${PREFIX}] finished!`);
        return;
    },
};
