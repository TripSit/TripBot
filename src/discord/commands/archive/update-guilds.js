'use strict';

const path = require('path');
const { SlashCommandBuilder } = require('discord.js');
const logger = require('../../../global/utils/log');
const template = require('../../utils/embed-template');

const PREFIX = parse(__filename).name;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('update-guilds')
    .setDescription('This will update the guild information in the db!'),
  async execute(interaction) {
    log.debug(`[${PREFIX}] Updating guilds...`);
    // Using discord.js find the guilds this bot is in
    const guilds = interaction.client.guilds.cache;
    let guildCount = 0;
    // log.debug(`[${PREFIX}] guilds: ${JSON.stringify(guilds, null, 2)}`);
    await guilds.forEach(async guild => {
      guildCount += 1;
      const targetResults = await getGuildInfo(guild);
      let targetData = targetResults[0];
      const targetFbid = targetResults[1];
      // log.debug(`[${PREFIX}] Guild data: ${JSON.stringify(targetData, null, 2)}`);
      // log.debug(`[${PREFIX}] Guild fbid: ${targetFbid}`);
      targetData = {
        guild_name: guild.name,
        guild_id: guild.id,
        guild_createdAt: guild.createdAt,
        guild_joinedAt: guild.joinedAt,
        guild_description: `${guild.description ? guild.description : 'No description'}`,
        guild_member_count: guild.memberCount,
        guild_owner_id: guild.DISCORD_OWNER_ID,
        guild_icon: guild.iconURL(),
        guild_banned: false,
        guild_large: guild.large,
        guild_nsfw: guild.nsfwLevel,
        guild_partner: guild.partnered,
        guild_preferredLocale: `${guild.preferredLocale ? guild.preferredLocale : 'No Locale'}`,
        guild_region: `${guild.region ? guild.region : 'No region'}`,
        ModActions: targetData.discord.ModActions ? targetData.discord.ModActions : {},
      };
      // log.debug(`[${PREFIX}] Guild data: ${JSON.stringify(targetData, null, 2)}`);
      await setGuildInfo(targetFbid, targetData);
    });
    // get length of guilds
    const embed = template
      .embedTemplate()
      .setDescription(`${guildCount} guilds updated!`);
    interaction.reply({
      embeds: [embed],
      ephemeral: false,
    });
    log.debug(`[${PREFIX}] Guilds updated!`);
  },
};
