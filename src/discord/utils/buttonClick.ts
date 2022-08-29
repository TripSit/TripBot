import {
  Colors,
  ButtonInteraction,
  Client,
  Role,
  TextChannel,
  GuildMemberRoleManager,
  User,
} from 'discord.js';
import logger from '../../global/utils/logger';
import env from '../../global/utils/env.config';
import {stripIndents} from 'common-tags';
import {embedTemplate} from '../utils/embedTemplate';

import {tripsitmeModal} from '../utils/tripsitme';
import {tripsat} from '../utils/tripsat';

// const tripsat = require('./tripsat');
// const modmail = require('../commands/guild/modmail');
// const ircButton = require('../commands/guild/prompt');

const PREFIX = require('path').parse(__filename).name;

/**
 * This runs whenever a buttion is clicked
 * @param {ButtonInteraction} interaction The interaction that started this
 * @param {Client} client The client that manages it
 * @return {Promise<void>}
 */
export async function buttonClick(interaction:ButtonInteraction, client:Client) {
  const buttonID = interaction.customId;
  logger.debug(`[${PREFIX}] buttonID: ${buttonID}`);
  const command = client.commands.get(interaction.customId);
  if (command) {
    logger.debug(`[${PREFIX}] command: ${command}`);
  }

  if (buttonID === 'memberbutton') {
    const member = await interaction.guild?.members.fetch(interaction.user.id);
    const memberRole = interaction.guild?.roles.cache.find((role:Role) => role.id === env.ROLE_MEMBER);
    let colorValue = 1;
    if (member && memberRole) {
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
      // logger.debug(`[${PREFIX}] diff: ${diff}`);
      // logger.debug(`[${PREFIX}] years: ${years}`);
      // logger.debug(`[${PREFIX}] months: ${months}`);
      // logger.debug(`[${PREFIX}] weeks: ${weeks}`);
      // logger.debug(`[${PREFIX}] days: ${days}`);
      // logger.debug(`[${PREFIX}] hours: ${hours}`);
      // logger.debug(`[${PREFIX}] minutes: ${minutes}`);
      // logger.debug(`[${PREFIX}] seconds: ${seconds}`);
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
      // logger.debug(`[${PREFIX}] coloValue: ${colorValue}`);
      const channelStart = member.client.channels.cache.get(env.CHANNEL_START.toString());
      const channelTechhelp = member.client.channels.cache.get(env.CHANNEL_IRC);
      const channelBotspam = interaction.client.channels.cache.get(env.CHANNEL_BOTSPAM);
      // const channelTripsit = member.client.channels.cache.get(CHANNEL_TRIPSIT);
      const embed = embedTemplate()
          .setAuthor(null)
          .setColor(colorValue)
          .setThumbnail(member.user.displayAvatarURL())
          .setFooter(null)
      // .setTitle(`Welcome to TripSit ${member.user.username}!`)
      // .setTitle(`Welcome ${member.toString()} to TripSit ${member}!`)
          .setDescription(stripIndents`
              **Please welcome ${member} to the guild!**
              We're glad you're here and hope you enjoy your stay!
              Check out ${channelStart} set your color and icon
              Stay safe, be chill, have fun!`);
      const ref = db.ref(`${env.FIREBASE_DB_USERS}/${interaction.user.id}/discord/inviteInfo`);
      await ref.once('value', (data) => {
        if (data.val() !== null) {
          embed.setFooter({text: data.val()});
        }
      });

      const channelGeneral = member.client.channels.cache.get(env.CHANNEL_GENERAL.toString()) as TextChannel;
      if (channelGeneral) {
        channelGeneral.send({embeds: [embed]});
        interaction.reply({
          content: stripIndents`
        Awesome! This channel will disappear when you click away, before you go:
        If you want to talk to the team about /anything/ you can start a new thread in ${channelTechhelp}
        Go ahead and test out the bot in the ${channelBotspam} channel!
        Check out ${channelStart} set your color and icon!
        Or go say hi in ${channelGeneral}!
        That's all, have fun!
        `,
          ephemeral: true,
        });
      }
    }
  }

  if (buttonID === 'underban') {
    const roleUnderban = interaction.guild?.roles.cache.find(
        (role:Role) => role.id === env.ROLE_UNDERBAN.toString()) as Role;
    (interaction.member?.roles as GuildMemberRoleManager).add(roleUnderban);
  }

  const modChan = interaction.client.channels.cache.get(env.CHANNEL_MODERATORS) as TextChannel;
  if (buttonID === 'acknowledgebtn') {
    const embed = embedTemplate()
        .setColor(Colors.Green)
        .setDescription(`${interaction.user.username} has acknowledged their warning.`);
    if (modChan) {
      modChan.send({embeds: [embed]});
    }
    interaction.reply('Thanks for understanding!');
    return;
  }

  if (buttonID === 'refusalbtn') {
    const guild = interaction.client.guilds.resolve(env.DISCORD_GUILD_ID.toString());
    logger.debug(guild);
    if (guild) {
      guild.members.ban(interaction.user, {deleteMessageDays: 7, reason: 'Refused warning'});
    }
    const embed = embedTemplate()
        .setColor(Colors.Red)
        .setDescription(`${interaction.user.username} has refused their warning and was banned.`);
    modChan.send({embeds: [embed]});
    interaction.reply('Thanks for making this easy!');
    return;
  }

  if (buttonID === 'guildacknowledgebtn') {
    // Get the owner of the client
    await interaction.client?.application?.fetch();
    const botOwner = interaction.client?.application?.owner as User;
    logger.debug(`[${PREFIX}] bot_owner: ${botOwner}`);
    const embed = embedTemplate()
        .setColor(Colors.Green)
        .setDescription(`${interaction.user.username} has acknowledged their warning.`);
    if (botOwner) {
      botOwner.send({embeds: [embed]});
    }
    interaction.reply('Thanks for understanding!');
    return;
  }

  if (buttonID === 'warnbtn') {
    const embed = embedTemplate()
        .setColor(Colors.Red)
        .setDescription(`${interaction.user.username} has refused their warning and was banned.`);
    modChan.send({embeds: [embed]});
    interaction.reply('Thanks for making this easy!');
    return;
  }

  if (buttonID === 'tripsitme') {
    return tripsitmeModal(interaction);
  }
  if (buttonID.startsWith('tripsat_')) {
    logger.debug(`[${PREFIX}] tripsat_them: ${interaction.user.username}`);
    logger.debug(`[${PREFIX}] channelId: ${interaction.channel!.id}`);
    logger.debug(`[${PREFIX}] ID: ${buttonID.slice(8)}`);
    const target = await interaction.guild!.members.fetch(buttonID.slice(8));
    logger.debug(`[${PREFIX}] target: ${target}`);
    return tripsat(interaction, target);
  }
  // if (buttonID === 'modmailTripsitter') {
  //   return modmail.modmailTripsitter(interaction);
  // }
  // // if (buttonID === 'modmailCommands') { return modmail.modmailCommands(interaction); }
  // if (buttonID === 'modmailFeedback') {
  //   return modmail.modmailFeedback(interaction);
  // }
  // if (buttonID === 'modmailIrcissue') {
  //   return modmail.modmailIssue(interaction, 'irc');
  // }
  // if (buttonID === 'modmailDiscordissue') {
  //   return modmail.modmailIssue(interaction, 'discord');
  // }
  // if (buttonID === 'ircAppeal') {
  //   return ircButton.ircClick(interaction, 'ircAppeal');
  // }
  // if (buttonID === 'ircConnect') {
  //   return ircButton.ircClick(interaction, 'ircConnect');
  // }
  // if (buttonID === 'ircOther') {
  //   return ircButton.ircClick(interaction, 'ircOther');
  // }
  // if (buttonID === 'discordIssue') {
  //   return ircButton.ircClick(interaction, 'discordIssue');
  // }

  if (!command) return;

  try {
    logger.debug(`[${PREFIX}] Executing command: ${command.name}`);
    command.execute(interaction);
  } catch (error) {
    logger.error(error);
    interaction.reply({content: 'There was an error while executing this command!', ephemeral: true});
  }
  logger.debug(`[${PREFIX}] finished!`);
};
