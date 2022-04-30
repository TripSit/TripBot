const { SlashCommandBuilder, time } = require('@discordjs/builders');
const { MessageActionRow, MessageButton } = require('discord.js');
const logger = require('../utils/logger.js');
const PREFIX = require('path').parse(__filename).name;
const db = global.db;
const users_db_name = process.env.users_db_name;
const channel_moderators_id = process.env.channel_moderators;
const template = require('../utils/embed_template');

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


        let actorData = {};
        let actorFBID = '';
        let targetData = {};
        let targetFBID = '';
        const snapshot = global.user_db;
        snapshot.forEach((doc) => {
            if (doc.value.discord_id === actor.id) {
                logger.debug(`[${PREFIX}] Found a actor match!`);
                // console.log(doc.id, '=>', doc.value);
                actorFBID = doc.key;
                logger.debug(`[${PREFIX}] actorFBID: ${actorFBID}`);
                actorData = doc.value;
            }
            if (doc.value.discord_id === target.id) {
                logger.debug(`[${PREFIX}] Found a target match!`);
                // console.log(doc.id, '=>', doc.value);
                targetFBID = doc.key;
                logger.debug(`[${PREFIX}] targetFBID: ${targetFBID}`);
                targetData = doc.value;
            }
        });
        const actor_action = `${command}_sent`;
        if (Object.keys(actorData).length === 0) {
            logger.debug(`[${PREFIX}] No actor data found, creating a blank one`);
            actorData = {
                discord_username: actor.user.username,
                discord_discriminator: actor.user.discriminator,
                discord_id: actor.user.id,
                isBanned: false,
                mod_actions: { [actor_action]: 1 },
            };
        }
        else {
            logger.debug(`[${PREFIX}] Found actor data, updating it`);
            if ('mod_actions' in actorData) {
                actorData.mod_actions[actor_action] = (actorData.mod_actions[actor_action] || 0) + 1;
            }
            else {
                actorData.mod_actions = { [actor_action]: 1 };
            }
        }
        logger.debug(`[${PREFIX}] actorFBID: ${actorFBID}`);

        if (actorFBID !== '') {
            logger.debug(`[${PREFIX}] Updating actor data`);
            try {
                await db.collection(users_db_name).doc(actorFBID).set(actorData);
            }
            catch (err) {
                logger.error(`[${PREFIX}] Error updating actor data: ${err}`);
            }
        }
        else {
            logger.debug(`[${PREFIX}] Creating actor data`);
            try {
                await db.collection(users_db_name).set(actorData);
            }
            catch (err) {
                logger.error(`[${PREFIX}] Error creating actor data: ${err}`);
            }
        }

        const target_action = `${command}_received`;
        if (Object.keys(targetData).length === 0) {
            logger.debug(`[${PREFIX}] No target data found, creating a blank one`);
            targetData = {
                discord_username: target.user.username,
                discord_discriminator: target.user.discriminator,
                discord_id: target.user.id,
                isBanned: false,
                mod_actions: { [target_action]: 1 },
            };
        }
        else {
            logger.debug(`[${PREFIX}] Found target data, updating it`);
            if ('mod_actions' in targetData) {
                targetData.mod_actions[target_action] = (targetData.mod_actions[target_action] || 0) + 1;
            }
            else {
                targetData.mod_actions = { [target_action]: 1 };
            }
        }
        logger.debug(`[${PREFIX}] targetFBID: ${targetFBID}`);

        if (targetFBID !== '') {
            logger.debug(`[${PREFIX}] Updating target data`);
            try {
                await db.collection(users_db_name).doc(targetFBID).set(targetData);
            }
            catch (err) {
                logger.error(`[${PREFIX}] Error updating target data: ${err}`);
            }
        }
        else {
            logger.debug(`[${PREFIX}] Creating target data`);
            try {
                await db.collection(users_db_name).doc().set(targetData);
            }
            catch (err) {
                logger.error(`[${PREFIX}] Error creating target data: ${err}`);
            }
        }

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
                { name: '# of Reports', value: `${targetData['reports_recv']}`, inline: true },
                { name: '# of Timeouts', value: `${targetData['timeouts']}`, inline: true },
                { name: '# of Warns', value: `${targetData['warns']}`, inline: true },
            )
            .addFields(
                { name: '# of Kicks', value: `${targetData['warns']}`, inline: true },
                { name: '# of Bans', value: `${targetData['bans']}`, inline: true },
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
