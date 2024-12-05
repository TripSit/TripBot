import {
  ActionRowBuilder,
  ButtonBuilder,
  Colors,
  Guild,
  GuildAuditLogsEntry,
  GuildMember,
  PermissionResolvable,
  TextChannel,
  ThreadChannel,
} from 'discord.js';
import {
  AuditLogEvent,
} from 'discord-api-types/v10';
import { stripIndents } from 'common-tags';
import {
  GuildBanAddEvent,
} from '../@types/eventDef';
import { checkGuildPermissions } from '../utils/checkPermissions';
import {
  modButtonBan, modButtonInfo, modButtonNote, modButtonTimeout, modButtonWarn, tripSitTrustScore, userInfoEmbed,
} from '../commands/guild/d.moderate';

const F = f(__filename);

export const guildBanAdd: GuildBanAddEvent = {
  name: 'guildBanAdd',
  async execute(ban) {
    log.info(F, `Ban ${ban.user} was added.`);

    // Get all guilds in the database
    const partnerGuildsData = await db.discord_guilds.findMany({
      where: {
        cooperative: true,
      },
    });
    // log.debug(F, `There are ${partnerGuildsData.length} coop guilds.`);
    // log.debug(F, `${JSON.stringify(partnerGuildsData, null, 2)}`);
    // Get a list of partnered discord guild objects
    const partnerGuilds = partnerGuildsData
      .map(guild => discordClient.guilds.cache.get(guild.id))
      .filter(item => item !== undefined) as Guild[];

    // log.debug(F, `Created an array of ${partnerGuilds.length} guilds.`);
    // log.debug(F, `${JSON.stringify(partnerGuilds, null, 2)}`);
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
    // log.info(F, `inPartnerGuilds ${inPartnerGuilds.length}`);
    // log.debug(F, `${JSON.stringify(inPartnerGuilds, null, 2)}`);

    // Filter out null values
    const mutualGuilds = inPartnerGuilds.filter(item => item !== null);
    log.info(F, `I share ${mutualGuilds.length} guilds with ${ban.user.tag}`);

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

      log.info(F, 'attempting to send messages');
      await Promise.all(mutualGuilds.map(async guild => {
        if (!guild) return;
        // await sendCooperativeMessage(
        //   embed,
        //   [`${guild.id}`],
        // );
        const guildData = await db.discord_guilds.findFirst({
          where: {
            id: guild.id,
            cooperative: true,
          },
        });

        if (!guildData) return;

        let member = {} as GuildMember;
        try {
          member = await guild.members.fetch(ban.user.id);
        } catch (err:unknown) {
          log.debug(F, `Failed to fetch member ${ban.user.id} from guild ${guild.name}`);
          return;
        }

        embed
          .setColor(trustScoreColors[trustScoreData.trustScore as keyof typeof trustScoreColors])
          .setDescription(stripIndents`**Report on ${member}**

          **TripSit TrustScore: ${trustScoreData.trustScore}**

          **TripSit TrustScore Reasoning**
          \`\`\`${trustScoreData.tsReasoning}\`\`\`
        `);

        let modThread = null as ThreadChannel | null;
        let modThreadMessage = `**${member.displayName} was banned from ${ban.guild.name}`;

        if (banLog) {
          if (banLog.executor) modThreadMessage += ` by ${banLog.executor?.username}`;
          if (banLog.reason) modThreadMessage += ` for "${banLog.reason}"`;
        }

        modThreadMessage += ` <@&${guildData.role_moderator}>**`;
        const emoji = '👋';

        if (targetData.mod_thread_id || trustScoreData.trustScore < guildData.trust_score_limit) {
          log.debug(F, `Mod thread id exists: ${targetData.mod_thread_id}`);
          // If the mod thread already exists, then they have previous reports, so we should try to update that thread
          if (targetData.mod_thread_id) {
            try {
              modThread = await guild.channels.fetch(targetData.mod_thread_id) as ThreadChannel | null;
              log.debug(F, 'Mod thread exists');
            } catch (err) {
              log.debug(F, 'Mod thread does not exist');
            }
          }

          const payload = {
            content: modThreadMessage,
            embeds: [embed],
            components: [new ActionRowBuilder<ButtonBuilder>().addComponents(
              modButtonNote(ban.user.id),
              modButtonWarn(ban.user.id),
              modButtonTimeout(ban.user.id),
              modButtonBan(ban.user.id),
              modButtonInfo(ban.user.id),
            )],
          };
          // If the thread still exists, send a message and update the name
          if (modThread) {
            await modThread.send(payload);
            await modThread.setName(`${emoji}│${member.displayName}`);
          } else if (guildData.channel_moderators) {
            // IF the thread doesn't exist, likely deleted, then create a new thread
            const modChan = await discordClient.channels.fetch(guildData.channel_moderators) as TextChannel;

            modThread = await modChan.threads.create({
              name: `${emoji}│${member.displayName}`,
              autoArchiveDuration: 60,
            }) as ThreadChannel;

            targetData.mod_thread_id = modThread.id;
            await db.users.update({
              where: {
                discord_id: member.id,
              },
              data: {
                mod_thread_id: modThread.id,
              },
            });

            await modThread.send(payload);
          }
        }
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
