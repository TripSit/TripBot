const fs = require('node:fs');
const { SlashCommandBuilder, time } = require('@discordjs/builders');
const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');
const logger = require('../utils/logger.js');
const { getFirestore } = require('firebase-admin/firestore');

const PREFIX = require('path').parse(__filename).name;
if (process.env.NODE_ENV !== 'production') {require('dotenv').config();}
const ts_icon_url = process.env.ts_icon_url;
const channel_moderators_id = process.env.channel_moderators;

// const mod_buttons = new MessageActionRow()
//     .addComponents(
//         new MessageButton()
//             .setCustomId('warnbtn')
//             .setLabel('Warn')
//             .setStyle('PRIMARY'),
//         new MessageButton()
//             .setCustomId('timeoutbtn')
//             .setLabel('Timeout')
//             .setStyle('SECONDARY'),
//         new MessageButton()
//             .setCustomId('kickbtn')
//             .setLabel('Kick')
//             .setStyle('SECONDARY'),
//         new MessageButton()
//             .setCustomId('banbtn')
//             .setLabel('Ban')
//             .setStyle('DANGER'),
//     );

const warn_buttons = new MessageActionRow()
    .addComponents(
        new MessageButton()
            .setCustomId('acknowledgebtn')
            .setLabel('I understand, it wont happen again!')
            .setStyle('PRIMARY'),
        new MessageButton()
            .setCustomId('refusalbtn')
            .setLabel('Nah, I do what I want!')
            .setStyle('DANGER'),
    );

// const backButton = new MessageButton()
//     .setCustomId('previousbtn')
//     .setLabel('Previous')
//     .setStyle('DANGER');

// const forwardButton = new MessageButton()
//     .setCustomId('nextbtn')
//     .setLabel('Next')
//     .setStyle('SUCCESS');
// const buttonList = [
//     backButton,
//     forwardButton,
// ];

`BotMod
    User
        Warn
        Timeout
        Kick
        Ban
    Guild
        Warn
        Timeout
        Kick
        Ban`;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('mod')
        .setDescription('Moderation actions!')
        .addSubcommand(subcommand =>
            subcommand
                .setName('info')
                .setDescription('Info on a user')
                .addUserOption(option => option.setName('target').setDescription('User to warn!').setRequired(true)),
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('warn')
                .setDescription('Warn a user')
                .addUserOption(option => option.setName('target').setDescription('User to warn!').setRequired(true))
                .addStringOption(option => option.setName('reason').setDescription('Reason for warn!').setRequired(true)),
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('timeout')
                .setDescription('Timeout a user')
                .addUserOption(option => option.setName('target').setDescription('User to timeout!').setRequired(true))
                .addStringOption(option => option.setName('reason').setDescription('Reason for timeout!').setRequired(true))
                // .addStringOption(option => option.setName('duration').setDescription('Duration of timeout!').setRequired(true))
                .addStringOption(option => option.setName('toggle').setDescription('On off?').addChoice('On', 'on').addChoice('Off', 'off').setRequired(true)),
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('kick')
                .setDescription('Kick a user')
                .addUserOption(option => option.setName('target').setDescription('User to kick!').setRequired(true))
                .addStringOption(option => option.setName('reason').setDescription('Reason for kick!').setRequired(true)),
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('ban')
                .setDescription('Ban a user')
                .addUserOption(option => option.setName('target').setDescription('User to ban!').setRequired(true))
                .addStringOption(option => option.setName('reason').setDescription('Reason for ban!').setRequired(true))
                // .addStringOption(option => option.setName('duration').setDescription('Duration of ban!').setRequired(true))
                .addStringOption(option => option.setName('toggle').setDescription('On off?').addChoice('On', 'on').addChoice('Off', 'off').setRequired(true)),
        ),
    async execute(interaction) {
        const username = `${interaction.member.user.username}#${interaction.member.user.discriminator}`;
        const channel = interaction.channel.name;
        const guild = interaction.guild.name;
        logger.info(`[${PREFIX}] Initialized by ${username} in ${channel} on ${guild}!`);

        const actor = interaction.member;
        logger.debug(`[${PREFIX}] Actor: ${actor}`);
        let command = interaction.options.getSubcommand();
        logger.debug(`[${PREFIX}] Command: ${command}`);
        let target = interaction.options.getMember('target');
        logger.debug(`[${PREFIX}] target: ${target}`);
        const toggle = interaction.options.getString('toggle');
        logger.debug(`[${PREFIX}] toggle: ${toggle}`);
        const reason = interaction.options.getString('reason');
        logger.debug(`[${PREFIX}] reason: ${reason}`);
        // const duration = interaction.options.getString('duration');
        // logger.debug(`[${PREFIX}] duration: ${duration}`);

        let color = '';
        let is_member = true;
        if (toggle == 'off') {
            if (command === 'ban') {
                target = interaction.options.getUser('target');
                is_member = false;
                logger.debug(`[${PREFIX}] target_user.id: ${target.id}`);
                logger.debug(`[${PREFIX}] interaction.guild.bans.fetch(): ${await interaction.guild.bans.fetch()}`);
                command = 'unban';
                color = 'GREEN';
                await interaction.guild.bans.remove(target, reason);
                logger.debug(`[${PREFIX}] I unbanned ${target}!`);
            }
            else if (command === 'timeout') {
                target.timeout(0, reason);
                command = 'untimeout';
                color = 'GREEN';
                logger.debug(`[${PREFIX}] I untimed out ${target}!`);
            }
        }

        if (!target) {
            const embed = new MessageEmbed()
                .setColor('RED')
                .setDescription('target not found, are you sure they are in the server?');
            interaction.reply({ embeds: [embed], ephemeral: true });
            logger.debug(`[${PREFIX}] Target not found!`);
            return;
        }

        if (command === 'warn') {
            // Send a message to the target
            const warn_embed = new MessageEmbed()
                .setColor('YELLOW')
                .setTitle('Warned!')
                .setDescription(`You have been warned by Team TripSit for ${reason}.\n\nPlease read the rules and be respectful of them.`)
                .setTimestamp();
            target.send({ embeds: [warn_embed], components: [warn_buttons] });
            color = 'BLUE';
            logger.debug(`[${PREFIX}] I warned ${target}!`);
        }
        else if (command === 'timeout') {
            // target.timeout(duration * 60 * 1000, reason);
            target.timeout(10, reason);
            color = 'YELLOW';
            logger.debug(`[${PREFIX}] I timed out ${target}!`);
        }
        else if (command === 'kick') {
            target.kick();
            color = 'ORANGE';
            logger.debug(`[${PREFIX}] I kicked ${target}!`);
        }
        else if (command === 'ban') {
            interaction.guild.members.ban(target, { days: 7, reason: reason });
            color = 'RED';
            logger.debug(`[${PREFIX}] I banned ${target}!`);
        }

        if (command !== 'info') {
            // const title = `I have ${command}ed ${target} ${duration ? `for ${duration}` : ''} ${reason ? `because ${reason}` : ''}`;
            const title = `I have ${command}ed ${target} ${reason ? `because ${reason}` : ''}`;
            const embed = new MessageEmbed()
                .setColor(color)
                .setDescription(title);
            interaction.reply({ embeds: [embed], ephemeral: true });
            logger.debug(`[${PREFIX}] I replied to ${interaction.member}!`);
        }

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


        // const title = `${actor} ${command}ed ${target} ${duration ? `for ${duration}` : ''} ${reason ? `because ${reason}` : ''}`;
        const title = `${actor} ${command}ed ${target} ${reason ? `because ${reason}` : ''}`;
        // const book = [];
        const target_embed = new MessageEmbed()
            .setAuthor({ name: 'TripSit.Me ', url: 'http://www.tripsit.me', iconURL: ts_icon_url })
            .setColor('BLUE')
            .setDescription(title)
            .addFields(
                { name: 'Username', value: `${is_member ? target.user.username : target.username }#${is_member ? target.user.discriminator : target.discriminator}`, inline: true },
                { name: 'Nickname', value: `${target.nickname}`, inline: true },
                { name: 'ID', value: `${is_member ? target.user.id : target.id}`, inline: true },
            )
            .addFields(
                { name: 'Account created', value: `${is_member ? time(target.user.createdAt, 'R') : time(target.createdAt, 'R')}`, inline: true },
                { name: 'Joined', value: `${time(target.joinedAt, 'R')}`, inline: true },
                { name: 'Timeout until', value: `${time(target.communicationDisabledUntil, 'R')}`, inline: true },
            )
            .addFields(
                { name: 'Pending', value: `${target.pending}`, inline: true },
                { name: 'Moderatable', value: `${target.moderatable}`, inline: true },
                { name: 'Muted', value: `${is_member ? target.isCommunicationDisabled() : 'banned'}`, inline: true },
            )
            .addFields(
                { name: 'Manageable', value: `${target.manageable}`, inline: true },
                { name: 'Bannable', value: `${target.bannable}`, inline: true },
                { name: 'Kickable', value: `${target.kickable}`, inline: true },
            )
            .addFields(
                { name: '# of Reports', value: `${targetData['reports_recv'] ? targetData['reports_recv'] : 0 }`, inline: true },
                { name: '# of Timeouts', value: `${targetData['timeout_recv'] ? targetData['timeout_recv'] : 0 }`, inline: true },
                { name: '# of Warns', value: `${targetData['warn_recv'] ? targetData['warn_recv'] : 0 }`, inline: true },
            )
            .addFields(
                { name: '# of Kicks', value: `${targetData['kick_recv'] ? targetData['kick_recv'] : 0 }`, inline: true },
                { name: '# of Bans', value: `${targetData['ban_recv'] ? targetData['ban_recv'] : 0 }`, inline: true },
                { name: '# of Fucks to give', value: '0', inline: true },
            );
        // book.push(target_embed);

        // const actor_embed = new MessageEmbed()
        //     .setAuthor({ name: 'TripSit.Me ', url: 'http://www.tripsit.me', iconURL: ts_icon_url })
        //     .setColor('BLUE')
        //     .setDescription(title)
        //     .addFields(
        //         { name: 'Username', value: `${is_member ? actor.user.username : actor.username }#${is_member ? actor.user.discriminator : actor.discriminator}`, inline: true },
        //         { name: 'Nickname', value: `${actor.nickname}`, inline: true },
        //         { name: 'ID', value: `${is_member ? actor.user.id : actor.id}`, inline: true },
        //     )
        //     .addFields(
        //         { name: 'Account created', value: `${is_member ? time(actor.user.createdAt, 'R') : time(actor.createdAt, 'R')}`, inline: true },
        //         { name: 'Joined', value: `${time(actor.joinedAt, 'R')}`, inline: true },
        //         { name: 'Timeout until', value: `${time(actor.communicationDisabledUntil, 'R')}`, inline: true },
        //     )
        //     .addFields(
        //         { name: 'Pending', value: `${actor.pending}`, inline: true },
        //         { name: 'Moderatable', value: `${actor.moderatable}`, inline: true },
        //         { name: 'Muted', value: `${actor.isCommunicationDisabled()}`, inline: true },
        //     )
        //     .addFields(
        //         { name: 'Manageable', value: `${actor.manageable}`, inline: true },
        //         { name: 'Bannable', value: `${actor.bannable}`, inline: true },
        //         { name: 'Kickable', value: `${actor.kickable}`, inline: true },
        //     )
        //     .addFields(
        //         { name: '# of Reports', value: `${actorData['reports_recv']}`, inline: true },
        //         { name: '# of Timeouts', value: `${actorData['timeout_recv']}`, inline: true },
        //         { name: '# of Warns', value: `${actorData['warn_recv']}`, inline: true },
        //     )
        //     .addFields(
        //         { name: '# of Kicks', value: `${actorData['kick_recv']}`, inline: true },
        //         { name: '# of Bans', value: `${actorData['ban_recv']}`, inline: true },
        //         { name: '# of Fucks to give', value: '0', inline: true },
        //     );
        // book.push(actor_embed);

        // if (book.length > 0) {
        //     if (command == 'info') {
        //         interaction.reply({ embeds: [target_embed], ephemeral: true });
        //         return;
        //     }
        //     const mod_chan = interaction.client.channels.cache.get(channel_moderators_id);
        //     // mod_chan.send(paginationEmbed(interaction, book, page_buttons));
        //     // mod_chan.send({ embeds: [target_embed] });
        //     // mod_chan.send(paginationEmbed(interaction, book, buttonList));
        //     // mod_chan.send({ embeds: [paginationEmbed(interaction, book, buttonList)] });
        //     return;
        // }
        // else {
        //     const embed = new MessageEmbed()
        //         .setColor('RANDOM')
        //         .setDescription('Done!');
        //     return interaction.reply({ embeds: [embed] });
        // }

        if (command == 'info') {
            // interaction.reply({ embeds: [target_embed], ephemeral: true, components: [mod_buttons] });
            interaction.reply({ embeds: [target_embed], ephemeral: true });
            logger.debug(`${PREFIX} replied to user ${interaction.member.user.name} with info about ${target.user.name}`);
            return;
        }
        logger.debug(`${PREFIX} channel_moderators_id: ${channel_moderators_id}`);
        const mod_chan = interaction.client.channels.cache.get(channel_moderators_id);
        // mod_chan.send({ embeds: [target_embed], components: [mod_buttons] });
        mod_chan.send({ embeds: [target_embed] });
        logger.debug(`${PREFIX} send a message to the moderators room`);
        return;
    },
};
