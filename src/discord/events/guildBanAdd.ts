import {
  Colors,
  GuildAuditLogsEntry,
  PermissionResolvable,
  TextChannel,
} from 'discord.js';
import {
  AuditLogEvent,
} from 'discord-api-types/v10';
import { stripIndents } from 'common-tags';
import {
  GuildBanAddEvent,
} from '../@types/eventDef';
import { checkGuildPermissions } from '../utils/checkPermissions';
import { tripSitTrustScore, userInfoEmbed } from '../commands/guild/d.moderate';
import { sendCooperativeMessage } from '../commands/guild/d.cooperative';

const F = f(__filename);

export const guildBanAdd: GuildBanAddEvent = {
  name: 'guildBanAdd',
  async execute(ban) {
    log.info(F, `Ban ${ban.user} was added.`);

    // Get all guilds in the database
    const guildsData = await db.discord_guilds.findMany({});
    // Filter out guilds that are not partnered, we only alert partners when someone is banned
    const partnerGuildsData = guildsData.filter(guild => guild.partner);
    // Get a list of partnered discord guild objects
    const partnerGuilds = partnerGuildsData.map(guild => discordClient.guilds.cache.get(guild.id));
    // Check how many guilds the member is in
    const inPartnerGuilds = await Promise.all(partnerGuilds.map(async guild => {
      if (!guild) return null;
      try {
        await guild.members.fetch(ban.user.id);
        // log.debug(F, `User is in guild: ${guild.name}`);
        return guild;
      } catch (err:unknown) {
        return null;
      }
    }));
    // Filter out null values
    const mutualGuilds = inPartnerGuilds.filter(item => item !== null);

    // If the user is in a partnered guild, alert the guild
    if (mutualGuilds.length > 0) {
      let banLog = {} as GuildAuditLogsEntry<AuditLogEvent.MemberBanAdd, 'Delete', 'User', AuditLogEvent.MemberBanAdd> | undefined; // eslint-disable-line max-len

      const guildAuditPerms = await checkGuildPermissions(ban.guild, [
        'ViewAuditLog' as PermissionResolvable,
      ]);
      if (guildAuditPerms.hasPermission) {
        const auditLogs = await ban.guild.fetchAuditLogs({ type: AuditLogEvent.MemberBanAdd });
        // Go through each auditLogs and find the one that banned this user
        banLog = auditLogs.entries.find(
          entry => entry.target?.id === ban.user.id,
        );
      }

      const targetData = await db.users.upsert({
        where: {
          discord_id: ban.user.id,
        },
        create: {
          discord_id: ban.user.id,
        },
        update: {
        },
      });

      const embed = await userInfoEmbed(null, ban.user.id, targetData, 'FULL_BAN', false);

      const trustScoreData = await tripSitTrustScore(
        ban.user.id,
      );

      const trustScoreColors = {
        0: Colors.Purple,
        1: Colors.Blue,
        2: Colors.Green,
        3: Colors.Yellow,
        4: Colors.Orange,
        5: Colors.Red,
      };

      embed
        .setColor(trustScoreColors[trustScoreData.trustScore as keyof typeof trustScoreColors])
        .setDescription(stripIndents`**${ban.user} was banned on ${ban.guild.name} and is in your guild!**`);

      await Promise.all(mutualGuilds.map(async guild => {
        if (!guild) return;
        await sendCooperativeMessage(
          embed,
          [`${guild.id}`],
        );
      }));

      if (ban.guild.id === env.DISCORD_GUILD_ID) {
        const channelAuditlog = await discordClient.channels.fetch(env.CHANNEL_AUDITLOG) as TextChannel;

        const response = banLog
          ? `Channel ${ban.user} was banned from ${ban.guild.name} by ${banLog.executor?.tag} for ${banLog.reason}.`
          : `Channel ${ban.user} was banned, but the audit log was inconclusive.`;

        await channelAuditlog.send(response);
      }
    }
  },
};

export default guildBanAdd;
