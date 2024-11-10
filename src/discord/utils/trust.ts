import {
  GuildMember,
  // Colors,
  Collection,
  ThreadChannel,
  TextChannel,
  ActionRowBuilder,
  ButtonBuilder,
  DiscordErrorData,
  PermissionResolvable,
  GuildBan,
} from 'discord.js';
import { stripIndents } from 'common-tags';
import { members } from '@prisma/client';
import {
  modButtonBan, modButtonInfo, modButtonNote, modButtonTimeout, modButtonWarn, tripSitTrustScore, userInfoEmbed,
} from '../commands/guild/d.moderate';
import { checkGuildPermissions } from './checkPermissions';
import { topic } from '../../global/commands/g.topic';
import { giveMilestone } from '../../global/utils/experience';

const F = f(__filename);

async function getInvite(member:GuildMember) {
  const newInvites = await member.guild.invites.fetch();
  const cachedInvites = global.guildInvites.get(member.guild.id);
  const invite = newInvites.find(i => <number > i.uses > cachedInvites.get(i.code));
  let inviteInfo = 'Joined via the vanity url';
  if (invite?.inviter) {
    const inviter = await member.guild.members.fetch(invite.inviter);
    inviteInfo = `Joined via ${inviter.displayName}'s invite (${invite.code}-${invite.uses})`;
  }
  // log.debug(F, `inviteInfo:   ${inviteInfo}`);
  global.guildInvites.set(
    member.guild.id,
    new Collection(newInvites.map(inviteEntry => [inviteEntry.code, inviteEntry.uses])),
  );
  return inviteInfo;
}

export async function addedVerified(
  newMember: GuildMember,
  roleId: string,
) {
  // Check if this was the verified role

  const guildData = await db.discord_guilds.upsert({
    where: {
      id: newMember.guild.id,
    },
    create: {
      id: newMember.guild.id,
    },
    update: {},
  });

  const userData = await db.users.upsert({
    where: {
      discord_id: newMember.id,
    },
    create: {
      discord_id: newMember.id,
    },
    update: {},
  });

  let memberData = {} as members;
  try {
    memberData = await db.members.upsert({
      where: {
        guild_id: guildData.id,
        id: userData.discord_id as string,
      },
      create: {
        guild_id: guildData.id,
        id: userData.discord_id as string,
      },
      update: {},
    });
  } catch {
    log.error(F, 'Error getting member data');
    log.error(F, `newMember: ${JSON.stringify(newMember, null, 2)}`);
  }

  if (roleId === env.ROLE_VERIFIED) {
    if (memberData.trusted) {
      if (guildData.channel_trust) {
        const auditLog = await discordClient.channels.fetch(guildData.channel_trust) as TextChannel;
        await auditLog.send(stripIndents`${newMember.displayName} had the verified role applied, \
but they were already marked at trusted in the database, so no message was sent`);

        // /events/guildMemberUpdate will recognize that the verified rol has been added
        // and will then activate addedVerified() above
      }
      return;
    }
    if (newMember.joinedAt
      && newMember.joinedAt > new Date(Date.now() - 1000 * 60 * 60 * 24)) {
    // log.debug(F, `${newMember.displayName} verified!`);
      // let colorValue = 1;

      // log.debug(F, `member: ${member.roles.cache}`);

      // log.debug(`Verified button clicked by ${interaction.user.username}#${interaction.user.discriminator}`);
      const channelTripbotLogs = await global.discordClient.channels.fetch(env.CHANNEL_TRUST_LOG) as TextChannel;
      await channelTripbotLogs.send({
        content: `${newMember.user.username}#${newMember.user.discriminator} was verified!`,
      });

      // NOTE: Can be simplified with luxon
      // const diff = Math.abs(Date.now() - Date.parse(newMember.user.createdAt.toString()));
      // const years = Math.floor(diff / (1000 * 60 * 60 * 24 * 365));
      // const months = Math.floor(diff / (1000 * 60 * 60 * 24 * 30));
      // const weeks = Math.floor(diff / (1000 * 60 * 60 * 24 * 7));
      // const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      // const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      // const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      // const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      // if (years > 0) {
      //   colorValue = Colors.White;
      // } else if (years === 0 && months > 0) {
      //   colorValue = Colors.Purple;
      // } else if (months === 0 && weeks > 0) {
      //   colorValue = Colors.Blue;
      // } else if (weeks === 0 && days > 0) {
      //   colorValue = Colors.Green;
      // } else if (days === 0 && hours > 0) {
      //   colorValue = Colors.Yellow;
      // } else if (hours === 0 && minutes > 0) {
      //   colorValue = Colors.Orange;
      // } else if (minutes === 0 && seconds > 0) {
      //   colorValue = Colors.Red;
      // }
      // log.debug(F, `coloValue: ${colorValue}`);
      // const channelStart = await newMember.client.channels.fetch(env.CHANNEL_START);
      // const channelTechhelp = await newMember.client.channels.fetch(env.CHANNEL_HELPDESK);
      // const channelBotspam = await newMember.client.channels.fetch(env.CHANNEL_BOTSPAM);
      // const channelRules = await newMember.client.channels.fetch(env.CHANNEL_RULES);
      // const channelTripsit = await member.client.channels.fetch(CHANNEL_TRIPSIT);
      // const embed = embedTemplate()
      //   .setAuthor(null)
      //   .setColor(colorValue)
      //   .setThumbnail(newMember.user.displayAvatarURL())
      //   .setFooter(null)
      //   .setDescription(stripIndents`
      //             **Please welcome ${newMember.toString()} to the guild!**
      //             Be safe, have fun, /report any issues!`);

      const greetingList = [
        `Welcome to the guild, ${newMember}!`,
        `I'm proud to announce that ${newMember} has joined our guild!`,
        `Please welcome ${newMember} to our guild!`,
        `Hello, ${newMember}! Welcome to our guild!`,
        `Welcome to the family, ${newMember}! We're so glad you're here.`,
        `Welcome to the guild, ${newMember}!`,
        `We're excited to have ${newMember} as part of our guild!`,
        `Say hello to our newest member, ${newMember}!`,
        `Let's give a warm welcome to ${newMember}!`,
        `It's great to see you here, ${newMember}!`,
        `Welcome aboard, ${newMember}!`,
        `We're happy to have ${newMember} join us!`,
        `Say hi to ${newMember}, our newest member!`,
        `Join us in welcoming ${newMember} to our guild!`,
        `A big welcome to ${newMember}!`,
      ];

      const greeting = greetingList[Math.floor(Math.random() * greetingList.length)];

      const channelLounge = await newMember.client.channels.fetch(env.CHANNEL_LOUNGE) as TextChannel;
      const message = await channelLounge.send({
        content: stripIndents`**${greeting}**
      Head to <#${env.CHANNEL_TRIPSIT}> if you need a tripsitter. :)
      Be safe, have fun, and don't forget to visit the <id:guide> for more information!

      *${await topic()}*`,
      });

      try {
        await message.react('<:ts_welcomeA:1222543903677485156>');
        await message.react('<:ts_welcomeB:1222543905216663634>');
      } catch (err) {
        log.debug(F, 'Attempted to add welcome emojis to welcome message, but they appear to be missing.');
      }

      await db.members.upsert({
        where: {
          id_guild_id: {
            guild_id: newMember.guild.id,
            id: newMember.id,
          },
        },
        create: {
          guild_id: newMember.guild.id,
          id: newMember.id,
          trusted: true,
        },
        update: {
          trusted: true,
        },
      });

      if (guildData.channel_trust) {
        const auditLog = await discordClient.channels.fetch(guildData.channel_trust) as TextChannel;
        await auditLog.send(stripIndents`I sent ${newMember.displayName}'s welcome message to lounge!`);
      }
    } else {
      await db.members.upsert({
        where: {
          id_guild_id: {
            guild_id: newMember.guild.id,
            id: newMember.id,
          },
        },
        create: {
          guild_id: newMember.guild.id,
          id: newMember.id,
          trusted: true,
        },
        update: {
          trusted: true,
        },
      });

      if (guildData.channel_trust) {
        const auditLog = await discordClient.channels.fetch(guildData.channel_trust) as TextChannel;
        await auditLog.send(stripIndents`${newMember.displayName} had the verified role applied, but they joined\
over a week ago, so no welcome message was sent.`);

        // /events/guildMemberUpdate will recognize that the verified rol has been added
        // and will then activate addedVerified() above
      }
    }
  }
}

export default async function trust(
  member:GuildMember,
):Promise<void> {
  log.debug(F, `${member} joined guild: ${member.guild.name} (id: ${member.guild.id})`);

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

  const trustScoreData = await tripSitTrustScore(member.user.id);

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

  const guildData = await db.discord_guilds.upsert({
    where: {
      id: member.guild.id,
      cooperative: true,
    },
    create: {
      id: member.guild.id,
    },
    update: {},
  });

  if (trustScoreData.trustScore > guildData.trust_score_limit) {
    // What happens when the user has a high trust score
    if (guildData.channel_trust) {
      const auditLog = await discordClient.channels.fetch(guildData.channel_trust) as TextChannel;
      await auditLog.send(stripIndents`${member.displayName} is above the set trust score of \
${guildData.trust_score_limit}, I removed the Unverified role and added Verified`);

      // /events/guildMemberUpdate will recognize that the verified rol has been added
      // and will then activate addedVerified() above
    }

    // Remove the unverified role, add the verified role
    await member.roles.add(env.ROLE_VERIFIED);
    await member.roles.remove(env.ROLE_UNVERIFIED);
  }

  if (bannedGuilds.length > 0) {
    modThreadMessage = stripIndents`**${member.displayName} has joined the guild, \
they are banned on ${bannedGuilds.length} other guilds!** <@&${guildData.role_moderator}>`;
    emoji = '👀';
  }

  if (targetData.mod_thread_id || bannedGuilds.length > 0) {
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
      });

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
      trustMessage += stripIndents`. User is below the set trust score of ${guildData.trust_score_limit}, \
I did not remove the <@&${env.ROLE_UNVERIFIED}> role`;
    }

    // Run the milestone check to make sure the user gets a level role
    await giveMilestone(member);

    await auditLog.send(trustMessage);
  }
}
