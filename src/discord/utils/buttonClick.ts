import {
  Colors,
  ButtonInteraction,
  Client,
  Role,
  TextChannel,
  User,
} from 'discord.js';
import { stripIndents } from 'common-tags';
import { parse } from 'path';
import env from '../../global/utils/env.config';
import log from '../../global/utils/log';
import { startLog } from './startLog';
import { embedTemplate } from './embedTemplate';
import { applicationApprove } from './application';
import {
  tripsitmeButton,
  tripsitmeOwned,
  tripsitmeMeta,
  tripsitmeBackup,
  tripsitmeClose,
  tripsitmeResolve,
} from './tripsitme';
import { techHelpClick, techHelpClose, techHelpOwn } from './techHelp';
import {
  modmailCreate, modmailActions,
} from '../commands/guild/modmail';

const PREFIX = parse(__filename).name;

export default buttonClick;

/**
 * This runs whenever a buttion is clicked
 * @param {ButtonInteraction} interaction The interaction that initialized this
 * @param {Client} client The client that manages it
 * @return {Promise<void>}
 */
export async function buttonClick(interaction:ButtonInteraction, client:Client) {
  startLog(PREFIX, interaction);
  const buttonID = interaction.customId;
  const command = client.commands.get(interaction.customId);

  if (command) {
    // log.debug(`[${PREFIX}] command: ${command}`);
  }

  if (buttonID.startsWith('tripsitmeClick')) {
    await tripsitmeButton(interaction);
    return;
  }

  if (buttonID.startsWith('tripsitmeOwned')) {
    await tripsitmeOwned(interaction);
    return;
  }

  if (buttonID.startsWith('tripsitmeClose')) {
    tripsitmeClose(interaction);
    return;
  }

  if (buttonID.startsWith('tripsitmeResolve')) {
    tripsitmeResolve(interaction);
    return;
  }

  if (buttonID.startsWith('tripsitmeMeta')) {
    tripsitmeMeta(interaction);
    return;
  }

  if (buttonID.startsWith('tripsitmeBackup')) {
    tripsitmeBackup(interaction);
    return;
  }

  if (buttonID.startsWith('modmailIssue')) {
    await modmailActions(interaction);
    return;
  }

  if (buttonID.startsWith('applicationApprove')) {
    applicationApprove(interaction);
    return;
  }
  if (buttonID.startsWith('techHelpOwn')) {
    techHelpOwn(interaction);
    return;
  }
  if (buttonID.startsWith('techHelpClose')) {
    techHelpClose(interaction);
    return;
  }
  if (buttonID.startsWith('techHelpClick')) {
    techHelpClick(interaction);
    return;
  }
  if (buttonID === 'modmailTripsitter') {
    modmailCreate(interaction, 'TRIPSIT');
    return;
  }
  if (buttonID === 'modmailFeedback') {
    modmailCreate(interaction, 'FEEDBACK');
    return;
  }
  if (buttonID === 'modmailTechIssue') {
    modmailCreate(interaction, 'TECH');
    return;
  }
  if (buttonID === 'modmailBanAppeal') {
    modmailCreate(interaction, 'APPEAL');
    return;
  }
  if (buttonID === 'memberbutton') {
    if (!interaction.guild) {
      interaction.reply({ content: 'This command can only be used in a server!', ephemeral: true });
      return;
    }

    const member = await interaction.guild.members.fetch(interaction.user.id);

    if (member) {
      const memberRole = interaction.guild.roles.cache.find((role:Role) => role.id === env.ROLE_MEMBER);
      let colorValue = 1;

      // log.debug(`[${PREFIX}] member: ${member.roles.cache}`);

      // log.debug(`Verified button clicked by ${interaction.user.username}#${interaction.user.discriminator}`);
      const channelTripbotlogs = global.client.channels.cache.get(env.CHANNEL_BOTLOG) as TextChannel;
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
        // log.debug(`[${PREFIX}] diff: ${diff}`);
        // log.debug(`[${PREFIX}] years: ${years}`);
        // log.debug(`[${PREFIX}] months: ${months}`);
        // log.debug(`[${PREFIX}] weeks: ${weeks}`);
        // log.debug(`[${PREFIX}] days: ${days}`);
        // log.debug(`[${PREFIX}] hours: ${hours}`);
        // log.debug(`[${PREFIX}] minutes: ${minutes}`);
        // log.debug(`[${PREFIX}] seconds: ${seconds}`);
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
        // log.debug(`[${PREFIX}] coloValue: ${colorValue}`);
        const channelStart = member.client.channels.cache.get(env.CHANNEL_START.toString());
        const channelTechhelp = member.client.channels.cache.get(env.CHANNEL_HELPDESK);
        const channelBotspam = interaction.client.channels.cache.get(env.CHANNEL_BOTSPAM);
        // const channelTripsit = member.client.channels.cache.get(CHANNEL_TRIPSIT);
        const embed = embedTemplate()
          .setAuthor(null)
          .setColor(colorValue)
          .setThumbnail(member.user.displayAvatarURL())
          .setFooter(null)
          .setDescription(stripIndents`
                **Please welcome ${member.toString()} to the guild!**
                We're glad you're here and hope you enjoy your stay!
                Check out ${channelStart} set your color and icon
                Stay safe, be chill, have fun!`);

        const channelGeneral = member.client.channels.cache.get(env.CHANNEL_GENERAL.toString()) as TextChannel;
        if (channelGeneral) {
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
          if (member.roles.cache.has(memberRole.id as string)) {
            // log.debug(`[${PREFIX}] Member already has role!`);
            return;
          }
          await channelGeneral.send({ embeds: [embed] });
        }
      }
    }
  }
  // if (buttonID === 'underban') {
  //   if (!interaction.guild) {
  //     interaction.reply({content: 'This command can only be used in a server!', ephemeral: true});
  //     return;
  //   }
  //   const roleUnderban = interaction.guild.roles.cache.find(
  //     (role:Role) => role.id === env.ROLE_UNDERBAN.toString()) as Role;
  //   (interaction.member.roles as GuildMemberRoleManager).add(roleUnderban);
  // }
  const modChan = interaction.client.channels.cache.get(env.CHANNEL_MODERATORS) as TextChannel;
  if (buttonID === 'acknowledgebtn') {
    const embed = embedTemplate()
      .setColor(Colors.Green)
      .setDescription(`${interaction.user.username} has acknowledged their warning.`);
    if (modChan) {
      await modChan.send({ embeds: [embed] });
    }
    interaction.reply('Thanks for understanding!');
    return;
  }
  if (buttonID === 'refusalbtn') {
    const guild = interaction.client.guilds.resolve(env.DISCORD_GUILD_ID);
    // log.debug(guild);
    if (guild) {
      guild.members.ban(interaction.user, { deleteMessageDays: 0, reason: 'Refused warning' });
    }
    const embed = embedTemplate()
      .setColor(Colors.Red)
      .setDescription(`${interaction.user.username} has refused their warning and was banned.`);
    await modChan.send({ embeds: [embed] });
    interaction.reply('Thanks for making this easy!');
    return;
  }
  if (buttonID === 'guildacknowledgebtn') {
    // Get the owner of the client
    await interaction.client.application.fetch();
    const botOwner = interaction.client.application.owner as User;
    // log.debug(`[${PREFIX}] bot_owner: ${botOwner}`);
    const embed = embedTemplate()
      .setColor(Colors.Green)
      .setDescription(`${interaction.user.username} has acknowledged their warning.`);
    if (botOwner) {
      await botOwner.send({ embeds: [embed] });
    }
    interaction.reply('Thanks for understanding!');
    return;
  }
  if (buttonID === 'warnbtn') {
    const embed = embedTemplate()
      .setColor(Colors.Red)
      .setDescription(`${interaction.user.username} has refused their warning and was banned.`);
    await modChan.send({ embeds: [embed] });
    interaction.reply('Thanks for making this easy!');
    return;
  }

  if (!command) return;

  try {
    // log.debug(`[${PREFIX}] Executing command: ${command.name}`);
    command.execute(interaction);
  } catch (error) {
    log.error(error);
    interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
  }
}
