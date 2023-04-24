import {
  Colors,
  TextChannel,
  UserResolvable,
  Collection,
} from 'discord.js';
import { stripIndents } from 'common-tags';
import {
  GuildMemberAddEvent,
} from '../@types/eventDef';
import { database, getUser, usersUpdate } from '../../global/utils/knex';
import { tripSitTrollScore, userInfoEmbed } from '../commands/guild/d.moderate';
import { sendCooperativeMessage } from '../commands/guild/d.cooperative';

const F = f(__filename);

export const guildMemberAdd: GuildMemberAddEvent = {
  name: 'guildMemberAdd',
  async execute(member) {
    // Get all guilds in the database
    const guildsData = await database.guilds.getAll();
    // Filter out guilds that are not partnered, we only alert partners when someone is banned
    const partnerGuildsData = guildsData.filter(guild => guild.partner);

    // Only run on partnered guilds
    if (!partnerGuildsData.find(guild => guild.id === member.guild.id)) return;

    log.debug(F, `${member} joined guild: ${member.guild.name} (id: ${member.guild.id})`);

    const newInvites = await member.guild.invites.fetch();
    const cachedInvites = global.guildInvites.get(member.guild.id);
    const invite = newInvites.find(i => <number > i.uses > cachedInvites.get(i.code));
    let inviteInfo = '';
    if (invite) {
      const inviter = await discordClient.users.fetch(invite.inviter?.id as UserResolvable);
      inviteInfo = inviter
        ? `Joined via ${inviter.tag}'s invite to ${invite.channel?.name} (${invite.code}-${invite.uses})`
        : 'Joined via the vanity url';
    }
    // log.debug(F, `inviteInfo: ${inviteInfo}`);
    global.guildInvites.set(
      member.guild.id,
      new Collection(newInvites.map(inviteEntry => [inviteEntry.code, inviteEntry.uses])),
    );

    const userData = await getUser(member.id, null, null);
    userData.discord_id = member.id;
    userData.joined_at = new Date();

    await usersUpdate(userData);

    const embed = await userInfoEmbed(
      member,
      userData,
    );

    const trollScoreData = await tripSitTrollScore(
      member.user,
    );

    const trollScoreColors = {
      0: Colors.Purple,
      1: Colors.Blue,
      2: Colors.Green,
      3: Colors.Yellow,
      4: Colors.Orange,
      5: Colors.Red,
    };

    embed
      .setColor(trollScoreColors[trollScoreData.trollScore as keyof typeof trollScoreColors])
      .setDescription(stripIndents`**${member} has joined the guild!**`);
    if (inviteInfo) {
      embed.setFooter({ text: inviteInfo });
    }

    if (trollScoreData.trollScore > 3) {
      await sendCooperativeMessage(
        embed,
        [`${member.guild.id}`],
      );
    }

    const auditlog = await discordClient.channels.fetch(env.CHANNEL_AUDITLOG) as TextChannel;
    if (auditlog) {
      await auditlog.send({ embeds: [embed] });
    }
  },
};

export default guildMemberAdd;
