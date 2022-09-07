'use strict';

const {
  SlashCommandBuilder,
  time,
  Colors,
} = require('discord.js');
const logger = require('../../../global/utils/logger');
const template = require('../../utils/embed-template');
const { getUserInfo, setUserInfo } = require('../../../global/services/firebaseAPI');

const PREFIX = require('path').parse(__filename).name; // eslint-disable-line

const { CHANNEL_MODERATORS } = require('../../../../env');

// const mod_buttons = new ActionRowBuilder()
//     .addComponents(
//         new ButtonBuilder()
//             .setCustomId('warnbtn')
//             .setLabel('Warn')
//             .setStyle(ButtonStyle.Primary),
//         new ButtonBuilder()
//             .setCustomId('timeoutbtn')
//             .setLabel('Timeout')
//             .setStyle(ButtonStyle.Secondary)
//         new ButtonBuilder()
//             .setCustomId('kickbtn')
//             .setLabel('Kick')
//             .setStyle(ButtonStyle.Secondary)
//         new ButtonBuilder()
//             .setCustomId('banbtn')
//             .setLabel('Ban')
//             .setStyle(ButtonStyle.Danger),
//     );

// const warnButtons = new ActionRowBuilder().addComponents(
//   new ButtonBuilder()
//     .setCustomId('acknowledgebtn')
//     .setLabel('I understand, it wont happen again!')
//     .setStyle(ButtonStyle.Primary),
//   new ButtonBuilder()
//     .setCustomId('refusalbtn')
//     .setLabel('Nah, I do what I want!')
//     .setStyle(ButtonStyle.Danger),
// );

// const backButton = new ButtonBuilder()
//     .setCustomId('previousbtn')
//     .setLabel('Previous')
//     .setStyle(ButtonStyle.Danger);

// const forwardButton = new ButtonBuilder()
//     .setCustomId('nextbtn')
//     .setLabel('Next')
//     .setStyle(ButtonStyle.Success);
// const buttonList = [
//     backButton,
//     forwardButton,
// ];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('right-mod')
    .setDescription('Moderation actions!')
    .addSubcommand(subcommand => subcommand
      .setDescription('Info on a user')
      .addUserOption(option => option
        .setName('target')
        .setDescription('User to warn!')
        .setRequired(true))
      .setName('info'))
    .addSubcommand(subcommand => subcommand
      .setDescription('Warn a user')
      .addUserOption(option => option
        .setName('target')
        .setDescription('User to warn!')
        .setRequired(true))
      .addStringOption(option => option
        .setName('reason')
        .setDescription('Reason for warn!')
        .setRequired(true))
      .setName('warn'))
    .addSubcommand(subcommand => subcommand
      .setDescription('Timeout a user')
      .addUserOption(option => option
        .setName('target')
        .setDescription('User to timeout!')
        .setRequired(true))
      .addStringOption(option => option
        .setName('reason')
        .setDescription('Reason for timeout!')
        .setRequired(true))
      .addStringOption(option => option
        .setName('toggle')
        .setDescription('On off?')
        .addChoices(
          { name: 'On', value: 'on' },
          { name: 'Off', value: 'off' },
        ))
      .addStringOption(option => option
        .setName('duration')
        .setDescription('Duration of ban!'))
      .setName('timeout'))
    .addSubcommand(subcommand => subcommand
      .setDescription('Kick a user')
      .addUserOption(option => option
        .setName('target')
        .setDescription('User to kick!')
        .setRequired(true))
      .addStringOption(option => option
        .setName('reason')
        .setDescription('Reason for kick!')
        .setRequired(true))
      .setName('kick'))
    .addSubcommand(subcommand => subcommand
      .setDescription('Ban a user')
      .addUserOption(option => option
        .setName('target')
        .setDescription('User to ban!')
        .setRequired(true))
      .addStringOption(option => option
        .setName('reason')
        .setDescription('Reason for ban!')
        .setRequired(true))
      .addStringOption(option => option
        .setName('toggle')
        .setDescription('On off?')
        .addChoices(
          { name: 'On', value: 'on' },
          { name: 'Off', value: 'off' },
        ))
      .addStringOption(option => option
        .setName('duration')
        .setDescription('Duration of ban!'))
      .setName('ban')),

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
        .setColor(Colors.Red)
        .setDescription('target not found, are you sure they are in the server?');
      interaction.reply({ embeds: [embed], ephemeral: true });
      logger.debug(`[${PREFIX}] Target not found!`);
      return;
    }

    // Extract actor data
    const [actorData, actorFbid] = await getUserInfo(actor);
    const actorAction = `${command}_received`;

    // Transfor actor data
    if ('discord' in actorData) {
      if ('modActions' in actorData) {
        actorData.discord.modActions[actorAction] = (
          actorData.discord.modActions[actorAction] || 0) + 1;
      } else {
        actorData.discord.modActions = { [actorAction]: 1 };
      }
    } else {
      actorData.discord = { modActions: { [actorAction]: 1 } };
    }

    // Load actor data
    await setUserInfo(actorFbid, actorData);

    // Extract target data
    const [targetData, targetFbid] = await getUserInfo(target);
    const targetAction = `${command}_received`;

    // Transform taget data
    if ('discord' in actorData) {
      if ('modActions' in targetData) {
        targetData.discord.modActions[targetAction] = (
          targetData.discord.modActions[targetAction] || 0) + 1;
      } else {
        targetData.discord.modActions = { [targetAction]: 1 };
      }
    } else {
      targetData.discord = { modActions: { [targetAction]: 1 } };
    }

    // Load target data
    await setUserInfo(targetFbid, targetData);

    // eslint-disable-next-line
    // const title = `${actor} ${command}ed ${target} ${duration ? `for ${duration}` : ''} ${reason ? `because ${reason}` : ''}`;
    const title = `${actor} ${command}ed ${target} ${reason ? `because ${reason}` : ''}`;
    // const book = [];
    const targetEmbed = template.embedTemplate()
      .setColor(Colors.Blue)
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

    if (command === 'info') {
      // interaction.reply({ embeds: [target_embed], ephemeral: true, components: [mod_buttons] });
      interaction.reply({ embeds: [targetEmbed], ephemeral: true });
      logger.debug(`${PREFIX} replied to user ${interaction.member.user.name} with info about ${target.user.name}`);
      logger.debug(`[${PREFIX}] finished!`);
      return;
    }
    logger.debug(`${PREFIX} CHANNEL_MODERATORS: ${CHANNEL_MODERATORS}`);
    const modChan = interaction.client.channels.cache.get(CHANNEL_MODERATORS);
    // mod_chan.send({ embeds: [target_embed], components: [mod_buttons] });
    modChan.send({ embeds: [targetEmbed] });
    logger.debug(`${PREFIX} send a message to the moderators room`);
    logger.debug(`[${PREFIX}] finished!`);
  },
};
