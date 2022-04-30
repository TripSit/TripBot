const { SlashCommandBuilder } = require('@discordjs/builders');
const logger = require('../utils/logger.js');
if (process.env.NODE_ENV !== 'production') {require('dotenv').config();}
const channel_tripsitters = process.env.channel_tripsitters;
const role_needshelp = process.env.role_needshelp;
const role_tripsitter = process.env.role_tripsitter;
const role_helper = process.env.role_helper;
const PREFIX = require('path').parse(__filename).name;
const template = require('../utils/embed_template');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('tripsitme')
        .setDescription('Check substance information'),
    async execute(interaction) {
        const patient = interaction.member;

        // Get a list of the patient's roles
        const patientRoles = patient.roles.cache;
        const patientRoleNames = patientRoles.map(role => role.name);
        logger.debug(`[${PREFIX}] userRoles: ${patientRoleNames}`);

        const needsHelpRole = interaction.guild.roles.cache.find(role => role.id === role_needshelp);
        const tripsitterRole = interaction.guild.roles.cache.find(role => role.id === role_tripsitter);
        const helperRole = interaction.guild.roles.cache.find(role => role.id === role_helper);

        // Loop through userRoles and check if the patient has the needsHelp role
        const hasNeedsHelpRole = patientRoleNames.some(role => role === needsHelpRole.name);
        logger.debug(`[${PREFIX}] hasNeedsHelpRole: ${hasNeedsHelpRole}`);

        const patientid = patient.id.toString();
        logger.debug(`[${PREFIX}] patientid: ${patientid}`);

        if (hasNeedsHelpRole) {
            const embed = template.embed_template()
                .setColor('DARK_BLUE')
                .setDescription(`Hey ${interaction.member}, you're already being helped!\n\nCheck your channel list for '${patient.user.username} chat here!'`);
            logger.debug(`[${PREFIX}] Done!`);
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        else {
            const msg = `Hey ${patient}, thank you for asking for assistance!\n\n\
            Check your channel list for '${patient.user.username} chat here!'`;
            const embed = template.embed_template()
                .setColor('DARK_BLUE')
                .setDescription(msg);
            logger.debug(`[${PREFIX}] Done!`);

            interaction.reply({ embeds: [embed], ephemeral: true });

            const priv_msg = `Hey ${patient}, thank you for asking for assistance!\n\nStart off by telling us what's going on: what did you take, how much, what time?\n\nA ${tripsitterRole} or ${helperRole} will be with you as soon as they're available!`;

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

            const helper_msg = `Hey ${tripsitterRole} and ${helperRole}, ${patient.user.username} can use some help, use this thread to talk about it!`;

            // send a message to the thread
            await helper_thread.send(helper_msg);
            logger.debug(`[${PREFIX}] finished!`);
            return;
        }
    },
};
