import {
  GuildBanAddEvent,
} from '../@types/eventDef';

const F = f(__filename);

export const guildBanAdd: GuildBanAddEvent = {
  name: 'guildBanAdd',
  async execute(ban) {
    log.info(F, `Ban ${ban.user} was added.`);

    // Get all guilds in the database
    // const partnerGuildsData = await db.discord_guilds.findMany({
    //   where: {
    //     cooperative: true,
    //   },
    // });
    // log.debug(F, `There are ${partnerGuildsData.length} coop guilds.`);
    // log.debug(F, `${JSON.stringify(partnerGuildsData, null, 2)}`);
    // Get a list of partnered discord guild objects
    // const partnerGuilds = partnerGuildsData
    //   .map(guild => discordClient.guilds.cache.get(guild.id))
    //   .filter(item => item !== undefined) as Guild[];

    // log.debug(F, `Created an array of ${partnerGuilds.length} guilds.`);
    // log.debug(F, `${JSON.stringify(partnerGuilds, null, 2)}`);
    // Check how many guilds the member is in
    // const inPartnerGuilds = await Promise.all(partnerGuilds.map(async guild => {
    //   if (!guild) return null;
    //   try {
    //     await guild.members.fetch(ban.user.id);
    //     // log.debug(F, `User is in guild: ${guild.name}`);
    //     return guild;
    //   } catch (err:unknown) {
    //     return null;
    //   }
    // }));
    // log.info(F, `inPartnerGuilds ${inPartnerGuilds.length}`);
    // log.debug(F, `${JSON.stringify(inPartnerGuilds, null, 2)}`);

    // // If the user is in a partnered guild, alert the guild
    // if (mutualGuilds.length > 0) {
    //   let banLog = {} as GuildAuditLogsEntry<AuditLogEvent.MemberBanAdd, 'Delete', 'User'> | undefined; // eslint-disable-line max-len

    //   log.info(F, 'attempting to send messages');
    //   await Promise.all(mutualGuilds.map(async guild => {
    //     if (!guild) return;
    //     // await sendCooperativeMessage(
    //     //   embed,
    //     //   [`${guild.id}`],
    //     // );
    //     const guildData = await db.discord_guilds.findFirst({
    //       where: {
    //         id: guild.id,
    //         cooperative: true,
    //       },
    //     });

    //     embed
    //       .setColor(trustScoreColors[trustScoreData.trustScore as keyof typeof trustScoreColors])
    //       .setDescription(stripIndents`**Report on ${member}**

    //       **TripSit TrustScore: ${trustScoreData.trustScore}**

    //       **TripSit TrustScore Reasoning**
    //       \`\`\`${trustScoreData.tsReasoning}\`\`\`
    //     `);

    //         await modThread.send(payload);
    //       }
    //     }
    //   }));
  },
};

export default guildBanAdd;
