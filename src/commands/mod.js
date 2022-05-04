const { SlashCommandBuilder, time } = require('@discordjs/builders');
const { MessageActionRow, MessageButton } = require('discord.js');
const logger = require('../utils/logger.js');
const PREFIX = require('path').parse(__filename).name;
const template = require('../utils/embed_template');
if (process.env.NODE_ENV !== 'production') {require('dotenv').config();}
const channel_moderators_id = process.env.channel_moderators;
const { get_user_info } = require('../utils/get_user_info');
const { set_user_info } = require('../utils/set_user_info');

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
            const embed = template.embed_template()
                .setColor('RED')
                .setDescription('target not found, are you sure they are in the server?');
            interaction.reply({ embeds: [embed], ephemeral: true });
            logger.debug(`[${PREFIX}] Target not found!`);
            return;
        }

        if (command === 'warn') {
            // Send a message to the target
            const warn_embed = template.embed_template()
                .setColor('YELLOW')
                .setTitle('Warned!')
                .setDescription(`You have been warned by Team TripSit for ${reason}.\n\nPlease read the rules and be respectful of them.`);
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
            const embed = template.embed_template()
                .setColor(color)
                .setDescription(title);
            interaction.reply({ embeds: [embed], ephemeral: true });
            logger.debug(`[${PREFIX}] I replied to ${interaction.member}!`);
        }

        // Extract actor data
        const actor_results = await get_user_info(actor);
        const actor_data = actor_results[0];
        const actor_action = `${command}_sent`;

        // Transfor actor data
        if ('mod_actions' in actor_data) {
            actor_data.mod_actions[actor_action] = (actor_data.mod_actions[actor_action] || 0) + 1;
        }
        else {
            actor_data.mod_actions = { [actor_action]: 1 };
        }

        // Load actor data
        await set_user_info(actor_results[1], actor_data);

        // Extract target data
        const target_results = await get_user_info(target);
        const target_data = target_results[0];
        const target_action = `${command}_received`;

        // Transform taget data
        if ('mod_actions' in target_data) {
            target_data.mod_actions[target_action] = (target_data.mod_actions[target_action] || 0) + 1;
        }
        else {
            target_data.mod_actions = { [target_action]: 1 };
        }

        // Load target data
        await set_user_info(target_results[1], target_data);

        // const title = `${actor} ${command}ed ${target} ${duration ? `for ${duration}` : ''} ${reason ? `because ${reason}` : ''}`;
        const title = `${actor} ${command}ed ${target} ${reason ? `because ${reason}` : ''}`;
        // const book = [];
        const target_embed = template.embed_template()
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
                { name: '# of Reports', value: `${target_data['reports_recv'] ? target_data['reports_recv'] : 0 }`, inline: true },
                { name: '# of Timeouts', value: `${target_data['timeout_recv'] ? target_data['timeout_recv'] : 0 }`, inline: true },
                { name: '# of Warns', value: `${target_data['warn_recv'] ? target_data['warn_recv'] : 0 }`, inline: true },
            )
            .addFields(
                { name: '# of Kicks', value: `${target_data['kick_recv'] ? target_data['kick_recv'] : 0 }`, inline: true },
                { name: '# of Bans', value: `${target_data['ban_recv'] ? target_data['ban_recv'] : 0 }`, inline: true },
                { name: '# of Fucks to give', value: '0', inline: true },
            );
        // book.push(target_embed);

        // const actor_embed = template.embed_template()
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
        //         { name: '# of Reports', value: `${actor_data['reports_recv']}`, inline: true },
        //         { name: '# of Timeouts', value: `${actor_data['timeout_recv']}`, inline: true },
        //         { name: '# of Warns', value: `${actor_data['warn_recv']}`, inline: true },
        //     )
        //     .addFields(
        //         { name: '# of Kicks', value: `${actor_data['kick_recv']}`, inline: true },
        //         { name: '# of Bans', value: `${actor_data['ban_recv']}`, inline: true },
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
        //     const embed = template.embed_template()
        //         .setDescription('Done!');
        //     return interaction.reply({ embeds: [embed] });
        // }

        if (command == 'info') {
            // interaction.reply({ embeds: [target_embed], ephemeral: true, components: [mod_buttons] });
            interaction.reply({ embeds: [target_embed], ephemeral: true });
            logger.debug(`${PREFIX} replied to user ${interaction.member.user.name} with info about ${target.user.name}`);
            logger.debug(`[${PREFIX}] finished!`);
            return;
        }
        logger.debug(`${PREFIX} channel_moderators_id: ${channel_moderators_id}`);
        const mod_chan = interaction.client.channels.cache.get(channel_moderators_id);
        // mod_chan.send({ embeds: [target_embed], components: [mod_buttons] });
        mod_chan.send({ embeds: [target_embed] });
        logger.debug(`${PREFIX} send a message to the moderators room`);
        logger.debug(`[${PREFIX}] finished!`);
        return;
    },
};
