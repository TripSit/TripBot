const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const logger = require('../utils/logger.js');
const db = global.db;
if (process.env.NODE_ENV !== 'production') {require('dotenv').config();}
const ts_icon_url = process.env.ts_icon_url;
const role_needshelp = process.env.role_needshelp;
const ts_flame_url = process.env.ts_flame_url;
const PREFIX = require('path').parse(__filename).name;
const users_db_name = process.env.users_db_name;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('tripsit')
        .setDescription('Check substance information')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('Member to help')
            ,
        )
        .addStringOption(option =>
            option.setName('enable')
                .setDescription('On or Off?')
                .addChoice('On', 'On')
                .addChoice('Off', 'Off')
            ,
        ),
    async execute(interaction) {
        const needsHelpRole = interaction.guild.roles.cache.find(role => role.id === role_needshelp);
        // Actor information
        const actor = interaction.member;
        const actorid = actor.id.toString();
        logger.debug(`[${PREFIX}] actorid: ${actorid}`);
        const actorRoles = actor.roles.cache;
        const actorRoleNames = actorRoles.map(role => role.name);
        logger.debug(`[${PREFIX}] actorRoleNames: ${actorRoleNames}`);

        // Target Informatiion
        let target = interaction.options.getMember('user');
        let user_provided = true;
        // Default to the user who invoked the command if no user is provided
        if (!target) {
            logger.debug(`[${PREFIX}] No user provided, defaulting to ${interaction.member}`);
            target = interaction.member;
            user_provided = false;
        }
        logger.debug(`[${PREFIX}] target: ${target.user.username}#${target.user.discriminator}`);
        const targetid = target.id.toString();
        logger.debug(`[${PREFIX}] targetid: ${targetid}`);
        const targetRoles = target.roles.cache;
        const targetRoleNames = targetRoles.map(role => role.name);
        logger.debug(`[${PREFIX}] targetRoleNames: ${targetRoleNames}`);
        // Loop through userRoles and check if the target has the needsHelp role
        const targetHasNeedsHelpRole = targetRoleNames.some(role => role === needsHelpRole.name);
        logger.debug(`[${PREFIX}] targetHasNeedsHelpRole: ${targetHasNeedsHelpRole}`);


        let enable = interaction.options.getString('enable');
        // Default to on if no setting is provided
        if (!enable) {enable = 'On';}
        logger.debug(`[${PREFIX}] enable: ${enable}`);

        const command = 'tripsit';
        if (enable == 'On') {
            if (targetHasNeedsHelpRole) {
                const embed = new MessageEmbed()
                    .setAuthor({ name: 'TripSit.Me ', url: 'http://www.tripsit.me', iconURL: ts_icon_url })
                    .setColor('DARK_BLUE')
                    .setFooter({ text: 'Thanks for using Tripsit.Me!', iconURL: ts_flame_url });
                if (user_provided) {embed.setDescription(`Hey ${interaction.member}, ${target.user.username} is already being helped!\n\nCheck your channel list for '${target.user.username} discuss here!'`);}
                else {embed.setDescription(`Hey ${interaction.member}, you're already being helped!\n\nCheck your channel list for '${target.user.username} chat here!'`);}
                logger.debug(`[${PREFIX}] target ${target} is already being helped!`);
                interaction.reply({ embeds: [embed], ephemeral: true });
                logger.debug(`[${PREFIX}] finished!`);
                return;
            }
            if (!targetHasNeedsHelpRole) {
                // Team check
                targetRoleNames.forEach(role => {
                    if (role === 'Admin' || role === 'Operator' || role === 'Moderator' || role === 'Tripsitter') {
                        const embed = new MessageEmbed()
                            .setAuthor({ name: 'TripSit.Me ', url: 'http://www.tripsit.me', iconURL: ts_icon_url })
                            .setColor('DARK_BLUE')
                            .setDescription('This user is a member of the team and cannot be helped!')
                            .setFooter({ text: 'Thanks for using Tripsit.Me!', iconURL: ts_flame_url });
                        interaction.reply({ embeds: [embed], ephemeral: true });
                        logger.debug(`[${PREFIX}] finished!`);
                        return;
                    }
                });

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
                        roles: [actorRoleNames],
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
                    actorData.roles = actorRoleNames;
                }
                logger.debug(`[${PREFIX}] actorFBID: ${actorFBID}`);

                if (actorFBID !== '') {
                    logger.debug(`[${PREFIX}] Updating actor data`);
                    try {
                        await db.collection(users_db_name).doc(actorFBID).set(actorData);
                    }
                    catch (error) {
                        logger.error(`[${PREFIX}] Error updating actor data: ${error}`);
                    }
                }
                else {
                    logger.debug(`[${PREFIX}] Creating actor data`);
                    try {
                        await db.collection(users_db_name).doc().set(actorData);
                    }
                    catch (error) {
                        logger.error(`[${PREFIX}] Error creating actor data: ${error}`);
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
                        roles: targetRoleNames,
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
                    targetData.roles = targetRoleNames;
                }
                logger.debug(`[${PREFIX}] targetFBID: ${targetFBID}`);

                if (targetFBID !== '') {
                    logger.debug(`[${PREFIX}] Updating target data`);
                    try {
                        await db.collection(users_db_name).doc(targetFBID).set(targetData);
                    }
                    catch (error) {
                        logger.error(`[${PREFIX}] Error updating target data: ${error}`);
                    }
                }
                else {
                    logger.debug(`[${PREFIX}] Creating target data`);
                    try {
                        await db.collection(users_db_name).doc().set(targetData);
                    }
                    catch (error) {
                        logger.error(`[${PREFIX}] Error creating target data: ${error}`);
                    }
                }

                // Remove all roles from the target
                targetRoles.forEach(role => {
                    if (role.name !== '@everyone') {
                        logger.debug(`[${PREFIX}] Removing role ${role.name} from ${target.user.username}`);
                        target.roles.remove(role);
                    }
                });

                // Get the needshelp role object and add it to the target
                logger.debug(`[${PREFIX}] Adding role ${needsHelpRole.name} to ${target.user.username}`);
                target.roles.add(needsHelpRole);
                const embed = new MessageEmbed()
                    .setAuthor({ name: 'TripSit.Me ', url: 'http://www.tripsit.me', iconURL: ts_icon_url })
                    .setColor('DARK_BLUE')
                    .setFooter({ text: 'Thanks for using Tripsit.Me!', iconURL: ts_flame_url });
                if (user_provided) {embed.setDescription(`Hey ${interaction.member}, Thanks for the heads up, we'll be helping ${target.user.username} shortly!\n\nCheck your channel list for '${target.user.username} discuss here!'`);}
                else {embed.setDescription(`Hey ${interaction.member}, thanks for reaching out!\n\nCheck your channel list for '${target.user.username} chat here!'`);}
                logger.debug(`[${PREFIX}] target ${target} is now being helped!`);
                interaction.reply({ embeds: [embed], ephemeral: true });
                logger.debug(`[${PREFIX}] finished!`);
                return;
            }

        }
        if (enable == 'Off') {
            if (targetHasNeedsHelpRole) {
                let targetData = {};
                let targetFBID = '';
                const snapshot = global.user_db;
                snapshot.forEach((doc) => {
                    if (doc.value.discord_id === target.id) {
                        logger.debug(`[${PREFIX}] Found a target match!`);
                        // console.log(doc.id, '=>', doc.value);
                        targetFBID = doc.key;
                        logger.debug(`[${PREFIX}] targetFBID: ${targetFBID}`);
                        targetData = doc.value;
                    }
                });

                // For each role in targetRoles2, add it to the target
                if (targetData.roles) {
                    targetData.roles.forEach(role_name => {
                        if (role_name !== '@everyone') {
                            const roleObj = interaction.guild.roles.cache.find(r => r.name === role_name);
                            logger.debug(`[${PREFIX}] Adding role ${roleObj.name} to ${target.user.username}`);
                            target.roles.add(roleObj);
                        }
                    });
                }

                await target.roles.remove(needsHelpRole);
                const output = `Removed ${needsHelpRole.name} from ${target.user.username}`;
                logger.debug(`[${PREFIX}] ${output}`);

                const embed = new MessageEmbed()
                    .setAuthor({ name: 'TripSit.Me ', url: 'http://www.tripsit.me', iconURL: ts_icon_url })
                    .setColor('DARK_BLUE')
                    .setFooter({ text: 'Thanks for using Tripsit.Me!', iconURL: ts_flame_url });
                if (user_provided) {embed.setDescription(`Hey ${interaction.member}, we're glad ${target.user.username} is feeling better, we've restored their old roles!`);}
                else {embed.setDescription(`Hey ${interaction.member}, we're glad you're feeling better, we've restored your old roles, happy chatting!`);}
                logger.debug(`[${PREFIX}] target ${target} is no longer being helped!`);
                interaction.reply({ embeds: [embed], ephemeral: true });
                logger.debug(`[${PREFIX}] finished!`);
                return;
            }
            else {
                const embed = new MessageEmbed()
                    .setAuthor({ name: 'TripSit.Me ', url: 'http://www.tripsit.me', iconURL: ts_icon_url })
                    .setColor('DARK_BLUE')
                    .setFooter({ text: 'Thanks for using Tripsit.Me!', iconURL: ts_flame_url });
                if (user_provided) {embed.setDescription(`Hey ${interaction.member}, ${target.user.username} isnt currently being taken care of!`);}
                else {embed.setDescription(`Hey ${interaction.member}, you're not currently being taken care of!`);}
                logger.debug(`[${PREFIX}] target ${target} does not need help!`);
                interaction.reply({ embeds: [embed], ephemeral: true });
                logger.debug(`[${PREFIX}] finished!`);
                return;
            }
        }
    },
};
