const fs = require('node:fs');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}
const ts_icon_url = process.env.ts_icon_url;
const role_needshelp = process.env.role_needshelp;

const PREFIX = require('path').parse(__filename).name;

const db_name = 'ts_data.json';
const RAW_TS_DATA = fs.readFileSync(`./src/data/${db_name}`);
const ALL_TS_DATA = JSON.parse(RAW_TS_DATA);

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
    async execute(interaction, logger) {
        const username = `${interaction.member.user.username}#${interaction.member.user.discriminator}`;
        const channel = interaction.channel.name;
        const guild = interaction.guild.name;
        logger.info(`[${PREFIX}] Initialized by ${username} in ${channel} on ${guild}!`);

        let patient = interaction.options.getMember('user');
        let user_provided = true;
        // Default to the user who invoked the command if no user is provided
        if (!patient) {
            logger.debug(`[${PREFIX}] No user provided, defaulting to ${interaction.member}`);
            patient = interaction.member;
            user_provided = false;
        }
        logger.debug(`[${PREFIX}] patient: ${patient.user.username}#${patient.user.discriminator}`);

        let enable = interaction.options.getString('enable');
        // Default to on if no setting is provided
        if (!enable) {enable = 'On';}
        logger.debug(`[${PREFIX}] enable: ${enable}`);

        // Get a list of the patient's roles
        const patientRoles = patient.roles.cache;
        const patientRoleNames = patientRoles.map(role => role.name);
        logger.debug(`[${PREFIX}] userRoles: ${patientRoleNames}`);

        const needsHelpRole = interaction.guild.roles.cache.find(role => role.id === role_needshelp);

        // Loop through userRoles and check if the patient has the needsHelp role
        const hasNeedsHelpRole = patientRoleNames.some(role => role === needsHelpRole.name);
        logger.debug(`[${PREFIX}] hasNeedsHelpRole: ${hasNeedsHelpRole}`);

        const patientid = patient.id.toString();
        logger.debug(`[${PREFIX}] patientid: ${patientid}`);

        if (enable == 'On') {
            if (hasNeedsHelpRole) {
                const embed = new MessageEmbed()
                    .setAuthor({ name: 'TripSit.Me ', url: 'http://www.tripsit.me', iconURL: ts_icon_url })
                    .setColor('DARK_BLUE')
                    .setFooter({ text: 'Thanks for using Tripsit.Me!', iconURL: ts_icon_url });
                if (user_provided) {embed.setDescription(`Hey ${interaction.member}, ${patient.user.username} is already being helped!\n\nCheck your channel list for '${patient.user.username} discuss here!'`);}
                else {embed.setDescription(`Hey ${interaction.member}, you're already being helped!\n\nCheck your channel list for '${patient.user.username} chat here!'`);}
                logger.debug(`[${PREFIX}] Patient ${patient} is already being helped!`);
                return interaction.reply({ embeds: [embed] });
            }
            if (!hasNeedsHelpRole) {
                // Find the patientid in ALL_TS_DATA keys and store the patent data in patientData
                let patientData = ALL_TS_DATA[patientid];
                logger.debug(`[${PREFIX}] patientData length: ${JSON.stringify(patientData, null, 4).length}`);

                // Check if the patient data exists, if not create one
                if (!patientData) {
                    logger.debug(`[${PREFIX}] Creating new patient data for ${patient.user.username}`);
                    patientData = {
                        'name': patient.user.username,
                        'discriminator': patient.user.discriminator,
                        'roles': '',
                        'karma-given': {},
                        'karma-received': {},
                    };
                }

                // Team check
                patientRoleNames.forEach(role => {
                    if (role === 'Admin' || role === 'Operator' || role === 'Moderator' || role === 'Tripsitter') {
                        const embed = new MessageEmbed()
                            .setAuthor({ name: 'TripSit.Me ', url: 'http://www.tripsit.me', iconURL: ts_icon_url })
                            .setColor('DARK_BLUE')
                            .setDescription('This user is a member of the team and cannot be helped!')
                            .setFooter({ text: 'Thanks for using Tripsit.Me!', iconURL: ts_icon_url });
                        return interaction.reply({ embeds: [embed] });
                    }
                });

                // Get a list of role names
                patientData['roles'] = patientRoleNames;
                ALL_TS_DATA[patientid] = patientData;

                // Save those names to the DB
                fs.writeFile(`src/assets/${db_name}`, JSON.stringify(ALL_TS_DATA, null, 4), function(err) {
                    if (err) {
                        console.log(err);
                    }
                });
                logger.debug(`[${PREFIX}] Saved ALL_TS_DATA`);

                // Remove all roles from the patient
                patientRoles.forEach(role => {
                    if (role.name !== '@everyone') {
                        logger.debug(`[${PREFIX}] Removing role ${role.name} from ${patient.user.username}`);
                        patient.roles.remove(role);
                    }
                });

                // Get the needshelp role object and add it to the patient
                logger.debug(`[${PREFIX}] Adding role ${needsHelpRole.name} to ${patient.user.username}`);
                patient.roles.add(needsHelpRole);
                const embed = new MessageEmbed()
                    .setAuthor({ name: 'TripSit.Me ', url: 'http://www.tripsit.me', iconURL: ts_icon_url })
                    .setColor('DARK_BLUE')
                    .setFooter({ text: 'Thanks for using Tripsit.Me!', iconURL: ts_icon_url });
                if (user_provided) {embed.setDescription(`Hey ${interaction.member}, Thanks for the heads up, we'll be helping ${patient.user.username} shortly!\n\nCheck your channel list for '${patient.user.username} discuss here!'`);}
                else {embed.setDescription(`Hey ${interaction.member}, thanks for reaching out!\n\nCheck your channel list for '${patient.user.username} chat here!'`);}
                logger.debug(`[${PREFIX}] Patient ${patient} is now being helped!`);
                return interaction.reply({ embeds: [embed] });
            }

        }
        if (enable == 'Off') {
            if (hasNeedsHelpRole) {
                // Get fresh data from the DB
                const RAW_TS_DATA2 = fs.readFileSync(`./src/data/${db_name}`);
                const ALL_TS_DATA2 = JSON.parse(RAW_TS_DATA2);

                // Get the patient's data from the db
                const patientData2 = ALL_TS_DATA2[patientid];
                const patientRoles2 = patientData2['roles'];
                logger.debug(`[${PREFIX}] patient_roles db: ${patientRoles2}`);

                // For each role in patientRoles2, add it to the patient
                patientRoles2.forEach(role_name => {
                    if (role_name !== '@everyone') {
                        const roleObj = interaction.guild.roles.cache.find(r => r.name === role_name);
                        logger.debug(`[${PREFIX}] Adding role ${roleObj.name} to ${patient.user.username}`);
                        patient.roles.add(roleObj);
                    }
                });

                const output = `Removed ${needsHelpRole.name} from ${patient.user.username}`;
                logger.debug(`[${PREFIX}] ${output}`);
                await patient.roles.remove(needsHelpRole);
                const embed = new MessageEmbed()
                    .setAuthor({ name: 'TripSit.Me ', url: 'http://www.tripsit.me', iconURL: ts_icon_url })
                    .setColor('DARK_BLUE')
                    .setFooter({ text: 'Thanks for using Tripsit.Me!', iconURL: ts_icon_url });
                if (user_provided) {embed.setDescription(`Hey ${interaction.member}, we're glad ${patient.user.username} is feeling better, we've restored their old roles!`);}
                else {embed.setDescription(`Hey ${interaction.member}, we're glad you're feeling better, we've restored your old roles, happy chatting!`);}
                logger.debug(`[${PREFIX}] Patient ${patient} is no longer being helped!`);
                return interaction.reply({ embeds: [embed] });
            }
            else {
                const embed = new MessageEmbed()
                    .setAuthor({ name: 'TripSit.Me ', url: 'http://www.tripsit.me', iconURL: ts_icon_url })
                    .setColor('DARK_BLUE')
                    .setFooter({ text: 'Thanks for using Tripsit.Me!', iconURL: ts_icon_url });
                if (user_provided) {embed.setDescription(`Hey ${interaction.member}, ${patient.user.username} isnt currently being taken care of!`);}
                else {embed.setDescription(`Hey ${interaction.member}, you're not currently being taken care of!`);}
                logger.debug(`[${PREFIX}] Patient ${patient} does not need help!`);
                return interaction.reply({ embeds: [embed] });
            }
        }
    },
};
