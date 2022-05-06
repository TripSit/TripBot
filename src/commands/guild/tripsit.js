'use strict';

const path = require('path');
const { SlashCommandBuilder } = require('@discordjs/builders');
const logger = require('../../utils/logger');
const template = require('../../utils/embed-template');
const { getUserInfo } = require('../../utils/get-user-info');
const { setUserInfo } = require('../../utils/set-user-info');

const PREFIX = path.parse(__filename).name;

const { role_needshelp: roleNeedsHelp } = process.env;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('tripsit')
    .setDescription(
      'This command will apply the NeedsHelp role onto a user, and remove other roles!',
    )
    .addUserOption(option => option
      .setName('user')
      .setDescription('Member to help'))
    .addStringOption(option => option
      .setName('enable')
      .setDescription('On or Off?')
      .addChoice('On', 'On')
      .addChoice('Off', 'Off')),

  async execute(interaction) {
    const needsHelpRole = interaction.guild.roles.cache.find(role => role.id === roleNeedsHelp);
    // Actor information
    const actor = interaction.member;
    const actorid = actor.id.toString();
    logger.debug(`[${PREFIX}] actorid:`, actorid);
    const actorRoles = actor.roles.cache;
    const actorRoleNames = actorRoles.map(role => role.name);
    logger.debug(`[${PREFIX}] actorRoleNames:`, actorRoleNames);

    // Target Informatiion
    let target = interaction.options.getMember('user');
    let userProvided = true;
    // Default to the user who invoked the command if no user is provided
    if (!target) {
      logger.debug(`[${PREFIX}] No user provided, defaulting to ${interaction.member}`);
      target = interaction.member;
      userProvided = false;
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

    const [actorData, actorFbid] = getUserInfo(actor);
    // eslint-disable-next-line
    const actorAction = `${command}_sent`; // TODO: undefined?

    const [targetData, targetFbid] = getUserInfo(target);
    // eslint-disable-next-line
    const targetAction = `${command}_received`; // TODO: undefined?

    let enable = interaction.options.getString('enable');
    // Default to on if no setting is provided
    if (!enable) { enable = 'On'; }
    logger.debug(`[${PREFIX}] enable: ${enable}`);

    const command = 'tripsit';
    if (enable === 'On') {
      if (targetHasNeedsHelpRole) {
        const embed = template.embedTemplate()
          .setColor('DARK_BLUE');
        if (userProvided) { embed.setDescription(`Hey ${interaction.member}, ${target.user.username} is already being helped!\n\nCheck your channel list for '${target.user.username} discuss here!'`); } else { embed.setDescription(`Hey ${interaction.member}, you're already being helped!\n\nCheck your channel list for '${target.user.username} chat here!'`); }
        logger.debug(`[${PREFIX}] target ${target} is already being helped!`);
        interaction.reply({ embeds: [embed], ephemeral: true });
        logger.debug(`[${PREFIX}] finished!`);
        return;
      }
      if (!targetHasNeedsHelpRole) {
        // Team check
        targetRoleNames.forEach(role => {
          if (role === 'Admin' || role === 'Operator' || role === 'Moderator' || role === 'Tripsitter') {
            const embed = template.embedTemplate()
              .setColor('DARK_BLUE')
              .setDescription('This user is a member of the team and cannot be helped!');
            interaction.reply({ embeds: [embed], ephemeral: true });
            logger.debug(`[${PREFIX}] finished!`);
          }
        });

        logger.debug(`[${PREFIX}] Found actor data, updating it`);
        if ('mod_actions' in actorData) {
          actorData.mod_actions[actorAction] = (actorData.mod_actions[actorAction] || 0) + 1;
        } else {
          actorData.mod_actions = { [actorAction]: 1 };
        }
        actorData.roles = actorRoleNames;

        logger.debug(`[${PREFIX}] Found target data, updating it`);
        if ('mod_actions' in targetData) {
          targetData.mod_actions[targetAction] = (targetData.mod_actions[targetAction] || 0) + 1;
        } else {
          targetData.mod_actions = { [targetAction]: 1 };
        }

        // Remove all roles from the target
        targetRoles.forEach(role => {
          if (role.name !== '@everyone') {
            logger.debug(`[${PREFIX}] Removing role ${role.name} from ${target.user.username}`);
            target.roles.remove(role);
          }
        });

        targetData.roles = targetRoleNames;

        // TODO: Use transactions
        await Promise.all([setUserInfo(actorFbid, actorData), setUserInfo(targetFbid, targetData)]);

        // Get the needshelp role object and add it to the target
        logger.debug(`[${PREFIX}] Adding role ${needsHelpRole.name} to ${target.user.username}`);
        target.roles.add(needsHelpRole);
        const embed = template.embedTemplate().setColor('DARK_BLUE');
        if (userProvided) { embed.setDescription(`Hey ${interaction.member}, Thanks for the heads up, we'll be helping ${target.user.username} shortly!\n\nCheck your channel list for '${target.user.username} discuss here!'`); } else { embed.setDescription(`Hey ${interaction.member}, thanks for reaching out!\n\nCheck your channel list for '${target.user.username} chat here!'`); }
        logger.debug(`[${PREFIX}] target ${target} is now being helped!`);
        interaction.reply({ embeds: [embed], ephemeral: true });
        logger.debug(`[${PREFIX}] finished!`);
        return;
      }
    }
    if (enable === 'Off') {
      if (targetHasNeedsHelpRole) {
        // For each role in targetRoles2, add it to the target
        if (targetData.roles) {
          targetData.roles.forEach(roleName => {
            if (roleName !== '@everyone') {
              const roleObj = interaction.guild.roles.cache.find(r => r.name === roleName);
              logger.debug(`[${PREFIX}] Adding role ${roleObj.name} to ${target.user.username}`);
              target.roles.add(roleObj);
            }
          });
        }

        await target.roles.remove(needsHelpRole);
        const output = `Removed ${needsHelpRole.name} from ${target.user.username}`;
        logger.debug(`[${PREFIX}] ${output}`);

        const embed = template.embedTemplate().setColor('DARK_BLUE');
        if (userProvided) { embed.setDescription(`Hey ${interaction.member}, we're glad ${target.user.username} is feeling better, we've restored their old roles!`); } else { embed.setDescription(`Hey ${interaction.member}, we're glad you're feeling better, we've restored your old roles, happy chatting!`); }
        logger.debug(`[${PREFIX}] target ${target} is no longer being helped!`);
        interaction.reply({ embeds: [embed], ephemeral: true });
        logger.debug(`[${PREFIX}] finished!`);
      } else {
        const embed = template.embedTemplate().setColor('DARK_BLUE');
        embed.setDescription(userProvided
          ? `Hey ${interaction.member}, ${target.user.username} isnt currently being taken care of!`
          : `Hey ${interaction.member}, you're not currently being taken care of!`);
        logger.debug(`[${PREFIX}] target ${target} does not need help!`);
        interaction.reply({ embeds: [embed], ephemeral: true });
        logger.debug(`[${PREFIX}] finished!`);
      }
    }
  },
};
