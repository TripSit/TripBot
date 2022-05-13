'use strict';

const { SlashCommandBuilder, time } = require('@discordjs/builders');
const logger = require('../../utils/logger');
const template = require('../../utils/embed-template');
const { getUserInfo } = require('../../utils/get-user-info');
const { setUserInfo } = require('../../utils/set-user-info');

const PREFIX = require('path').parse(__filename).name; // eslint-disable-line

const { channel_moderators_id: channelModeratorsId } = process.env;

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

// const warnButtons = new MessageActionRow().addComponents(
//   new MessageButton()
//     .setCustomId('acknowledgebtn')
//     .setLabel('I understand, it wont happen again!')
//     .setStyle('PRIMARY'),
//   new MessageButton()
//     .setCustomId('refusalbtn')
//     .setLabel('Nah, I do what I want!')
//     .setStyle('DANGER'),
// );

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
    .addSubcommand(subcommand => subcommand
      .setName('info')
      .setDescription('Info on a user')
      .addUserOption(option => option
        .setName('target')
        .setDescription('User to warn!')
        .setRequired(true)))
    .addSubcommand(subcommand => subcommand
      .setName('warn')
      .setDescription('Warn a user')
      .addUserOption(option => option
        .setName('target')
        .setDescription('User to warn!')
        .setRequired(true))
      .addStringOption(option => option
        .setName('reason')
        .setDescription('Reason for warn!')
        .setRequired(true)))
    .addSubcommand(subcommand => subcommand
      .setName('timeout')
      .setDescription('Timeout a user')
      .addUserOption(option => option
        .setName('target')
        .setDescription('User to timeout!')
        .setRequired(true))
      .addStringOption(option => option
        .setName('reason')
        .setDescription('Reason for timeout!')
        .setRequired(true))
      // eslint-disable-next-line
      // .addStringOption(option => option.setName('duration').setDescription('Duration of timeout!').setRequired(true))
      .addStringOption(option => option
        .setName('toggle')
        .setDescription('On off?')
        .addChoice('On', 'on')
        .addChoice('Off', 'off')
        .setRequired(true)))
    .addSubcommand(subcommand => subcommand
      .setName('kick')
      .setDescription('Kick a user')
      .addUserOption(option => option
        .setName('target')
        .setDescription('User to kick!')
        .setRequired(true))
      .addStringOption(option => option
        .setName('reason')
        .setDescription('Reason for kick!')
        .setRequired(true)))
    .addSubcommand(subcommand => subcommand
      .setName('ban')
      .setDescription('Ban a user')
      .addUserOption(option => option
        .setName('target')
        .setDescription('User to ban!')
        .setRequired(true))
      .addStringOption(option => option
        .setName('reason')
        .setDescription('Reason for ban!')
        .setRequired(true))
      // eslint-disable-next-line
      // .addStringOption(option => option.setName('duration').setDescription('Duration of ban!').setRequired(true))
      .addStringOption(option => option
        .setName('toggle')
        .setDescription('On off?')
        .addChoice('On', 'on')
        .addChoice('Off', 'off')
        .setRequired(true))),

  async execute(interaction) {
    const actor = interaction.member;
    logger.debug(`[${PREFIX}] Actor:`, actor);
    let command = interaction.options.getSubcommand();
    logger.debug(`[${PREFIX}] Command:`, command);
    let target = interaction.options.getMember('target');
    logger.debug(`[${PREFIX}] target:`, target);
    const toggle = interaction.options.getString('toggle');
    logger.debug(`[${PREFIX}] toggle:`, toggle);
    const reason = interaction.options.getString('reason');
    logger.debug(`[${PREFIX}] reason:`, reason);
    // const duration = interaction.options.getString('duration');
    // logger.debug(`[${PREFIX}] duration: ${duration}`);

    // let color = '';
    let isMember = true;
    if (toggle === 'off') {
      if (command === 'ban') {
        target = interaction.options.getUser('target');
        isMember = false;
        logger.debug(`[${PREFIX}] target_user.id:`, target.id);
        const bans = await interaction.guild.bans.fetch();
        logger.debug(`[${PREFIX}] interaction.guild.bans.fetch():`, bans);
        command = 'unban';
        // color = 'GREEN';
        await interaction.guild.bans.remove(target, reason);
        logger.debug(`[${PREFIX}] I unbanned ${target}!`);
      } else if (command === 'timeout') {
        target.timeout(0, reason);
        command = 'untimeout';
        // color = 'GREEN';
        logger.debug(`[${PREFIX}] I untimed out ${target}!`);
      }
    }

    if (!target) {
      const embed = template.embedTemplate()
        .setColor('RED')
        .setDescription('target not found, are you sure they are in the server?');
      interaction.reply({ embeds: [embed], ephemeral: true });
      logger.debug(`[${PREFIX}] Target not found!`);
      return;
    }

    // Extract actor data
    const actorResults = await getUserInfo(actor);
    const actorData = actorResults[0];
    const actorAction = `${command}_sent`;

    // Transfor actor data
    if ('mod_actions' in actorData) {
      actorData.mod_actions[actorAction] = (actorData.mod_actions[actorAction] || 0) + 1;
    } else {
      actorData.mod_actions = { [actorAction]: 1 };
    }

    // Load actor data
    await setUserInfo(actorResults[1], actorData);

    // Extract target data
    const targetResults = await getUserInfo(target);
    const targetData = targetResults[0];
    const targetAction = `${command}_received`;

    // Transform taget data
    if ('mod_actions' in targetData) {
      targetData.mod_actions[targetAction] = (targetData.mod_actions[targetAction] || 0) + 1;
    } else {
      targetData.mod_actions = { [targetAction]: 1 };
    }

    // Load target data
    await setUserInfo(targetResults[1], targetData);

    // eslint-disable-next-line
    // const title = `${actor} ${command}ed ${target} ${duration ? `for ${duration}` : ''} ${reason ? `because ${reason}` : ''}`;
    const title = `${actor} ${command}ed ${target} ${reason ? `because ${reason}` : ''}`;
    // const book = [];
    const targetEmbed = template.embedTemplate()
      .setColor('BLUE')
      .setDescription(title)
      .addFields(
        { name: 'Username', value: `${isMember ? target.user.username : target.username}#${isMember ? target.user.discriminator : target.discriminator}`, inline: true },
        { name: 'Nickname', value: `${target.nickname}`, inline: true },
        { name: 'ID', value: `${isMember ? target.user.id : target.id}`, inline: true },
      )
      .addFields(
        { name: 'Account created', value: `${isMember ? time(target.user.createdAt, 'R') : time(target.createdAt, 'R')}`, inline: true },
        { name: 'Joined', value: `${time(target.joinedAt, 'R')}`, inline: true },
        { name: 'Timeout until', value: `${time(target.communicationDisabledUntil, 'R')}`, inline: true },
      )
      .addFields(
        { name: 'Pending', value: `${target.pending}`, inline: true },
        { name: 'Moderatable', value: `${target.moderatable}`, inline: true },
        { name: 'Muted', value: `${isMember ? target.isCommunicationDisabled() : 'banned'}`, inline: true },
      )
      .addFields(
        { name: 'Manageable', value: `${target.manageable}`, inline: true },
        { name: 'Bannable', value: `${target.bannable}`, inline: true },
        { name: 'Kickable', value: `${target.kickable}`, inline: true },
      )
      .addFields(
        { name: '# of Reports', value: `${targetData.reports_recv ? targetData.reports_recv : 0}`, inline: true },
        { name: '# of Timeouts', value: `${targetData.timeout_recv ? targetData.timeout_recv : 0}`, inline: true },
        { name: '# of Warns', value: `${targetData.warn_recv ? targetData.warn_recv : 0}`, inline: true },
      )
      .addFields(
        { name: '# of Kicks', value: `${targetData.kick_recv ? targetData.kick_recv : 0}`, inline: true },
        { name: '# of Bans', value: `${targetData.ban_recv ? targetData.ban_recv : 0}`, inline: true },
        { name: '# of Fucks to give', value: '0', inline: true },
      );
    // book.push(target_embed);

    // const actor_embed = template.embedTemplate()
    //     .setColor('BLUE')
    //     .setDescription(title)
    //     .addFields(
    // eslint-disable-next-line
    //         { name: 'Username', value: `${is_member ? actor.user.username : actor.username }#${is_member ? actor.user.discriminator : actor.discriminator}`, inline: true },
    //         { name: 'Nickname', value: `${actor.nickname}`, inline: true },
    //         { name: 'ID', value: `${is_member ? actor.user.id : actor.id}`, inline: true },
    //     )
    //     .addFields(
    // eslint-disable-next-line
    //         { name: 'Account created', value: `${is_member ? time(actor.user.createdAt, 'R') : time(actor.createdAt, 'R')}`, inline: true },
    //         { name: 'Joined', value: `${time(actor.joinedAt, 'R')}`, inline: true },
    // eslint-disable-next-line
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
    //     const embed = template.embedTemplate()
    //         .setDescription('Done!');
    //     return interaction.reply({ embeds: [embed] });
    // }

    if (command === 'info') {
      // interaction.reply({ embeds: [target_embed], ephemeral: true, components: [mod_buttons] });
      interaction.reply({ embeds: [targetEmbed], ephemeral: true });
      logger.debug(`${PREFIX} replied to user ${interaction.member.user.name} with info about ${target.user.name}`);
      logger.debug(`[${PREFIX}] finished!`);
      return;
    }
    logger.debug(`${PREFIX} channel_moderators_id: ${channelModeratorsId}`);
    const modChan = interaction.client.channels.cache.get(channelModeratorsId);
    // mod_chan.send({ embeds: [target_embed], components: [mod_buttons] });
    modChan.send({ embeds: [targetEmbed] });
    logger.debug(`${PREFIX} send a message to the moderators room`);
    logger.debug(`[${PREFIX}] finished!`);
  },
};
