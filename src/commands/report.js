const fs = require('node:fs');
const { SlashCommandBuilder, time } = require('@discordjs/builders');
const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');
const logger = require('../utils/logger.js');
const PREFIX = require('path').parse(__filename).name;
const { getFirestore } = require('firebase-admin/firestore');
if (process.env.NODE_ENV !== 'production') {require('dotenv').config();}
const ts_icon_url = process.env.ts_icon_url;
const channel_moderators_id = process.env.channel_moderators;

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
        const username = `${interaction.member.user.username}#${interaction.member.user.discriminator}`;
        const channel = interaction.channel.name;
        const guild = interaction.guild.name;
        logger.info(`[${PREFIX}] Initialized by ${username} in ${channel} on ${guild}!`);

        const actor = interaction.member.user;
        const target = interaction.options.getMember('user');
        const rchannel = interaction.options.getChannel('channel');
        const reason = interaction.options.getString('reason');
        const command = 'report';

        const db = getFirestore();

        let actorData = {};
        let actorFBID = '';
        let targetData = {};
        let targetFBID = '';
        const snapshot = await db.collection('users').get();
        snapshot.forEach((doc) => {
            if (doc.data().discord_id === actor.id) {
                logger.debug(`[${PREFIX}] Found a actor match!`);
                // console.log(doc.id, '=>', doc.data());
                actorFBID = doc.id;
                logger.debug(`[${PREFIX}] actorFBID: ${actorFBID}`);
                actorData = doc.data();
            }
            if (doc.data().discord_id === target.id) {
                logger.debug(`[${PREFIX}] Found a target match!`);
                // console.log(doc.id, '=>', doc.data());
                targetFBID = doc.id;
                logger.debug(`[${PREFIX}] targetFBID: ${targetFBID}`);
                targetData = doc.data();
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
            await db.collection('users').doc(actorFBID).set(actorData);
        }
        else {
            logger.debug(`[${PREFIX}] Creating actor data`);
            await db.collection('users').doc().set(actorData);
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
            await db.collection('users').doc(targetFBID).set(targetData);
        }
        else {
            logger.debug(`[${PREFIX}] Creating target data`);
            await db.collection('users').doc().set(targetData);
        }

        const embed_mod = new MessageEmbed()
            .setAuthor({ name: 'TripSit.Me ', url: 'http://www.tripsit.me', iconURL: target.displayAvatarURL })
            .setColor('RANDOM')
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

        const embed = new MessageEmbed()
            .setAuthor({ name: 'TripSit.Me ', url: 'http://www.tripsit.me', iconURL: ts_icon_url })
            .setColor('RANDOM')
            .setTitle('Thank you!')
            .setDescription(`${target} has been reported for ${reason} ${rchannel ? `in ${rchannel}` : ''}`);
        return interaction.reply({ embeds: [embed], ephemeral: true });
    },
};
