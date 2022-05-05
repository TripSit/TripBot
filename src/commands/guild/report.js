const { SlashCommandBuilder, time } = require('@discordjs/builders');
const { MessageActionRow, MessageButton } = require('discord.js');
const logger = require('../../utils/logger.js');
const PREFIX = require('path').parse(__filename).name;
const template = require('../../utils/embed_template');
const { get_user_info } = require('../../utils/get_user_info');
if (process.env.NODE_ENV !== 'production') {require('dotenv').config();}
const channel_moderators_id = process.env.channel_moderators;
const { set_user_info } = require('../../utils/set_user_info');

const mod_buttons = new MessageActionRow()
    .addComponents(
        new MessageButton()
            .setCustomId('warnbtn')
            .setLabel('Warn')
            .setStyle('PRIMARY'),
        new MessageButton()
            .setCustomId('timeoutbtn')
            .setLabel('Timeout')
            .setStyle('SECONDARY'),
        new MessageButton()
            .setCustomId('kickbtn')
            .setLabel('Kick')
            .setStyle('SECONDARY'),
        new MessageButton()
            .setCustomId('banbtn')
            .setLabel('Ban')
            .setStyle('DANGER'),
    );

module.exports = {
    data: new SlashCommandBuilder()
        .setName('report')
        .setDescription('Report a user')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('User to report!')
                .setRequired(true)
            ,
        )
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('Where are they?')
                .setRequired(true)
            ,
        )
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('What are they doing?')
                .setRequired(true)
            ,
        ),
    async execute(interaction) {
        const actor = interaction.member.user;
        const target = interaction.options.getMember('user');
        const rchannel = interaction.options.getChannel('channel');
        const reason = interaction.options.getString('reason');
        const command = 'report';

        // Extract actor data
        const actor_results = await get_user_info(actor);
        const actor_data = actor_results[0];
        const actor_action = `${command}_sent`;


        // Transform actor data
        logger.debug(`[${PREFIX}] Found actor data, updating it`);
        if ('mod_actions' in actor_data) {
            actor_data.mod_actions[actor_action] = (actor_data.mod_actions[actor_action] || 0) + 1;
        }
        else {
            actor_data.mod_actions = { [actor_action]: 1 };
        }

        // Load actor data
        await set_user_info(actor_results[1], actor_data);

        // Extract target data
        const target_results = await get_user_info(target);
        const target_data = target_results[0];
        const target_action = `${command}_received`;

        // Transform target data
        logger.debug(`[${PREFIX}] Found target data, updating it`);
        if ('mod_actions' in target_data) {
            target_data.mod_actions[target_action] = (target_data.mod_actions[target_action] || 0) + 1;
        }
        else {
            target_data.mod_actions = { [target_action]: 1 };
        }

        // Load target data
        await set_user_info(target_results[1], target_data);

        const embed_mod = template.embed_template()
            .setDescription(`${actor} reported ${target} for ${reason} in ${rchannel}`)
            .addFields(
                { name: 'Username', value: `${target.user.username}#${target.user.discriminator}`, inline: true },
                { name: 'Nickname', value: `${target.nickname}`, inline: true },
                { name: 'ID', value: `${target.user.id}`, inline: true },
            )
            .addFields(
                { name: 'Account created', value: `${time(interaction.member.user.createdAt, 'R')}`, inline: true },
                { name: 'First joined', value: `${time(interaction.member.joinedAt, 'R')}`, inline: true },
                { name: 'Timeout until', value: `${time(interaction.member.communicationDisabledUntil, 'R')}`, inline: true },
            )
            .addFields(
                { name: 'Pending', value: `${target.pending}`, inline: true },
                { name: 'Moderatable', value: `${target.moderatable}`, inline: true },
                { name: 'Muted', value: `${target.isCommunicationDisabled()}`, inline: true },
            )
            .addFields(
                { name: 'Manageable', value: `${target.manageable}`, inline: true },
                { name: 'Bannable', value: `${target.bannable}`, inline: true },
                { name: 'Kickable', value: `${target.kickable}`, inline: true },
            )
            .addFields(
                { name: '# of Reports', value: `${target_data['reports_recv']}`, inline: true },
                { name: '# of Timeouts', value: `${target_data['timeouts']}`, inline: true },
                { name: '# of Warns', value: `${target_data['warns']}`, inline: true },
            )
            .addFields(
                { name: '# of Kicks', value: `${target_data['warns']}`, inline: true },
                { name: '# of Bans', value: `${target_data['bans']}`, inline: true },
                { name: '# of Fucks to give', value: '0', inline: true },
            );

        const mod_chan = interaction.client.channels.cache.get(channel_moderators_id);
        mod_chan.send({ embeds: [embed_mod], components: [mod_buttons] });

        const embed = template.embed_template()
            .setTitle('Thank you!')
            .setDescription(`${target} has been reported for ${reason} ${rchannel ? `in ${rchannel}` : ''}`);
        interaction.reply({ embeds: [embed], ephemeral: true });
        logger.debug(`[${PREFIX}] finished!`);
        return;
    },
};
