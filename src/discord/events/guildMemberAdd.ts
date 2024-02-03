import {
  // Colors,
  Collection,
  GuildMember,
  ThreadChannel,
  TextChannel,
  ActionRowBuilder,
  ButtonBuilder,
  DiscordErrorData,
  PermissionResolvable,
  GuildBan,
} from 'discord.js';
import { stripIndents } from 'common-tags';
import {
  GuildMemberAddEvent,
} from '../@types/eventDef';
import {
  modButtonBan, modButtonInfo, modButtonNote, modButtonTimeout, modButtonWarn, tripSitTrustScore, userInfoEmbed,
} from '../commands/guild/d.moderate';
import { checkGuildPermissions } from '../utils/checkPermissions';

const F = f(__filename);

async function getInvite(member:GuildMember) {
  const newInvites = await member.guild.invites.fetch();
  const cachedInvites = global.guildInvites.get(member.guild.id);
  const invite = newInvites.find(i => <number > i.uses > cachedInvites.get(i.code));
  let inviteInfo = 'Joined via the vanity url';
  if (invite && invite.inviter) {
    const inviter = await member.guild.members.fetch(invite.inviter);
    inviteInfo = `Joined via ${inviter.displayName}'s invite (${invite.code}-${invite.uses})`;
  }
  // log.debug(F, `inviteInfo: ${inviteInfo}`);
  global.guildInvites.set(
    member.guild.id,
    new Collection(newInvites.map(inviteEntry => [inviteEntry.code, inviteEntry.uses])),
  );
  return inviteInfo;
}

export const guildMemberAdd: GuildMemberAddEvent = {
  name: 'guildMemberAdd',
  async execute(member) {
    log.debug(F, `${member} joined guild: ${member.guild.name} (id: ${member.guild.id})`);
    // Get all guilds in the database

    const guildData = await db.discord_guilds.findFirst({
      where: {
        id: member.guild.id,
        cooperative: true,
      },
    });

    // log.debug(F, `guildData: ${JSON.stringify(guildData)}`);

    if (!guildData) return;

    const inviteString = await getInvite(member);

    const targetData = await db.users.upsert({
      where: {
        discord_id: member.id,
      },
      create: {
        discord_id: member.id,
        joined_at: new Date(),
      },
      update: {
        joined_at: new Date(),
      },
    });

    const embed = await userInfoEmbed(member, member, targetData, 'NOTE', true);

    const trustScoreData = await tripSitTrustScore(
      member.user.id,
    );

    log.debug(F, `trustScoreData: ${JSON.stringify(trustScoreData)}`);

    // const trustScoreColors = {
    //   0: Colors.Purple,
    //   1: Colors.Blue,
    //   2: Colors.Green,
    //   3: Colors.Yellow,
    //   4: Colors.Orange,
    //   5: Colors.Red,
    //   6: Colors.Red,
    // };

    embed
      // .setColor(trustScoreColors[trustScoreData.trustScore as keyof typeof trustScoreColors])
      .setDescription(stripIndents`**${member} has joined**

        **TripSit TrustScore: ${trustScoreData.trustScore}**

        **TripSit TrustScore Reasoning**
        \`\`\`${trustScoreData.tsReasoning}\`\`\`
      `);

    embed.setFooter({ text: inviteString });

    // if (trustScoreData.trustScore > 3) {
    //   await sendCooperativeMessage(
    //     embed,
    //     [`${member.guild.id}`],
    //   );
    // }

    const bannedTest = await Promise.all(discordClient.guilds.cache.map(async guild => {
      // log.debug(F, `Checking guild: ${guild.name}`);
      const guildPerms = await checkGuildPermissions(guild, [
        'BanMembers' as PermissionResolvable,
      ]);

      if (!guildPerms) {
        return null;
      }

      try {
        return await guild.bans.fetch(member.id);
        // log.debug(F, `User is banned in guild: ${guild.name}`);
        // return guild.name;
      } catch (err: unknown) {
        if ((err as DiscordErrorData).code === 10026) {
          // log.debug(F, `User is not banned in guild: ${guild.name}`);
          return null;
        }
        // log.debug(F, `Error checking guild: ${guild.name}`);
        return null;
      }
    }));

    // count how many 'banned' appear in the array
    const bannedGuilds = bannedTest.filter(item => item) as GuildBan[];

    let modThread = null as ThreadChannel | null;
    let modThreadMessage = `**${member.displayName} has joined the guild!**`;
    let emoji = '👋';

    if (trustScoreData.trustScore < guildData.trust_score_limit) {
      modThreadMessage = `**${member.displayName} has joined the guild, their account is untrusted!** <@&${guildData.role_moderator}>`;
      emoji = '👀';
    }

    if (bannedGuilds.length > 0) {
      modThreadMessage = `**${member.displayName} has joined the guild, they are banned on ${bannedGuilds.length} other guilds!** <@&${guildData.role_moderator}>`;
      emoji = '👀';
    }

    if (targetData.mod_thread_id || trustScoreData.trustScore < guildData.trust_score_limit || bannedGuilds.length > 0) {
      log.debug(F, `Mod thread id exists: ${targetData.mod_thread_id}`);
      // If the mod thread already exists, then they have previous reports, so we should try to update that thread
      if (targetData.mod_thread_id) {
        try {
          modThread = await member.guild.channels.fetch(targetData.mod_thread_id) as ThreadChannel | null;
          log.debug(F, 'Mod thread exists');
        } catch (err) {
          log.debug(F, 'Mod thread does not exist');
        }
      }

      const payload = {
        content: modThreadMessage,
        embeds: [embed],
        components: [new ActionRowBuilder<ButtonBuilder>().addComponents(
          modButtonNote(member.id),
          modButtonWarn(member.id),
          modButtonTimeout(member.id),
          modButtonBan(member.id),
          modButtonInfo(member.id),
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

    guildData.trust_score_count += 1;
    guildData.trust_score_total += trustScoreData.trustScore;
    await db.discord_guilds.update({
      where: { id: guildData.id },
      data: guildData,
    });

    if (guildData.channel_trust) {
      const auditLog = await discordClient.channels.fetch(guildData.channel_trust) as TextChannel;
      await auditLog.send({ embeds: [embed] });
      const trustAverage = guildData.trust_score_total / guildData.trust_score_count;
      let trustMessage = `Trust Score Average = ${trustAverage}`;
      if (trustScoreData.trustScore < trustAverage) {
        trustMessage += '. **User is below the average trust score, i would ask them to verify if this was built out**';
      }

      await auditLog.send(trustMessage);
    }
  },
};

export default guildMemberAdd;
