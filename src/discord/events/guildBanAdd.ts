import type {
  ButtonBuilder,
  GuildAuditLogsEntry,
  GuildMember,
  PermissionResolvable,
  TextChannel,
  ThreadChannel,
} from 'discord.js';

import { stripIndents } from 'common-tags';
import { AuditLogEvent } from 'discord-api-types/v10';
import { ActionRowBuilder, Colors, Guild } from 'discord.js';

import type { GuildBanAddEvent } from '../@types/eventDef';

import { checkGuildPermissions } from '../utils/checkPermissions';
import {
  modButtonBan as moduleButtonBan,
  modButtonInfo as moduleButtonInfo,
  modButtonNote as moduleButtonNote,
  modButtonTimeout as moduleButtonTimeout,
  modButtonWarn as moduleButtonWarn,
  tripSitTrustScore,
  userInfoEmbed,
} from '../utils/modUtils';

const F = f(__filename);

export const guildBanAdd: GuildBanAddEvent = {
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
      .map((guild) => discordClient.guilds.cache.get(guild.id))
      .filter((item) => item !== undefined);

    // log.debug(F, `Created an array of ${partnerGuilds.length} guilds.`);
    // log.debug(F, `${JSON.stringify(partnerGuilds, null, 2)}`);
    // Check how many guilds the member is in
    const inPartnerGuilds = await Promise.all(
      partnerGuilds.map(async (guild) => {
        if (!guild) {
          return null;
        }
        try {
          await guild.members.fetch(ban.user.id);
          // log.debug(F, `User is in guild: ${guild.name}`);
          return guild;
        } catch {
          return null;
        }
      }),
    );
    // log.info(F, `inPartnerGuilds ${inPartnerGuilds.length}`);
    // log.debug(F, `${JSON.stringify(inPartnerGuilds, null, 2)}`);

    // Filter out null values
    const mutualGuilds = inPartnerGuilds.filter((item) => item !== null);
    log.info(F, `I share ${mutualGuilds.length} guilds with ${ban.user.tag}`);

    // If the user is in a partnered guild, alert the guild
    if (mutualGuilds.length > 0) {
      let banLog = {} as
        | GuildAuditLogsEntry<AuditLogEvent.MemberBanAdd, 'Delete', 'User'>
        | undefined;

      const guildAuditPerms = await checkGuildPermissions(ban.guild, [
        'ViewAuditLog' as PermissionResolvable,
      ]);
      if (guildAuditPerms.hasPermission) {
        const auditLogs = await ban.guild.fetchAuditLogs({ type: AuditLogEvent.MemberBanAdd });
        // Go through each auditLogs and find the one that banned this user
        banLog = auditLogs.entries.find((entry) => entry.target?.id === ban.user.id);
      }

      const targetData = await db.users.upsert({
        create: {
          discord_id: ban.user.id,
        },
        update: {},
        where: {
          discord_id: ban.user.id,
        },
      });

      const embed = await userInfoEmbed(null, ban.user.id, targetData, 'FULL_BAN', false);

      const trustScoreData = await tripSitTrustScore(ban.user.id);

      const trustScoreColors = {
        0: Colors.Purple,
        1: Colors.Blue,
        2: Colors.Green,
        3: Colors.Yellow,
        4: Colors.Orange,
        5: Colors.Red,
      };

      log.info(F, 'attempting to send messages');
      await Promise.all(
        mutualGuilds.map(async (guild) => {
          if (!guild) {
            return;
          }
          // await sendCooperativeMessage(
          //   embed,
          //   [`${guild.id}`],
          // );
          const guildData = await db.discord_guilds.findFirst({
            where: {
              cooperative: true,
              id: guild.id,
            },
          });

          if (!guildData) {
            return;
          }

          let member = {} as GuildMember;
          try {
            member = await guild.members.fetch(ban.user.id);
          } catch {
            log.debug(F, `Failed to fetch member ${ban.user.id} from guild ${guild.name}`);
            return;
          }

          embed.setColor(
            trustScoreColors[trustScoreData.trustScore as keyof typeof trustScoreColors],
          ).setDescription(stripIndents`**Report on ${member}**

          **TripSit TrustScore: ${trustScoreData.trustScore}**

          **TripSit TrustScore Reasoning**
          \`\`\`${trustScoreData.tsReasoning}\`\`\`
        `);

          let moduleThread = null as null | ThreadChannel;
          let moduleThreadMessage = `**${member.displayName} was banned from ${ban.guild.name}`;

          if (banLog) {
            if (banLog.executor) {
              moduleThreadMessage += ` by ${banLog.executor?.username}`;
            }
            if (banLog.reason) {
              moduleThreadMessage += ` for "${banLog.reason}"`;
            }
          }

          moduleThreadMessage += ` <@&${guildData.role_moderator}>**`;
          const emoji = '👋';

          if (targetData.mod_thread_id || trustScoreData.trustScore < guildData.trust_score_limit) {
            log.debug(F, `Mod thread id exists: ${targetData.mod_thread_id}`);
            // If the mod thread already exists, then they have previous reports, so we should try to update that thread
            if (targetData.mod_thread_id) {
              try {
                moduleThread = (await guild.channels.fetch(
                  targetData.mod_thread_id,
                )) as null | ThreadChannel;
                log.debug(F, 'Mod thread exists');
              } catch {
                log.debug(F, 'Mod thread does not exist');
              }
            }

            const payload = {
              components: [
                new ActionRowBuilder<ButtonBuilder>().addComponents(
                  moduleButtonNote(ban.user.id),
                  moduleButtonWarn(ban.user.id),
                  moduleButtonTimeout(ban.user.id),
                  moduleButtonBan(ban.user.id),
                  moduleButtonInfo(ban.user.id),
                ),
              ],
              content: moduleThreadMessage,
              embeds: [embed],
            };
            // If the thread still exists, send a message and update the name
            if (moduleThread) {
              await moduleThread.send(payload);
              await moduleThread.setName(`${emoji}│${member.displayName}`);
            } else if (guildData.channel_moderators) {
              // IF the thread doesn't exist, likely deleted, then create a new thread
              const moduleChan = (await discordClient.channels.fetch(
                guildData.channel_moderators,
              )) as TextChannel;

              moduleThread = (await moduleChan.threads.create({
                autoArchiveDuration: 60,
                name: `${emoji}│${member.displayName}`,
              })) as ThreadChannel;

              targetData.mod_thread_id = moduleThread.id;
              await db.users.update({
                data: {
                  mod_thread_id: moduleThread.id,
                },
                where: {
                  discord_id: member.id,
                },
              });

              await moduleThread.send(payload);
            }
          }
        }),
      );

      if (ban.guild.id === env.DISCORD_GUILD_ID) {
        const channelAuditlog = (await discordClient.channels.fetch(
          env.CHANNEL_AUDITLOG,
        )) as TextChannel;

        const response = banLog
          ? `Channel ${ban.user} was banned from ${ban.guild.name} by ${banLog.executor?.tag} for ${banLog.reason}.`
          : `Channel ${ban.user} was banned, but the audit log was inconclusive.`;

        await channelAuditlog.send(response);
      }
    }
  },
  name: 'guildBanAdd',
};

export default guildBanAdd;
