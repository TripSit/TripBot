'use strict';

const path = require('path');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { stripIndents } = require('common-tags');
const logger = require('../../utils/logger');
const template = require('../../utils/embed-template');
const { getUserInfo, setUserInfo } = require('../../utils/firebase');

const PREFIX = path.parse(__filename).name;

const {
  discordOwnerId,
  NODE_ENV,
  channelTripsitInfoId,
  channelTripsittersId,
  roleNeedshelpId,
  roleTripsitterId,
  roleHelperId,
} = require('../../../env');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('tripsit')
    .setDescription(
      'This command will apply the NeedsHelp role onto a user, and remove other roles!',
    )
    .addUserOption(option => option
      .setName('user')
      .setDescription('Member to help')
      .setRequired(true))
    .addStringOption(option => option
      .setName('enable')
      .setDescription('On or Off?')
      .addChoice('On', 'On')
      .addChoice('Off', 'Off')),

  async execute(interaction) {
    const helperRole = interaction.guild.roles.cache.find(role => role.id === roleHelperId);
    const tripsitterRole = interaction.guild.roles.cache.find(role => role.id === roleTripsitterId);
    const needsHelpRole = interaction.guild.roles.cache.find(role => role.id === roleNeedshelpId);
    // Actor information
    const actor = interaction.member;
    const actorRoleNames = actor.roles.cache.map(role => role.name);
    logger.debug(`[${PREFIX}] actor: ${actor.user.username}#${actor.user.discriminator}`);

    const testRun = actor.id === discordOwnerId || actor.id.toString() === '332687787172167680';

    // Target Informatiion
    const target = interaction.options.getMember('user');
    const targetRoleNames = target.roles.cache.map(role => role.name);
    logger.debug(`[${PREFIX}] target: ${target.user.username}#${target.user.discriminator}`);

    // Loop through userRoles and check if the target has the needsHelp role
    const targetHasNeedsHelpRole = targetRoleNames.some(role => role === needsHelpRole.name);
    logger.debug(`[${PREFIX}] targetHasNeedsHelpRole: ${targetHasNeedsHelpRole}`);

    let enable = interaction.options.getString('enable');
    // Default to on if no setting is provided
    if (!enable) { enable = 'On'; }
    logger.debug(`[${PREFIX}] enable: ${enable}`);

    if (enable === 'On') {
      if (targetHasNeedsHelpRole) {
        const embed = template.embedTemplate()
          .setColor('DARK_BLUE');
        embed.setDescription(`Hey ${interaction.member}, ${target.user.username} is already being helped!\n\nCheck your channel list for '${target.user.username} discuss here!'`);
        logger.debug(`[${PREFIX}] target ${target} is already being helped!`);
        interaction.reply({ embeds: [embed], ephemeral: true });
        logger.debug(`[${PREFIX}] finished!`);
        return;
      }
      // Team check
      target.roles.cache.forEach(role => {
        if (role === 'Admin' || role === 'Operator' || role === 'Moderator' || role === 'Tripsitter') {
          const embed = template.embedTemplate()
            .setColor('DARK_BLUE')
            .setDescription('This user is a member of the team and cannot be helped!');
          return interaction.reply({ embeds: [embed], ephemeral: true });
        }
      });

      const [actorData, actorFbid] = await getUserInfo(actor);
      const actorAction = `${PREFIX}_sent`;
      const [targetData, targetFbid] = await getUserInfo(target);
      const targetAction = `${PREFIX}_received`;

      logger.debug(`[${PREFIX}] Updating actor data it`);
      if ('mod_actions' in actorData) {
        actorData.mod_actions[actorAction] = (actorData.mod_actions[actorAction] || 0) + 1;
      } else {
        actorData.mod_actions = { [actorAction]: 1 };
      }
      actorData.roles = actorRoleNames;

      logger.debug(`[${PREFIX}] Updating target data it`);
      if ('mod_actions' in targetData) {
        targetData.mod_actions[targetAction] = (targetData.mod_actions[targetAction] || 0) + 1;
      } else {
        targetData.mod_actions = { [targetAction]: 1 };
      }
      targetData.roles = targetRoleNames;

      // TODO: Use transactions
      await Promise.all([setUserInfo(actorFbid, actorData), setUserInfo(targetFbid, targetData)]);

      // Remove all roles from the target
      target.roles.cache.forEach(role => {
        if (role.name !== '@everyone') {
          logger.debug(`[${PREFIX}] Removing role ${role.name} from ${target.user.username}`);
          target.roles.remove(role);
        }
      });

      try {
        // Get the needshelp role object and add it to the target
        logger.debug(`[${PREFIX}] Adding role ${needsHelpRole.name} to ${target.user.username}`);
        target.roles.add(needsHelpRole);
      } catch (err) {
        logger.error(`[${PREFIX}] Error adding role to target: ${err}`);
        return interaction.reply(stripIndents`There was an error adding the NeedsHelp role!
        Make sure the bot's role is higher than NeedsHelp in the Role list!`);
      }

      // Create a new private thread in the channel
      // If we're not in production we need to create a public thread
      const thread = await interaction.channel.threads.create({
        name: `${target.user.username} chat here!`,
        autoArchiveDuration: 1440,
        type: NODE_ENV === 'production' ? 'GUILD_PRIVATE_THREAD' : 'GUILD_PUBLIC_THREAD',
        reason: `${target.user.username} requested help`,
      });

      // Send the intro message to the thread
      await thread.send(stripIndents`
        Hey ${target}, the team thinks you could use assistance!
        A ${testRun ? 'tripsitter' : tripsitterRole}s or ${testRun ? 'helper' : helperRole}s will be with you as soon as they're available!
        If this is a medical emergency please contact your local /EMS: we do not call EMS on behalf of anyone.
      `);

      // Get the tripsitters channel from the guild
      const tripsittersChannel = interaction.guild.channels.cache
        .find(chan => chan.id === channelTripsittersId);

      // Create a new thread in the channel with
      const helperThread = await tripsittersChannel.threads.create({
        name: `${target.user.username} discuss here!`,
        autoArchiveDuration: 1440,
        type: NODE_ENV === 'production' ? 'GUILD_PRIVATE_THREAD' : 'GUILD_PUBLIC_THREAD',
        reason: `${target.user.username} requested help`,
      });

      const channelTripsitInfo = interaction.client.channels.cache.get(channelTripsitInfoId);

      const helperMsg = stripIndents`
        Hey ${testRun ? 'tripsitter' : tripsitterRole}s and ${testRun ? 'helper' : helperRole}s, ${actor} thinks ${target.user.username} can use some help in ${thread.toString()}!

        Please read the log before interacting and use this thread to coordinate efforts with your fellow Tripsitters/Helpers!

        *You're receiving this alert because you're a Helper/Tripsitter!*
        *Only Tripsitters, Helpers and Moderators can see this thread*!
        *You can remove the helper role in ${channelTripsitInfo.toString()}*!
        `;
      // send a message to the thread
      await helperThread.send(helperMsg);

      const embed = template.embedTemplate()
        .setColor('DARK_BLUE')
        .setDescription(stripIndents`
          Hey ${interaction.member}, we've activated tripsit mode on ${target.user.username}!

          Check your channel list for ${thread.toString()} to talk to the user'

          Check your channel list for ${helperThread.toString()} to meta-talk about the user'

          **Be sure add some information about the user to the thread!**'`);

      interaction.reply({ embeds: [embed], ephemeral: true });
      logger.debug(`[${PREFIX}] target ${target} is now being helped!`);
      return;
    }
    if (enable === 'Off') {
      if (!targetHasNeedsHelpRole) {
        const embed = template.embedTemplate().setColor('DARK_BLUE');
        embed.setDescription(`Hey ${interaction.member}, ${target.user.username} isnt currently being taken care of!`);
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
      embed.setDescription(`Hey ${interaction.member}, we're glad ${target.user.username} is feeling better, we've restored their old roles!`);
      interaction.reply({ embeds: [embed], ephemeral: true });

      logger.debug(`[${PREFIX}] target ${target} is no longer being helped!`);
    }
  },
};
