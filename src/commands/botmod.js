const { SlashCommandBuilder, time } = require('@discordjs/builders');
const { MessageActionRow, MessageButton } = require('discord.js');
const logger = require('../utils/logger.js');
const PREFIX = require('path').parse(__filename).name;
if (process.env.NODE_ENV !== 'production') {require('dotenv').config();}
const template = require('../utils/embed_template');
const { get_guild_info } = require('../utils/get_user_info');
const { set_guild_info } = require('../utils/set_user_info');

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

            // Extract target guild info
            const target_action = `${command}_received`;
            const target_results = await get_guild_info(target_guild);
            const target_data = target_results[0];

            // Transform target guild info
            if ('mod_actions' in target_data) {
                target_data.mod_actions[target_action] = (target_data.mod_actions[target_action] || 0) + 1;
            }
            else {
                target_data.mod_actions = { [target_action]: 1 };
            }
            logger.debug(`[${PREFIX}] target_data: ${JSON.stringify(target_data)}`);

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
                    if (target_data.isBanned) {
                        const embed = template.embed_template()
                            .setColor('GREEN')
                            .setTitle('Guild Already Banned')
                            .addFields(
                                { name: 'Guild ID', value: target_id },
                            );
                        return interaction.reply({ embeds: [embed] });
                    }

                    target_data.guild_banned = true;
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
                    if (!target_data.isBanned) {
                        const embed = template.embed_template()
                            .setColor('GREEN')
                            .setTitle('Guild Not Banned')
                            .addFields(
                                { name: 'Guild ID', value: target_id },
                            );
                        return interaction.reply({ embeds: [embed] });
                    }

                    target_data.guild_banned = false;
                    color = 'GREEN';
                    const warn_embed = template.embed_template()
                        .setColor(color)
                        .setTitle('Unbanned!')
                        .setDescription(`I have unbanned your guild because ${reason}.\n\nContact Moonbear if you have any questions!`);
                    target_guild_owner.send({ embeds: [warn_embed] });
                    logger.debug(`[${PREFIX}] I unbanned ${target_guild}!`);
                }
            }

            // Load target guild info
            // Load actor data
            await set_guild_info(target_results[1], target_data);

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
                    { name: 'Guild Name', value: `${target_data.guild_name}`, inline: true },
                    { name: 'Guild Acronym', value: `${target_data.guild_nameAcronym}`, inline: true },
                    { name: 'Guild ID', value: `${target_data.guild_id}`, inline: true },
                )
                .addFields(
                    { name: 'Guild Created', value: `${time(target_data.createdAt, 'R')}`, inline: true },
                    { name: 'Guild Joined', value: `${time(target_data.joinedAt, 'R')}`, inline: true },
                    { name: 'Guild Description', value: `${target_data.guild_description}`, inline: true },
                )
                .addFields(
                    { name: 'guild_member_count', value: `${target_data.guild_member_count}`, inline: true },
                    { name: 'guild_owner_id', value: `${target_data.guild_owner_id}`, inline: true },
                    { name: 'guild_owner_name', value: `${target_data.guild_owner_name}`, inline: true },
                )
                .addFields(
                    { name: 'guild_banned', value: `${target_data.guild_banned}`, inline: true },
                    { name: 'guild_large', value: `${target_data.guild_large}`, inline: true },
                    { name: 'guild_nsfw', value: `${target_data.guild_nsfw}`, inline: true },
                )
                .addFields(
                    { name: 'guild_partner', value: `${target_data.guild_partner}`, inline: true },
                    { name: 'guild_preferredLocale', value: `${target_data.guild_preferredLocale}`, inline: true },
                    { name: 'guild_region', value: `${target_data.guild_region}`, inline: true },
                );

            if (command == 'info') {
                interaction.reply({ embeds: [target_embed], ephemeral: true });
                logger.debug(`${PREFIX} replied to user ${interaction.member.user.name} with info about ${target_data.guild_name}`);
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
