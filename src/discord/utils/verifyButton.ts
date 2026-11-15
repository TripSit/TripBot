/* eslint-disable no-unused-vars */
import { stripIndents } from 'common-tags';
import {
  ButtonInteraction,
  Colors,
  MessageFlags,
  TextChannel,
} from 'discord.js';
import { embedTemplate } from './embedTemplate';
import { replyGuildOnly } from './guildOnly';

const F = f(__filename);

export default verifyButton;

// The embed colour gets warmer the newer the account is: the first unit that the account is old enough for wins
const ACCOUNT_AGE_COLORS: [number, number][] = [
  [1000 * 60 * 60 * 24 * 365, Colors.White],
  [1000 * 60 * 60 * 24 * 30, Colors.Purple],
  [1000 * 60 * 60 * 24 * 7, Colors.Blue],
  [1000 * 60 * 60 * 24, Colors.Green],
  [1000 * 60 * 60, Colors.Yellow],
  [1000 * 60, Colors.Orange],
  [1000, Colors.Red],
];

function accountAgeColor(accountAgeMs: number): number {
  return ACCOUNT_AGE_COLORS.find(([unitMs]) => accountAgeMs >= unitMs)?.[1] ?? 1;
}

/**
 * Template
 * @param {Client} discordClient The Client that manages this interaction
 * @return {Promise<void>}
* */
export async function verifyButton(interaction:ButtonInteraction): Promise<void> {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  if (!interaction.guild) {
    await replyGuildOnly(interaction);
    return;
  }

  const member = await interaction.guild.members.fetch(interaction.user.id);

  if (member) {
    const memberRole = await interaction.guild.roles.fetch(env.ROLE_VERIFIED);
    let colorValue = 1;

    const channelTripbotlogs = await global.discordClient.channels.fetch(env.CHANNEL_BOTLOG) as TextChannel;
    await channelTripbotlogs.send({
      content: `Verified button clicked by ${interaction.user.username}#${interaction.user.discriminator}`,
    });

    if (memberRole) {
      member.roles.add(memberRole);

      colorValue = accountAgeColor(Math.abs(Date.now() - Date.parse(member.user.createdAt.toString())));
      const channelStart = await interaction.client.channels.fetch(env.CHANNEL_START);
      const channelTechhelp = await interaction.client.channels.fetch(env.CHANNEL_HELPDESK);
      const channelBotspam = await interaction.client.channels.fetch(env.CHANNEL_BOTSPAM);
      const channelRules = await interaction.client.channels.fetch(env.CHANNEL_RULES);
      const embed = embedTemplate()
        .setAuthor(null)
        .setColor(colorValue)
        .setThumbnail(member.user.displayAvatarURL())
        .setFooter(null)
        .setDescription(stripIndents`
              **Please welcome ${member.toString()} to the guild!**
              Check out ${channelStart} set your color and icon
              Make sure you've read the ${channelRules}
              Be safe, have fun, /report any issues!`);

      const channelLounge = await member.client.channels.fetch(env.CHANNEL_LOUNGE) as TextChannel;
      await interaction.editReply({
        content: stripIndents`
        Awesome! This channel will disappear when you click away, before you go:
        If you want to talk to the team about /anything/ you can start a new thread in ${channelTechhelp}
        Go ahead and test out the bot in the ${channelBotspam} channel!
        Check out ${channelStart} set your color and icon!
        Or go say hi in ${channelLounge}!
        That's all, have fun!
        `,
      });
      if (member.roles.cache.has(memberRole.id)) {
        return;
      }
      await channelLounge.send({ embeds: [embed] });
    } else {
      log.error(F, `verifiedRole ${env.ROLE_VERIFIED} not found`);
      await interaction.editReply({ content: 'Something went wrong, please make sure the right role exists!' });
    }
  }
}
