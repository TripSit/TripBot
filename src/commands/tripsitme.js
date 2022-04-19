const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}
const TS_ICON = process.env.TS_ICON;
const CHANNEL_TRIPSITTERS_PRD = process.env.CHANNEL_TRIPSITTERS_PRD;
const CHANNEL_TRIPSITTERS_DEV = process.env.CHANNEL_TRIPSITTERS_DEV;
const ROLE_NEEDSHELP_PRD = process.env.ROLE_NEEDSHELP_PRD;
const ROLE_NEEDSHELP_DEV = process.env.ROLE_NEEDSHELP_DEV;
const ROLE_TRIPSITTER_PRD = process.env.ROLE_TRIPSITTER_PRD;
const ROLE_TRIPSITTER_DEV = process.env.ROLE_TRIPSITTER_DEV;
const ROLE_HELPER_PRD = process.env.ROLE_HELPER_PRD;
const ROLE_HELPER_DEV = process.env.ROLE_HELPER_DEV;

const PREFIX = require('path').parse(__filename).name;


module.exports = {
    data: new SlashCommandBuilder()
        .setName('tripsitme')
        .setDescription('Check substance information'),
    async execute(interaction, logger) {
        const username = `${interaction.member.user.username}#${interaction.member.user.discriminator}`;
        const channel = interaction.channel.name;
        const guild = interaction.guild.name;
        logger.info(`[${PREFIX}] Initialized by ${username} in ${channel} on ${guild}!`);

        const patient = interaction.member;

        let DEVELOPMENT = true;
        logger.debug(`[${PREFIX}] guild.name: ${guild.name}`);
        if (guild === 'TripSit') {
            DEVELOPMENT = false;
        }

        // Get a list of the patient's roles
        const patientRoles = patient.roles.cache;
        const patientRoleNames = patientRoles.map(role => role.name);
        logger.debug(`[${PREFIX}] userRoles: ${patientRoleNames}`);

        const ROLE_NEEDSHELP_ID = DEVELOPMENT ? ROLE_NEEDSHELP_DEV : ROLE_NEEDSHELP_PRD;
        const needsHelpRole = interaction.guild.roles.cache.find(role => role.id === ROLE_NEEDSHELP_ID);
        const ROLE_TRIPSITTER_ID = DEVELOPMENT ? ROLE_TRIPSITTER_DEV : ROLE_TRIPSITTER_PRD;
        const tripsitterRole = interaction.guild.roles.cache.find(role => role.id === ROLE_TRIPSITTER_ID);
        const ROLE_HELPER_ID = DEVELOPMENT ? ROLE_HELPER_DEV : ROLE_HELPER_PRD;
        const helperRole = interaction.guild.roles.cache.find(role => role.id === ROLE_HELPER_ID);

        // Loop through userRoles and check if the patient has the needsHelp role
        const hasNeedsHelpRole = patientRoleNames.some(role => role === needsHelpRole.name);
        logger.debug(`[${PREFIX}] hasNeedsHelpRole: ${hasNeedsHelpRole}`);

        const patientid = patient.id.toString();
        logger.debug(`[${PREFIX}] patientid: ${patientid}`);

        if (hasNeedsHelpRole) {
            const embed = new MessageEmbed()
                .setAuthor({ name: 'TripSit.Me ', url: 'http://www.tripsit.me', iconURL: TS_ICON })
                .setColor('DARK_BLUE')
                .setDescription(`Hey ${interaction.member}, you're already being helped!\n\nCheck your channel list for '${patient.user.username} chat here!'`)
                .setFooter({ text: 'Thanks for using Tripsit.Me!', iconURL: TS_ICON });
            logger.debug(`[${PREFIX}] Done!`);
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        else {
            const msg = `Hey ${patient}, thank you for asking for assistance!\n\n\
            Check your channel list for '${patient.user.username} chat here!'`;
            const embed = new MessageEmbed()
                .setAuthor({ name: 'TripSit.Me ', url: 'http://www.tripsit.me', iconURL: TS_ICON })
                .setColor('DARK_BLUE')
                .setDescription(msg)
                .setFooter({ text: 'Thanks for using Tripsit.Me!', iconURL: TS_ICON });
            logger.debug(`[${PREFIX}] Done!`);

            interaction.reply({ embeds: [embed], ephemeral: true });

            const priv_msg = `Hey ${patient}, thank you for asking for assistance!\n\nStart off by telling us what's going on: what did you take, how much, what time?\n\nA ${tripsitterRole} or ${helperRole} will be with you as soon as they're available!`;

            // Create a new thread in the interaction.channel with the patient's name and the priv_message as the startMessage
            const threadType = DEVELOPMENT ? 'GUILD_PUBLIC_THREAD' : 'GUILD_PUBLIC_THREAD';
            const thread = await interaction.channel.threads.create({
                name: `${patient.user.username} chat here!`,
                autoArchiveDuration: 60,
                type: threadType,
                reason: `${patient.user.username} requested help`,
            });

            // send a message to the thread
            await thread.send(priv_msg);


            // Get the tripsitters channel from the guild
            const CHANNEL_TRIPSITTERS_ID = DEVELOPMENT ? CHANNEL_TRIPSITTERS_DEV : CHANNEL_TRIPSITTERS_PRD;
            const tripsittersChannel = interaction.guild.channels.cache.find(chan => chan.id === CHANNEL_TRIPSITTERS_ID);

            // Create a new thread in the interaction.channel with the patient's name and the priv_message as the startMessage
            const helper_thread = await tripsittersChannel.threads.create({
                name: `${patient.user.username} discuss here!`,
                autoArchiveDuration: 60,
                type: 'GUILD_PUBLIC_THREAD',
                reason: `${patient.user.username} requested help`,
            });

            const helper_msg = `Hey ${tripsitterRole} and ${helperRole}, ${patient.user.username} can use some help, use this thread to talk about it!`;

            // send a message to the thread
            await helper_thread.send(helper_msg);
        }
    },
};
