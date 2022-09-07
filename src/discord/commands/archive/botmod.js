'use strict';

const path = require('path');
const {
  SlashCommandBuilder,
  time,
  ButtonStyle,
  Colors,
} = require('discord.js');
const { ActionRowBuilder, ButtonBuilder } = require('discord.js');
const logger = require('../../../global/utils/logger');
const template = require('../../utils/embed-template');
const { getGuildInfo, setGuildInfo } = require('../../../global/services/firebaseAPI');

const PREFIX = path.parse(__filename).name;

const warnButtons = new ActionRowBuilder()
  .addComponents(new ButtonBuilder()
    .setCustomId('guildacknowledgebtn')
    .setLabel('I understand, it wont happen again!')
    .setStyle(ButtonStyle.Primary));

module.exports = {
  data: new SlashCommandBuilder()
    .setName('botmod')
    .setDescription('Bot Mod Actions!')
    .addSubcommandGroup(subcommandgroup => subcommandgroup
      .setName('guild')
      .setDescription('Bot mod guilds')
      .addSubcommand(subcommand => subcommand
        .setName('info')
        .setDescription('Info on an ID')
        .addStringOption(option => option
          .setName('target')
          .setDescription('User to warn!')
          .setRequired(true)))
      .addSubcommand(subcommand => subcommand
        .setName('warn')
        .setDescription('Warn an ID')
        .addStringOption(option => option
          .setName('target')
          .setDescription('User to warn!')
          .setRequired(true))
        .addStringOption(option => option
          .setName('reason')
          .setDescription('Reason for warn!')
          .setRequired(true)))
      .addSubcommand(subcommand => subcommand
        .setName('kick')
        .setDescription('Kick an ID')
        .addStringOption(option => option
          .setName('target')
          .setDescription('User to kick!')
          .setRequired(true))
        .addStringOption(option => option
          .setName('reason')
          .setDescription('Reason for kick!')
          .setRequired(true)))
      .addSubcommand(subcommand => subcommand
        .setName('ban')
        .setDescription('Ban an ID')
        .addStringOption(option => option
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
          )
          .setRequired(true))))
    .addSubcommandGroup(subcommandgroup => subcommandgroup
      .setName('user')
      .setDescription('Bot mod users')
      .addSubcommand(subcommand => subcommand
        .setName('info')
        .setDescription('Info on an ID')
        .addStringOption(option => option
          .setName('target')
          .setDescription('User to warn!')
          .setRequired(true)))
      .addSubcommand(subcommand => subcommand
        .setName('warn')
        .setDescription('Warn an ID')
        .addStringOption(option => option
          .setName('target')
          .setDescription('User to warn!')
          .setRequired(true))
        .addStringOption(option => option
          .setName('reason')
          .setDescription('Reason for warn!')
          .setRequired(true)))
      .addSubcommand(subcommand => subcommand
        .setName('ban')
        .setDescription('Ban an ID')
        .addStringOption(option => option
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
          .addChoices(
            { name: 'On', value: 'on' },
            { name: 'Off', value: 'off' },
          )
          .setRequired(true)))),

  async execute(interaction) {
    const actor = interaction.member;
    logger.debug(`[${PREFIX}] Actor: ${actor}`);
    const command = interaction.options.getSubcommand();
    logger.debug(`[${PREFIX}] Command: ${command}`);
    const group = interaction.options.getSubcommandGroup();
    logger.debug(`[${PREFIX}] Group: ${group}`);
    const targetId = interaction.options.getString('target');
    logger.debug(`[${PREFIX}] target: ${targetId}`);
    const toggle = interaction.options.getString('toggle');
    logger.debug(`[${PREFIX}] toggle: ${toggle}`);
    const reason = interaction.options.getString('reason');
    logger.debug(`[${PREFIX}] reason: ${reason}`);

    let color = '';
    if (group === 'guild') {
      let targetGuild = {};
      let targetGuildOwner = {};
      try {
        targetGuild = await interaction.client.guilds.fetch(targetId);
        targetGuildOwner = interaction.client.users.cache.get(targetGuild.DISCORD_OWNER_ID);
      } catch (e) {
        interaction.reply('Invalid Guild ID, or i\'m not in that guild!');
        return;
      }

      // Extract target guild info
      const targetAction = `${command}_received`;
      const targetResults = await getGuildInfo(targetGuild);
      const targetData = targetResults[0];

      // Transform target guild info
      if ('modActions' in targetData) {
        targetData.discord.modActions[targetAction] = (
          targetData.discord.modActions[targetAction] || 0) + 1;
      } else {
        targetData.discord.modActions = { [targetAction]: 1 };
      }
      logger.debug(`[${PREFIX}] target_data: ${JSON.stringify(targetData)}`);

      if (command === 'warn') {
        color = 'YELLOW';
        const warnEmbed = template.embedTemplate()
          .setColor(color)
          .setTitle('Warned!')
          .setDescription(`Your guild has warned by Team TripSit for ${reason}.\n\nPlease read the rules and be respectful of them.\n\nContact Moonbear if you have any questions!`);
        targetGuildOwner.send({ embeds: [warnEmbed], components: [warnButtons] });
        logger.debug(`[${PREFIX}] I warned ${targetGuild}'s owner ${targetGuildOwner}!`);
      } else if (command === 'kick') {
        targetGuild.leave();
        color = 'ORANGE';
        const warnEmbed = template.embedTemplate()
          .setColor(color)
          .setTitle('Kicked!')
          .setDescription(`I have left your guild because ${reason}.\n\nYou have the option to re-add me, but please read the rules and be respectful of them.\n\nContact Moonbear if you have any questions!`);
        targetGuildOwner.send({ embeds: [warnEmbed], components: [warnButtons] });
        logger.debug(`[${PREFIX}] I left ${targetGuild}!`);
      } else if (command === 'ban') {
        if (toggle === 'on') {
          if (targetData.isBanned) {
            const embed = template.embedTemplate()
              .setColor(Colors.Green)
              .setTitle('Guild Already Banned')
              .addFields(
                { name: 'Guild ID', value: targetId },
              );
            return interaction.reply({ embeds: [embed] });
          }

          targetData.guild_banned = true;
          targetGuild.leave();
          color = 'RED';
          const warnEmbed = template.embedTemplate()
            .setColor(color)
            .setTitle('Banned!')
            .setDescription(`I have left your guild permenantly because ${reason}.\n\nContact Moonbear if you have any questions!`);
          targetGuildOwner.send({ embeds: [warnEmbed] });
          logger.debug(`[${PREFIX}] I banned ${targetGuild}!`);
        } else if (toggle === 'off') {
          if (!targetData.isBanned) {
            const embed = template.embedTemplate()
              .setColor(Colors.Green)
              .setTitle('Guild Not Banned')
              .addFields(
                { name: 'Guild ID', value: targetId },
              );
            return interaction.reply({ embeds: [embed] });
          }

          targetData.guild_banned = false;
          color = 'GREEN';
          const warnEmbed = template.embedTemplate()
            .setColor(color)
            .setTitle('Unbanned!')
            .setDescription(`I have unbanned your guild because ${reason}.\n\nContact Moonbear if you have any questions!`);
          targetGuildOwner.send({ embeds: [warnEmbed] });
          logger.debug(`[${PREFIX}] I unbanned ${targetGuild}!`);
        }
      }

      // Load target guild info
      // Load actor data
      await setGuildInfo(targetResults[1], targetData);

      if (command !== 'info') {
        const title = `I have ${command}ed ${targetGuild} ${reason ? `because ${reason}` : ''}`;
        const embed = template.embedTemplate().setColor(color).setDescription(title);
        interaction.reply({ embeds: [embed], ephemeral: true });
        logger.debug(`[${PREFIX}] I replied to ${interaction.member}!`);
        return;
      }

      const title = `${actor} ${command}ed ${targetGuild} ${reason ? `because ${reason}` : ''}`;
      const targetEmbed = template.embedTemplate()
        .setColor(Colors.Blue)
        .setDescription(title)
        .addFields(
          { name: 'Guild Name', value: `${targetData.guild_name}`, inline: true },
          { name: 'Guild Acronym', value: `${targetData.guild_nameAcronym}`, inline: true },
          { name: 'Guild ID', value: `${targetData.guild_id}`, inline: true },
        )
        .addFields(
          { name: 'Guild Created', value: `${time(targetData.createdAt, 'R')}`, inline: true },
          { name: 'Guild Joined', value: `${time(targetData.joinedAt, 'R')}`, inline: true },
          { name: 'Guild Description', value: `${targetData.guild_description}`, inline: true },
        )
        .addFields(
          { name: 'guild_member_count', value: `${targetData.guild_member_count}`, inline: true },
          { name: 'guild_owner_id', value: `${targetData.guild_owner_id}`, inline: true },
          { name: 'guild_owner_name', value: `${targetData.guild_owner_name}`, inline: true },
        )
        .addFields(
          { name: 'guild_banned', value: `${targetData.guild_banned}`, inline: true },
          { name: 'guild_large', value: `${targetData.guild_large}`, inline: true },
          { name: 'guild_nsfw', value: `${targetData.guild_nsfw}`, inline: true },
        )
        .addFields(
          { name: 'guild_partner', value: `${targetData.guild_partner}`, inline: true },
          { name: 'guild_preferredLocale', value: `${targetData.guild_preferredLocale}`, inline: true },
          { name: 'guild_region', value: `${targetData.guild_region}`, inline: true },
        );

      if (command === 'info') {
        interaction.reply({ embeds: [targetEmbed], ephemeral: true });
        logger.debug(`${PREFIX} replied to user ${interaction.member.user.name} with info about ${targetData.guild_name}`);
        logger.debug(`[${PREFIX}] finished!`);
        return;
      }

      // logger.debug(`${PREFIX} channel_moderators_id: ${channel_moderators_id}`);
      // const mod_chan = interaction.client.channels.cache.get(channel_moderators_id);
      // // mod_chan.send({ embeds: [target_embed], components: [mod_buttons] });
      // mod_chan.send({ embeds: [target_embed] });
      // logger.debug(`${PREFIX} send a message to the moderators room`);
      logger.debug(`[${PREFIX}] finished!`);
    }
  },
};
