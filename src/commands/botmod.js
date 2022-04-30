const { SlashCommandBuilder, time } = require('@discordjs/builders');
const { MessageActionRow, MessageButton } = require('discord.js');
const db = global.db;
const logger = require('../utils/logger.js');
const PREFIX = require('path').parse(__filename).name;
if (process.env.NODE_ENV !== 'production') {require('dotenv').config();}
const template = require('../utils/embed_template');
const guild_db_name = process.env.guild_db_name;
// const users_db_name = process.env.users_db_name;

const warn_buttons = new MessageActionRow()
    .addComponents(
        new MessageButton()
            .setCustomId('guildacknowledgebtn')
            .setLabel('I understand, it wont happen again!')
            .setStyle('PRIMARY'),
    );

module.exports = {
    data: new SlashCommandBuilder()
        .setName('botmod')
        .setDescription('Bot Mod Actions!')
        .addSubcommandGroup(subcommandgroup =>
            subcommandgroup
                .setName('guild')
                .setDescription('Bot mod guilds')
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('info')
                        .setDescription('Info on an ID')
                        .addStringOption(option => option.setName('target').setDescription('User to warn!').setRequired(true)),
                )
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('warn')
                        .setDescription('Warn an ID')
                        .addStringOption(option => option.setName('target').setDescription('User to warn!').setRequired(true))
                        .addStringOption(option => option.setName('reason').setDescription('Reason for warn!').setRequired(true)),
                )
                // .addSubcommand(subcommand =>
                //     subcommand
                //         .setName('timeout')
                //         .setDescription('Timeout an ID')
                //         .addStringOption(option => option.setName('target').setDescription('User to timeout!').setRequired(true))
                //         .addStringOption(option => option.setName('reason').setDescription('Reason for timeout!').setRequired(true))
                //         .addStringOption(option => option.setName('toggle').setDescription('On off?').addChoice('On', 'on').addChoice('Off', 'off').setRequired(true)),
                // )
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('kick')
                        .setDescription('Kick an ID')
                        .addStringOption(option => option.setName('target').setDescription('User to kick!').setRequired(true))
                        .addStringOption(option => option.setName('reason').setDescription('Reason for kick!').setRequired(true)),
                )
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('ban')
                        .setDescription('Ban an ID')
                        .addStringOption(option => option.setName('target').setDescription('User to ban!').setRequired(true))
                        .addStringOption(option => option.setName('reason').setDescription('Reason for ban!').setRequired(true))
                        .addStringOption(option => option.setName('toggle').setDescription('On off?').addChoice('On', 'on').addChoice('Off', 'off').setRequired(true)),
                ),
        )
        .addSubcommandGroup(subcommandgroup =>
            subcommandgroup
                .setName('user')
                .setDescription('Bot mod users')
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('info')
                        .setDescription('Info on an ID')
                        .addStringOption(option => option.setName('target').setDescription('User to warn!').setRequired(true)),
                )
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('warn')
                        .setDescription('Warn an ID')
                        .addStringOption(option => option.setName('target').setDescription('User to warn!').setRequired(true))
                        .addStringOption(option => option.setName('reason').setDescription('Reason for warn!').setRequired(true)),
                )
                // .addSubcommand(subcommand =>
                //     subcommand
                //         .setName('timeout')
                //         .setDescription('Timeout an ID')
                //         .addStringOption(option => option.setName('target').setDescription('User to timeout!').setRequired(true))
                //         .addStringOption(option => option.setName('reason').setDescription('Reason for timeout!').setRequired(true))
                //         .addStringOption(option => option.setName('toggle').setDescription('On off?').addChoice('On', 'on').addChoice('Off', 'off').setRequired(true)),
                // )
                // .addSubcommand(subcommand =>
                //     subcommand
                //         .setName('kick')
                //         .setDescription('Kick an ID')
                //         .addStringOption(option => option.setName('target').setDescription('User to kick!').setRequired(true))
                //         .addStringOption(option => option.setName('reason').setDescription('Reason for kick!').setRequired(true)),
                // )
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('ban')
                        .setDescription('Ban an ID')
                        .addStringOption(option => option.setName('target').setDescription('User to ban!').setRequired(true))
                        .addStringOption(option => option.setName('reason').setDescription('Reason for ban!').setRequired(true))
                    // .addStringOption(option => option.setName('duration').setDescription('Duration of ban!').setRequired(true))
                        .addStringOption(option => option.setName('toggle').setDescription('On off?').addChoice('On', 'on').addChoice('Off', 'off').setRequired(true)),
                ),
        ),
    async execute(interaction) {
        const actor = interaction.member;
        logger.debug(`[${PREFIX}] Actor: ${actor}`);
        const command = interaction.options.getSubcommand();
        logger.debug(`[${PREFIX}] Command: ${command}`);
        const group = interaction.options.getSubcommandGroup();
        logger.debug(`[${PREFIX}] Group: ${group}`);
        const target_id = interaction.options.getString('target');
        logger.debug(`[${PREFIX}] target: ${target_id}`);
        const toggle = interaction.options.getString('toggle');
        logger.debug(`[${PREFIX}] toggle: ${toggle}`);
        const reason = interaction.options.getString('reason');
        logger.debug(`[${PREFIX}] reason: ${reason}`);

        let color = '';
        if (group === 'guild') {
            let target_guild = {};
            let target_guild_owner = {};
            try {
                target_guild = await interaction.client.guilds.fetch(target_id);
                target_guild_owner = interaction.client.users.cache.get(target_guild.ownerId);
            }
            catch (e) {
                interaction.reply('Invalid Guild ID, or i\'m not in that guild!');
                return;
            }
            let targetData = {};
            let targetFBID = '';
            const snapshot = global.guild_db;
            snapshot.forEach((doc) => {
                if (doc.value.guild_id === target_id) {
                    logger.debug(`[${PREFIX}] Found a target match!`);
                    // console.log(doc.id, '=>', doc.value);
                    targetFBID = doc.key;
                    logger.debug(`[${PREFIX}] targetFBID: ${targetFBID}`);
                    targetData = doc.value;
                }
            });
            const target_action = `${command}_received`;
            if (Object.keys(targetData).length === 0) {
                logger.debug(`[${PREFIX}] No target data found, creating a blank one`);
                targetData = {
                    guild_name: target_guild.name,
                    guild_nameAcronym: target_guild.nameAcronym,
                    guild_id: target_guild.id,
                    guild_createdAt: target_guild.createdAt,
                    guild_createdTimestamp: target_guild.createdTimestamp,
                    guild_joinedAt: target_guild.joinedAt,
                    guild_joinedTimestamp: target_guild.joinedTimestamp,
                    guild_description: `${target_guild.description ? target_guild.description : 'No description'}`,
                    guild_member_count: target_guild.memberCount,
                    guild_owner_id: target_guild.ownerId,
                    guild_owner_name: target_guild_owner.username,
                    guild_icon: target_guild.iconURL(),
                    guild_banned: false,
                    guild_large: target_guild.large,
                    guild_nsfw: target_guild.nsfwLevel,
                    guild_partner: target_guild.partnered,
                    guild_preferredLocale: `${target_guild.preferredLocale ? target_guild.preferredLocale : 'No Locale'}`,
                    guild_region: `${target_guild.region ? target_guild.region : 'No region'}`,
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

            logger.debug(`[${PREFIX}] targetData: ${JSON.stringify(targetData)}`);
            if (command === 'warn') {
                color = 'YELLOW';
                const warn_embed = template.embed_template()
                    .setColor(color)
                    .setTitle('Warned!')
                    .setDescription(`Your guild has warned by Team TripSit for ${reason}.\n\nPlease read the rules and be respectful of them.\n\nContact Moonbear if you have any questions!`);
                target_guild_owner.send({ embeds: [warn_embed], components: [warn_buttons] });
                logger.debug(`[${PREFIX}] I warned ${target_guild}'s owner ${target_guild_owner}!`);
            }
            else if (command === 'kick') {
                target_guild.leave();
                color = 'ORANGE';
                const warn_embed = template.embed_template()
                    .setColor(color)
                    .setTitle('Kicked!')
                    .setDescription(`I have left your guild because ${reason}.\n\nYou have the option to re-add me, but please read the rules and be respectful of them.\n\nContact Moonbear if you have any questions!`);
                target_guild_owner.send({ embeds: [warn_embed], components: [warn_buttons] });
                logger.debug(`[${PREFIX}] I left ${target_guild}!`);
            }
            else if (command === 'ban') {
                if (toggle == 'on') {
                    if (targetData.isBanned) {
                        const embed = template.embed_template()
                            .setColor('GREEN')
                            .setTitle('Guild Already Banned')
                            .addFields(
                                { name: 'Guild ID', value: target_id },
                            );
                        return interaction.reply({ embeds: [embed] });
                    }

                    targetData.guild_banned = true;
                    target_guild.leave();
                    color = 'RED';
                    const warn_embed = template.embed_template()
                        .setColor(color)
                        .setTitle('Banned!')
                        .setDescription(`I have left your guild permenantly because ${reason}.\n\nContact Moonbear if you have any questions!`);
                    target_guild_owner.send({ embeds: [warn_embed] });
                    logger.debug(`[${PREFIX}] I banned ${target_guild}!`);
                }
                else if (toggle == 'off') {
                    if (!targetData.isBanned) {
                        const embed = template.embed_template()
                            .setColor('GREEN')
                            .setTitle('Guild Not Banned')
                            .addFields(
                                { name: 'Guild ID', value: target_id },
                            );
                        return interaction.reply({ embeds: [embed] });
                    }

                    targetData.guild_banned = false;
                    color = 'GREEN';
                    const warn_embed = template.embed_template()
                        .setColor(color)
                        .setTitle('Unbanned!')
                        .setDescription(`I have unbanned your guild because ${reason}.\n\nContact Moonbear if you have any questions!`);
                    target_guild_owner.send({ embeds: [warn_embed] });
                    logger.debug(`[${PREFIX}] I unbanned ${target_guild}!`);
                }
            }
            logger.debug(`[${PREFIX}] targetFBID: ${targetFBID}`);

            if (targetFBID !== '') {
                logger.debug(`[${PREFIX}] Updating target guild data`);
                try {
                    await db.collection(guild_db_name).doc(targetFBID).set(targetData);
                }
                catch (err) {
                    logger.error(`[${PREFIX}] Error updating guild data, make sure this is expected: ${err}`);
                }
            }
            else {
                logger.debug(`[${PREFIX}] Creating target guild data`);
                try {
                    await db.collection(guild_db_name).doc().set(targetData);
                }
                catch (err) {
                    logger.error(`[${PREFIX}] Error creating guild data, make sure this is expected: ${err}`);
                }
            }

            if (command !== 'info') {
                const title = `I have ${command}ed ${target_guild} ${reason ? `because ${reason}` : ''}`;
                const embed = template.embed_template()
                    .setColor(color)
                    .setDescription(title);
                interaction.reply({ embeds: [embed], ephemeral: true });
                logger.debug(`[${PREFIX}] I replied to ${interaction.member}!`);
                return;
            }

            const title = `${actor} ${command}ed ${target_guild} ${reason ? `because ${reason}` : ''}`;
            const target_embed = template.embed_template()
                .setColor('BLUE')
                .setDescription(title)
                .addFields(
                    { name: 'Guild Name', value: `${targetData.guild_name}`, inline: true },
                    { name: 'Guild Acronym', value: `${targetData.guild_nameAcronym}`, inline: true },
                    { name: 'Guild ID', value: `${targetData.guild_id}`, inline: true },
                )
                .addFields(
                    { name: 'Guild Created', value: `${time(targetData.createdAt, 'R')}`, inline: true },
                    { name: 'Guild Joined', value: `${time(targetData.joinedAt, 'R')}`, inline: true },
                    { name: 'Guild Description', value: `${targetData.guild_description}`, inline: true },
                )
                .addFields(
                    { name: 'guild_member_count', value: `${targetData.guild_member_count}`, inline: true },
                    { name: 'guild_owner_id', value: `${targetData.guild_owner_id}`, inline: true },
                    { name: 'guild_owner_name', value: `${targetData.guild_owner_name}`, inline: true },
                )
                .addFields(
                    { name: 'guild_banned', value: `${targetData.guild_banned}`, inline: true },
                    { name: 'guild_large', value: `${targetData.guild_large}`, inline: true },
                    { name: 'guild_nsfw', value: `${targetData.guild_nsfw}`, inline: true },
                )
                .addFields(
                    { name: 'guild_partner', value: `${targetData.guild_partner}`, inline: true },
                    { name: 'guild_preferredLocale', value: `${targetData.guild_preferredLocale}`, inline: true },
                    { name: 'guild_region', value: `${targetData.guild_region}`, inline: true },
                );

            if (command == 'info') {
                interaction.reply({ embeds: [target_embed], ephemeral: true });
                logger.debug(`${PREFIX} replied to user ${interaction.member.user.name} with info about ${targetData.guild_name}`);
                logger.debug(`[${PREFIX}] finished!`);
                return;
            }

            // logger.debug(`${PREFIX} channel_moderators_id: ${channel_moderators_id}`);
            // const mod_chan = interaction.client.channels.cache.get(channel_moderators_id);
            // // mod_chan.send({ embeds: [target_embed], components: [mod_buttons] });
            // mod_chan.send({ embeds: [target_embed] });
            // logger.debug(`${PREFIX} send a message to the moderators room`);
            logger.debug(`[${PREFIX}] finished!`);
            return;
        }
    },
};
