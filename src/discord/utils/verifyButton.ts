/* eslint-disable no-unused-vars */
import { stripIndents } from 'common-tags';
import {
  ButtonInteraction,
  Colors,
  TextChannel,
} from 'discord.js';
import { embedTemplate } from './embedTemplate';

// import {
//   Client,
// } from 'discord.js';

const F = f(__filename);

export default verifyButton;

/**
 * Template
 * @param {Client} client The Client that manages this interaction
 * @return {Promise<void>}
* */
export async function verifyButton(interaction:ButtonInteraction): Promise<void> {
  if (!interaction.guild) {
    interaction.reply({ content: 'This command can only be used in a server!', ephemeral: true });
    return;
  }

  const member = await interaction.guild.members.fetch(interaction.user.id);

  if (member) {
    const memberRole = await interaction.guild.roles.fetch(env.ROLE_MEMBER);
    let colorValue = 1;

    // log.debug(F, `member: ${member.roles.cache}`);

    // log.debug(`Verified button clicked by ${interaction.user.username}#${interaction.user.discriminator}`);
    const channelTripbotlogs = await global.client.channels.fetch(env.CHANNEL_BOTLOG) as TextChannel;
    await channelTripbotlogs.send({
      content: `Verified button clicked by ${interaction.user.username}#${interaction.user.discriminator}`,
    });

    if (memberRole) {
      member.roles.add(memberRole);

      // NOTE: Can be simplified with luxon
      const diff = Math.abs(Date.now() - Date.parse(member.user.createdAt.toString()));
      const years = Math.floor(diff / (1000 * 60 * 60 * 24 * 365));
      const months = Math.floor(diff / (1000 * 60 * 60 * 24 * 30));
      const weeks = Math.floor(diff / (1000 * 60 * 60 * 24 * 7));
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      // log.debug(F, `diff: ${diff}`);
      // log.debug(F, `years: ${years}`);
      // log.debug(F, `months: ${months}`);
      // log.debug(F, `weeks: ${weeks}`);
      // log.debug(F, `days: ${days}`);
      // log.debug(F, `hours: ${hours}`);
      // log.debug(F, `minutes: ${minutes}`);
      // log.debug(F, `seconds: ${seconds}`);
      if (years > 0) {
        colorValue = Colors.White;
      } else if (years === 0 && months > 0) {
        colorValue = Colors.Purple;
      } else if (months === 0 && weeks > 0) {
        colorValue = Colors.Blue;
      } else if (weeks === 0 && days > 0) {
        colorValue = Colors.Green;
      } else if (days === 0 && hours > 0) {
        colorValue = Colors.Yellow;
      } else if (hours === 0 && minutes > 0) {
        colorValue = Colors.Orange;
      } else if (minutes === 0 && seconds > 0) {
        colorValue = Colors.Red;
      }
      // log.debug(F, `coloValue: ${colorValue}`);
      const channelStart = await interaction.client.channels.fetch(env.CHANNEL_START);
      const channelTechhelp = await interaction.client.channels.fetch(env.CHANNEL_HELPDESK);
      const channelBotspam = await interaction.client.channels.fetch(env.CHANNEL_BOTSPAM);
      const channelRules = await interaction.client.channels.fetch(env.CHANNEL_RULES);
      // const channelTripsit = await member.client.channels.fetch(CHANNEL_TRIPSIT);
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
      interaction.reply({
        content: stripIndents`
        Awesome! This channel will disappear when you click away, before you go:
        If you want to talk to the team about /anything/ you can start a new thread in ${channelTechhelp}
        Go ahead and test out the bot in the ${channelBotspam} channel!
        Check out ${channelStart} set your color and icon!
        Or go say hi in ${channelLounge}!
        That's all, have fun!
        `,
        ephemeral: true,
      });
      if (member.roles.cache.has(memberRole.id)) {
        // log.debug(F, `Member already has role!`);
        return;
      }
      await channelLounge.send({ embeds: [embed] });
    } else {
      log.error(F, `memberRole ${env.ROLE_MEMBER} not found`);
      interaction.reply({ content: 'Something went wrong, please make sure the right role exists!' });
    }
  }
}
