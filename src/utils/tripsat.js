'use strict';

const PREFIX = require('path').parse(__filename).name;
const { stripIndents } = require('common-tags/lib');
const logger = require('./logger');
const { getUserInfo } = require('./firebase');

const template = require('./embed-template');

const {
  roleNeedshelpId,
} = require('../../env');

module.exports = {
  async execute(interaction) {
    const target = interaction.member;

    // Get a list of the target's roles
    const targetRoleNames = target.roles.cache.map(role => role.name);
    // logger.debug(`[${PREFIX}] targetRoleNames: ${targetRoleNames}`);

    const needsHelpRole = interaction.guild.roles.cache.find(role => role.id === roleNeedshelpId);

    // Loop through userRoles and check if the target has roles
    const targetHasNeedsHelpRole = targetRoleNames.some(role => role === needsHelpRole.name);
    // logger.debug(`[${PREFIX}] targetHasNeedsHelpRole: ${targetHasNeedsHelpRole}`);

    if (!targetHasNeedsHelpRole) {
      const embed = template.embedTemplate().setColor('DARK_BLUE');
      embed.setDescription(`Hey ${interaction.member}, you're not currently being taken care of!`);
      logger.debug(`[${PREFIX}] target ${target} does not need help!`);
      interaction.reply({ embeds: [embed], ephemeral: true });
      logger.debug(`[${PREFIX}] finished!`);
      return;
    }

    await target.roles.remove(needsHelpRole);
    logger.debug(`[${PREFIX}] Removed ${needsHelpRole.name} from ${target.user.username}`);

    const targetResults = await getUserInfo(target);
    const targetData = targetResults[0];

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

    const embed = template.embedTemplate().setColor('DARK_BLUE');
    embed.setDescription(stripIndents`
    Hey ${interaction.member}, we're glad you're feeling better =)
    We've restored your old roles, but you can keep talking in the thread if you want!`);
    interaction.reply({ embeds: [embed], ephemeral: true });

    logger.debug(`[${PREFIX}] target ${target} is no longer being helped!`);

    logger.debug(`[${PREFIX}] finished!`);
  },
};
