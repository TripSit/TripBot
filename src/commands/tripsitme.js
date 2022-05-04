const { SlashCommandBuilder } = require('@discordjs/builders');
const logger = require('../utils/logger.js');
const PREFIX = require('path').parse(__filename).name;
const template = require('../utils/embed_template');
if (process.env.NODE_ENV !== 'production') {require('dotenv').config();}
const channel_tripsitters = process.env.channel_tripsitters;
const role_needshelp = process.env.role_needshelp;
const role_tripsitter = process.env.role_tripsitter;
const role_helper = process.env.role_helper;
const { stripIndents } = require('common-tags');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('tripsitme')
        .setDescription('Check substance information'),
    async execute(interaction) {
        const patient = interaction.member;
        const test = patient.id == process.env.ownerId || patient.id.toString() == '332687787172167680';

        // Get a list of the patient's roles
        const patientRoles = patient.roles.cache;
        const patientRoleNames = patientRoles.map(role => role.name);
        logger.debug(`[${PREFIX}] userRoles: ${patientRoleNames}`);

        const needsHelpRole = interaction.guild.roles.cache.find(role => role.id === role_needshelp);
        const tripsitterRole = interaction.guild.roles.cache.find(role => role.id === role_tripsitter);
        const helperRole = interaction.guild.roles.cache.find(role => role.id === role_helper);

        // Loop through userRoles and check if the patient has the needsHelp role
        const hasNeedsHelpRole = patientRoleNames.some(role => role === needsHelpRole.name);
        const hasHelperRole = patientRoleNames.some(role => role === helperRole.name);
        logger.debug(`[${PREFIX}] hasNeedsHelpRole: ${hasNeedsHelpRole}`);

        const patientid = patient.id.toString();
        logger.debug(`[${PREFIX}] patientid: ${patientid}`);

        if (hasNeedsHelpRole) {
            const embed = template.embed_template()
                .setColor('DARK_BLUE')
                .setDescription(stripIndents`
                Hey ${interaction.member}, you're already being helped!\n\n
                Check your channel list for '${patient.user.username} chat here!'`);
            logger.debug(`[${PREFIX}] Done!`);
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        else {
            if (hasHelperRole) {
                patient.roles.remove(helperRole);
            }

            const msg = `Hey ${patient}, thank you for asking for assistance!\n\n\
            Check your channel list for '${patient.user.username} chat here!'`;
            const embed = template.embed_template()
                .setColor('DARK_BLUE')
                .setDescription(msg);
            logger.debug(`[${PREFIX}] Done!`);

            interaction.reply({ embeds: [embed], ephemeral: true });

            const priv_msg = stripIndents`
            Hey ${patient}, thank you for asking for assistance!\n
            **Start off by telling us what's going on: what did you take, how much, what time?**\n
            A ${test ? 'tripsitter' : tripsitterRole}s or ${test ? 'helper' : helperRole}s will be with you as soon as they're available!\n
            If this is a medical emergency please contact your local /EMS: we do not call EMS on behalf of anyone.\n`;

            // Create a new thread in the interaction.channel with the patient's name and the priv_message as the startMessage
            const threadType = process.env.NODE_ENV === 'production' ? 'GUILD_PRIVATE_THREAD' : 'GUILD_PUBLIC_THREAD';
            const thread = await interaction.channel.threads.create({
                name: `${patient.user.username} chat here!`,
                autoArchiveDuration: 60,
                type: threadType,
                reason: `${patient.user.username} requested help`,
            });

            // send a message to the thread
            await thread.send(priv_msg);

            // Get the tripsitters channel from the guild
            const tripsittersChannel = interaction.guild.channels.cache.find(chan => chan.id === channel_tripsitters);

            // Create a new thread in the interaction.channel with the patient's name and the priv_message as the startMessage
            const helper_thread = await tripsittersChannel.threads.create({
                name: `${patient.user.username} discuss here!`,
                autoArchiveDuration: 60,
                type: 'GUILD_PUBLIC_THREAD',
                reason: `${patient.user.username} requested help`,
            });

            const helper_msg = `Hey ${test ? 'tripsitter' : tripsitterRole}s and ${test ? 'helper' : helperRole}s, ${patient.user.username} can use some help, use this thread to talk about it!`;

            // send a message to the thread
            await helper_thread.send(helper_msg);
            logger.debug(`[${PREFIX}] finished!`);
            return;
        }
    },
};
