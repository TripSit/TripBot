/* eslint-disable max-len */
/* eslint-disable no-unused-vars */

import { stripIndents } from 'common-tags';
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  GuildMember,
  Role,
  SlashCommandBuilder,
  TextChannel,
  ButtonInteraction,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ModalSubmitInteraction,
  CategoryChannel,
  ChatInputCommandInteraction,
  Colors,
  ChannelType,
  PermissionResolvable,
} from 'discord.js';
import { reaction_role_type, reaction_roles } from '@prisma/client';
import { SlashCommand } from '../../@types/commandDef';
import { embedTemplate } from '../../utils/embedTemplate';
import { checkChannelPermissions, checkGuildPermissions } from '../../utils/checkPermissions';

const F = f(__filename);

const guildError = 'This must be performed in a guild!';
const memberError = 'This must be performed by a member of a guild!';
// const loadingMessage = 'Loading please hold...';
const embedOption = 'What color should the embed be?';
const creationReason = 'Tripbot Reaction role';
type RoleDef = { name: string; value: string };

export async function setupCustomReactionRole(
  interaction:ChatInputCommandInteraction,
) {
  if (!interaction.guild) return;
  if (!interaction.member) return;
  if (!interaction.channel) return;
  const introMessageRequired = interaction.options.getBoolean('intro_message')
    ? interaction.options.getBoolean('intro_message')
    : null;
  const messagePostChannel = interaction.options.getChannel('intro_channel')
    ? interaction.options.getChannel('intro_channel')
    : null;

  // If an intro message is required, make sure they specified a channel
  if (introMessageRequired && messagePostChannel === null) {
    await interaction.reply({
      embeds: [
        embedTemplate()
          .setDescription('Error: If an intro message is required, then you must specify where you want the intro message to be posted!')
          .setColor(Colors.Red),
      ],
      ephemeral: true,
    });
    return;
  }

  // Make sure the message channel is a text channel
  if (messagePostChannel && messagePostChannel.type !== ChannelType.GuildText) {
    await interaction.reply({
      embeds: [
        embedTemplate()
          .setDescription('Error: The intro message channel must be a text channel!')
          .setColor(Colors.Red),
      ],
      ephemeral: true,
    });
    return;
  }

  // Double check this is actually an emoji character and not a string
  const emojiInput = interaction.options.getString('emoji');
  const regex = /<a?:.+?:\d{18}>|\p{Extended_Pictographic}/gu;
  const emojiFound = emojiInput ? emojiInput.match(regex) : null;
  log.debug(F, `emojiFound: ${emojiFound}`);

  if (emojiInput && emojiInput.length > 0 && !emojiFound) {
    await interaction.reply({
      embeds: [
        embedTemplate()
          .setDescription('Error: That is not a valid emoji! Please try again.')
          .setColor(Colors.Red),
      ],
      ephemeral: true,
    });
    return;
  }

  if (emojiFound && emojiFound.length > 1) {
    await interaction.reply({
      embeds: [
        embedTemplate()
          .setDescription('Error: You can only specify one emoji!')
          .setColor(Colors.Red),
      ],
      ephemeral: true,
    });
    return;
  }

  const emoji = emojiFound ? emojiFound[0] : null;
  const label = interaction.options.getString('label') ? interaction.options.getString('label') : null;
  // Check that at least either emoji or label is specified
  if (!emoji && !label) {
    await interaction.reply({
      embeds: [
        embedTemplate()
          .setDescription('Error: You must specify either an emoji or a label for the reaction role!')
          .setColor(Colors.Red),
      ],
      ephemeral: true,
    });
    return;
  }

  const role = interaction.options.getRole('role', true) as Role;
  const myMember = interaction.guild.members.me as GuildMember;
  const myRole = myMember.roles.highest;
  // Double check that my role is above this role
  if (role.comparePositionTo(myRole) > 0) {
    await interaction.reply({
      embeds: [
        embedTemplate()
          .setDescription(stripIndents`Error: My role needs to be higher than the role you want to manage!
          Please move my role above ${role} and try again.`)
          .setColor(Colors.Red),
      ],
      ephemeral: true,
    });
    return;
  }

  await interaction.showModal(new ModalBuilder()
    .setCustomId(`"ID":"RR","II":"${interaction.id}"`)
    .setTitle(`${role.name} Description`)
    .addComponents(
      new ActionRowBuilder<TextInputBuilder>()
        .addComponents(
          new TextInputBuilder()
            .setCustomId('title')
            .setRequired(true)
            .setLabel('Title the embed')
        .setPlaceholder(`This will go above the description to highlight what this button does`) // eslint-disable-line
            .setMaxLength(100)
            .setStyle(TextInputStyle.Short),
        ),
      new ActionRowBuilder<TextInputBuilder>()
        .addComponents(
          new TextInputBuilder()
            .setCustomId('description')
            .setRequired(true)
            .setLabel('Describe this role!')
          .setPlaceholder(`This will go into the embed to let people know what they're clicking on!`) // eslint-disable-line
            .setMaxLength(2000)
            .setStyle(TextInputStyle.Paragraph),
        ),
    ));

  // Collect a modal submit interaction
  const filter = (i:ModalSubmitInteraction) => i.customId.startsWith('"ID":"RR"');
  interaction.awaitModalSubmit({ filter, time: 0 })
    .then(async i => {
      const { II } = JSON.parse(`{${i.customId}}`);
      if (II !== interaction.id) return;
      await i.deferReply({ ephemeral: true });
      const button = new ButtonBuilder()
        .setCustomId(`"ID":"RR","RID":"${role.id}","IM":${introMessageRequired},"IC":${messagePostChannel}`)
        .setStyle(ButtonStyle.Primary);
      if (emoji) button.setEmoji(emoji);
      if (label) button.setLabel(label);

      await (interaction.channel as TextChannel).send({
        embeds: [
          embedTemplate()
            .setAuthor(null)
            .setTitle(i.fields.getTextInputValue('title'))
            .setDescription(i.fields.getTextInputValue('description'))
            .setFooter(null),
        ],
        components: [
          new ActionRowBuilder<ButtonBuilder>()
            .addComponents(
              button,
            ),
        ],
      });

      // const channelBotlog = await i.guild?.channels.fetch(env.CHANNEL_BOTLOG) as TextChannel;
      // await channelBotlog.send(
      //   `${(interaction.member as GuildMember).displayName} created a new reaction role message`,
      // );
      await i.editReply({
        embeds: [
          embedTemplate()
            .setDescription(stripIndents`Created the ${role.name} reaction message!`)
            .setColor(Colors.Blue),
        ],
      });
    });
}

export async function buttonReactionRole(
  interaction:ButtonInteraction,
) {
  // log.debug(F, `Processing reaction role click Options: ${JSON.stringify(interaction.customId, null, 2)}`);
  const {
    RID,
    IM,
    IC,
  } = JSON.parse(`{${interaction.customId}}`) as {
    RID:string,
    IM?:string,
    IC?:string,
  };
  if (!interaction.guild) return;
  if (!interaction.member) return;
  if (!interaction.channel) return;

  // log.debug(F, ` RID: ${RID} IM: ${IM} typeof IM: ${typeof IM} IC: ${IC} `);
  const introMessageRequired = IM === 'true';

  // If the intro message isn't required, then there is no modal, so defer
  if (!introMessageRequired) {
    await interaction.deferReply({ ephemeral: true });
  }
  // log.debug(F, `introMessageRequired: ${introMessageRequired} `);

  const role = await interaction.guild.roles.fetch(RID);
  if (!role) {
    log.error(F, `Role ${RID} not found`);
    return;
  }

  const channelProvided = IC;

  const target = interaction.member as GuildMember;
  // If the user already has the role, remove it
  if (target.roles.cache.has(role.id)) {
    if (introMessageRequired) {
      // Display modal to get intro message from the user
      await interaction.showModal(new ModalBuilder()
        .setCustomId(`"ID":"RR","II":"${interaction.id}"`)
        .setTitle(`Are you sure you want to remove ${role.name}?`)
        .addComponents(new ActionRowBuilder<TextInputBuilder>()
          .addComponents(new TextInputBuilder()
            .setCustomId('reason')
            .setLabel('You can optionally tell us why!')
            .setPlaceholder('We\'ll use this to try and improve our process!')
            .setValue('I just don\'t want to anymore')
            .setMaxLength(2000)
            .setStyle(TextInputStyle.Paragraph))));

      // Collect a modal submit interaction
      const filter = (i:ModalSubmitInteraction) => i.customId.startsWith('"ID":"RR"');
      interaction.awaitModalSubmit({ filter, time: 0 })
        .then(async i => {
          // log.debug(F, `${JSON.stringify(i.customId)}`);
          const { II } = JSON.parse(`{${i.customId}}`);
          if (II !== interaction.id) return;
          await i.deferReply({ ephemeral: true });

          await target.roles.remove(role);
          const channelAudit = await i.guild?.channels.fetch(env.CHANNEL_AUDITLOG) as TextChannel;
          const reason = i.fields.getTextInputValue('reason');
          await channelAudit.send(
            `${(i.member as GuildMember).displayName} removed role ${role.name} because: ${reason}`,
          );
          await i.editReply({ content: `Removed role ${role.name}` });
        });
    } else {
      const myMember = interaction.guild.members.me as GuildMember;
      const myRole = myMember.roles.highest;
      log.debug(F, `My role: ${myRole.name} (${myRole.position}) vs ${role.name} (${role.position})`);
      log.debug(F, `My role position: ${role.comparePositionTo(myRole)}`);
      if (role.comparePositionTo(myRole) > 0) {
        await interaction.editReply({
          embeds: [
            embedTemplate()
              .setDescription(stripIndents`Error: My role needs to be higher than the role you want to manage!
              Please move my role above ${role} and try again, or re-do this reaction role`)
              .setColor(Colors.Red),
          ],
        });
        return;
      }
      await target.roles.remove(role);
      await interaction.editReply({ content: `Removed role ${role.name}` });
    }
    return;
  }

  const userData = await db.users.upsert({
    where: {
      discord_id: target.id,
    },
    create: {
      discord_id: target.id,
    },
    update: {},
  });

  // If the role being requested is the Helper or Contributor role, check if they have been banned first
  if (role.id === env.ROLE_HELPER && userData.helper_role_ban) {
    await interaction.editReply({ content: 'Unable to add this role. If you feel this is an error, please talk to the team!' });
    return;
  }

  if (role.id === env.ROLE_CONTRIBUTOR && userData.contributor_role_ban) {
    await interaction.editReply({ content: 'Unable to add this role. If you feel this is an error, please talk to the team!' });
    return;
  }

  // const channelTripsitmeta = await guild.channels.fetch(env.CHANNEL_TRIPSITMETA) as TextChannel;
  // const channelTripmobile = await guild.channels.fetch(env.CHANNEL_TRIPMOBILE) as TextChannel;
  // const channelContent = await guild.channels.fetch(env.CHANNEL_WIKICONTENT) as TextChannel;
  // const channelDevelopment = await guild.channels.fetch(env.CHANNEL_DEVELOPMENT) as TextChannel;

  let introMessage = '' as string;
  if (introMessageRequired) {
    // Display modal to get intro message from the user
    const modal = new ModalBuilder()
      .setCustomId(`"ID":"RR","II":"${interaction.id}"`)
      .setTitle(`${role.name} Introduction`);
    modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder()
      .setCustomId('introduction')
      .setRequired(true)
      .setLabel('Tell us a bit about yourself!')
      .setPlaceholder(`Why do you want to be a ${role.name}?  This will be sent to the channel!`) // eslint-disable-line
      .setMaxLength(1900)
      .setStyle(TextInputStyle.Paragraph)));
    await interaction.showModal(modal);

    // Collect a modal submit interaction
    const filter = (i:ModalSubmitInteraction) => i.customId.startsWith('"ID":"RR"');
    interaction.awaitModalSubmit({ filter, time: 0 })
      .then(async i => {
        // log.debug(F, `${JSON.stringify(i.customId)}`);
        const {
          II,
        } = JSON.parse(`{${i.customId}}`);
        await i.deferReply({ ephemeral: true });

        // log.debug(F, `II: ${II}`);

        if (II !== interaction.id) return;
        if (!i.guild) {
          // log.debug(F, `no guild!`);
          await i.editReply(guildError);
          return;
        }
        if (!i.member) {
        // log.debug(F, `no member!`);
          await i.editReply(memberError);
        }

        introMessage = i.fields.getTextInputValue('introduction');
        // log.debug(F, `introMessage: ${introMessage}`);

        // Put a > in front of each line on introMessage
        introMessage = introMessage.replace(/^(.*)$/gm, '> $1');

        await target.roles.add(role);
        await i.editReply({ content: `Added role ${role.name}` });

        const channel = await i.guild?.channels.fetch(channelProvided as string) as TextChannel;

        const roleTeamtripsit = await i.guild?.roles.fetch(env.ROLE_TEAMTRIPSIT) as Role;

        if (channel.id === env.CHANNEL_TRIPSITMETA) {
          const channelTripsit = await interaction.guild?.channels.fetch(env.CHANNEL_TRIPSIT) as TextChannel;
          const hrCategory = await interaction.guild?.channels.fetch(env.CATEGORY_HARMREDUCTIONCENTRE) as CategoryChannel;

          const intro = stripIndents`
          Hey ${roleTeamtripsit}, ${target.displayName} has joined as a ${role.name}, please welcome them!
          A little about them:
          ${introMessage}`;
          await channel.send(intro);
          const followup = stripIndents`Some important information for you ${target}!
          1) You now have access this this channel, which is used to coordinate with others!
          - Please use this room to ask for help if you're overwhelmed, and feel free to make a thread if it gets busy!
          - Anyone can mark a thread as "owned" if someone is talking to the person in need, it doesn't mean "you" are helping them.
          2) You are able to receive and respond to help requests in the ${hrCategory}!
          - As people need help, a thread will be created in ${channelTripsit} and you will get a notification that someone needs help.
          - Talk with the user in the thread, please don't take the user into DM or voice channels.
          - For a full guide on how the ticket system works, check out: <https://docs.google.com/document/d/19evj7v6nx67TDTUp8DZlu1rrTT5MuwvEZnQ_vDJbfSc/edit#heading=h.3qanhkv29thb>
          - ${channelTripsit} threads are archived after 24 hours, and deleted after 7 days.
          3) For a refresher on tripsitting please see the following resources:
          - <https://docs.google.com/document/d/1vE3jl9imdT3o62nNGn19k5HZVOkECF3jhjra8GkgvwE>
          - <https://wiki.tripsit.me/wiki/How_To_Tripsit_Online>
          - Check the pins in this channel!
          4) If you're overwhelmed, ask for backup
          - Giving no information is better than giving the wrong information!
          - If someone is underage, finish the session and ping a Moderator
          -- Underage users can use the web-chat anonymously but are not allowed to socialize.
          - We're here to give harm reduction facts and mild mental health support.
          - We are NOT here to give medical advice, diagnose, or treat; or handle suicidal or self-harm situations.
          - If it seems like someone could use mental health services you can refer them to:
          Huddle Humans - Mental health support
          <https://discord.gg/mentalhealth>
          HealthyGamer - Mental health with a gaming twist
          <https://discord.com/invite/H3yRwc7>
    
          **If you have any questions, please reach out!**`;
          await channel.send(followup);
        } else if (channel.id === env.CHANNEL_DEVELOPMENT) {
          const devCategory = await interaction.guild?.channels.fetch(env.CATEGORY_DEVELOPMENT) as CategoryChannel;
          const channelTripcord = await interaction.guild?.channels.fetch(env.CHANNEL_DISCORD) as TextChannel;
          const channelTripbot = await interaction.guild?.channels.fetch(env.CHANNEL_TRIPBOT) as TextChannel;

          const intro = stripIndents`
          Hey ${roleTeamtripsit} team, ${target} has joined as a ${role.name}, please welcome them!
          
          A little about them:
          ${introMessage}`;

          channel.send(intro);

          const followup = stripIndents`Some info for you ${target}: 
      
          Our ${devCategory} category holds the projects we're working on.
    
          > **We encourage you to make a new thread whenever possible!**
          > This allows us to organize our efforts and not lose track of our thoughts!
    
          TripSit is run by volunteers, so things may be a bit slower than your day job.
          Almost all the code is open source and can be found on our GitHub: <http://github.com/tripsit>
          Discussion of changes happens mostly in the public channels in this category.
          If you have an idea or feedback, make a new thread: we're happy to hear all sorts of input and ideas!
    
          ${channelTripcord}
          > While this discord has existed for years, TS has only begun to focus on it relatively recently.
          > It is still an ongoing WIP, and this channel is where we coordinate changes to the discord server!
          > Ideas and suggestions are always welcome, and we're always looking to improve the experience!
          > No coding experience is necessary to help make the discord an awesome place to be =)
    
          ${channelTripbot}
          > Our homemade Tripbot has made it's way into the discord server!
          > This is a somewhat complex bot that is continually growing to meet the needs of TripSit.
          > It also can be added to other servers to provide a subset of harm reduction features to the public

          We have a ton of other channels, take your time to explore the threads!

          If you have any questions, please reach out to a moderator or the lead dev!`;

          channel.send(followup);
        } else {
          channel.send(stripIndents`
          ${target} has joined as a ${role.name}, please welcome them!
          
          A little about them:
          > ${introMessage}`); // eslint-disable-line
        }
      });
  } else if (channelProvided) {
    const channel = await interaction.guild.channels.fetch(channelProvided) as TextChannel;
    await target.roles.add(role);
    await interaction.editReply({ content: `Added role ${role.name}` });
    // Post intro message to the channel
    channel.send(`${target} has joined as a ${role.name}, please welcome them!`);
  } else {
    const guildData = await db.discord_guilds.upsert({
      where: {
        id: interaction.guild.id,
      },
      create: {
        id: interaction.guild.id,
      },
      update: {},
    });

    // const isTeam = guildData.team_role_ids !== null
    //   ? (interaction.member as GuildMember).roles.cache.some(r => (guildData.team_role_ids as string).indexOf(r.id) >= 0)
    //   : false;

    const isPremium = guildData.premium_role_ids
      ? (interaction.member as GuildMember).roles.cache.some(r => (guildData.premium_role_ids as string).indexOf(r.id) >= 0)
      : false;

    const isBooster = (interaction.member as GuildMember).roles.cache.find(
      roleData => roleData.tags?.premiumSubscriberRole === true,
    ) !== undefined;

    const isPurchaser = (interaction.member as GuildMember).roles.cache.find(
      roleData => roleData.tags?.availableForPurchase === true,
    ) !== undefined;

    const reactionrolePremiumColorData = await db.reaction_roles.findMany({
      where: {
        guild_id: interaction.guild.id,
        channel_id: interaction.channel.id,
        type: 'PREMIUM_COLOR',
      },
    });

    const premiumColorRoles = [];
    if (reactionrolePremiumColorData.length > 0) {
      const roleDonorRed = await interaction.guild.roles.fetch(
        (reactionrolePremiumColorData.find(roleData => roleData.name === 'Ruby') as reaction_roles).role_id,
      ) as Role;
      const roleDonorOrange = await interaction.guild.roles.fetch(
        (reactionrolePremiumColorData.find(roleData => roleData.name === 'Sunstone') as reaction_roles).role_id,
      ) as Role;
      const roleDonorYellow = await interaction.guild.roles.fetch(
        (reactionrolePremiumColorData.find(roleData => roleData.name === 'Citrine') as reaction_roles).role_id,
      ) as Role;
      const roleDonorGreen = await interaction.guild.roles.fetch(
        (reactionrolePremiumColorData.find(roleData => roleData.name === 'Jade') as reaction_roles).role_id,
      ) as Role;
      const roleDonorBlue = await interaction.guild.roles.fetch(
        (reactionrolePremiumColorData.find(roleData => roleData.name === 'Sapphire') as reaction_roles).role_id,
      ) as Role;
      const roleDonorPurple = await interaction.guild.roles.fetch(
        (reactionrolePremiumColorData.find(roleData => roleData.name === 'Amethyst') as reaction_roles).role_id,
      ) as Role;
      const roleDonorPink = await interaction.guild.roles.fetch(
        (reactionrolePremiumColorData.find(roleData => roleData.name === 'Pezzottaite') as reaction_roles).role_id,
      ) as Role;
      const roleDonorBlack = await interaction.guild.roles.fetch(
        (reactionrolePremiumColorData.find(roleData => roleData.name === 'Labradorite') as reaction_roles).role_id,
      ) as Role;

      premiumColorRoles.push({ name: `💖 ${roleDonorRed.name}`, value: roleDonorRed.id });
      premiumColorRoles.push({ name: `🧡 ${roleDonorOrange.name}`, value: roleDonorOrange.id });
      premiumColorRoles.push({ name: `💛 ${roleDonorYellow.name}`, value: roleDonorYellow.id });
      premiumColorRoles.push({ name: `💚 ${roleDonorGreen.name}`, value: roleDonorGreen.id });
      premiumColorRoles.push({ name: `💙 ${roleDonorBlue.name}`, value: roleDonorBlue.id });
      premiumColorRoles.push({ name: `💜 ${roleDonorPurple.name}`, value: roleDonorPurple.id });
      premiumColorRoles.push({ name: `💗 ${roleDonorPink.name}`, value: roleDonorPink.id });
      premiumColorRoles.push({ name: `🖤 ${roleDonorBlack.name}`, value: roleDonorBlack.id });
    }

    // log.debug(F, `Premium Color roles: ${JSON.stringify(premiumColorRoles, null, 2)}`);
    // const premiumColorNames = premiumColorRoles.map(role => role.name);
    const premiumColorIds = premiumColorRoles.map(roleData => roleData.value);

    // You cant add a premium color if you're not a team member or a donor
    if (premiumColorIds.includes(role.id) && !isPremium && !isBooster && !isPurchaser) {
      // log.debug(F, `role.id is ${role.id} is a premium role and the user is not premium
      //       (isMod: ${isMod}, isTs: ${isTs} isBooster: ${isBooster}, isPatron: ${isPatron})`);
      await interaction.editReply({ content: 'You do not have permission to use that role!' });
      return;
    }

    await target.roles.add(role);
    await interaction.editReply({ content: `Added role ${role.name}` });

    const reactionroleColorData = await db.reaction_roles.findMany({
      where: {
        guild_id: interaction.guild.id,
        channel_id: interaction.channel.id,
        type: 'COLOR',
      },
    });

    const colorRoles = [];
    if (reactionroleColorData.length > 0) {
      const roleRed = await interaction.guild.roles.fetch(
        (reactionroleColorData.find(roleData => roleData.name === 'Tulip') as reaction_roles).role_id,
      ) as Role;
      const roleOrange = await interaction.guild.roles.fetch(
        (reactionroleColorData.find(roleData => roleData.name === 'Marigold') as reaction_roles).role_id,
      ) as Role;
      const roleYellow = await interaction.guild.roles.fetch(
        (reactionroleColorData.find(roleData => roleData.name === 'Daffodil') as reaction_roles).role_id,
      ) as Role;
      const roleGreen = await interaction.guild.roles.fetch(
        (reactionroleColorData.find(roleData => roleData.name === 'Waterlily') as reaction_roles).role_id,
      ) as Role;
      const roleBlue = await interaction.guild.roles.fetch(
        (reactionroleColorData.find(roleData => roleData.name === 'Bluebell') as reaction_roles).role_id,
      ) as Role;
      const rolePurple = await interaction.guild.roles.fetch(
        (reactionroleColorData.find(roleData => roleData.name === 'Hyacinth') as reaction_roles).role_id,
      ) as Role;
      const rolePink = await interaction.guild.roles.fetch(
        (reactionroleColorData.find(roleData => roleData.name === 'Azalea') as reaction_roles).role_id,
      ) as Role;
      const roleWhite = await interaction.guild.roles.fetch(
        (reactionroleColorData.find(roleData => roleData.name === 'Snowdrop') as reaction_roles).role_id,
      ) as Role;

      colorRoles.push({ name: `💖 ${roleRed.name}`, value: roleRed.id });
      colorRoles.push({ name: `🧡 ${roleOrange.name}`, value: roleOrange.id });
      colorRoles.push({ name: `💛 ${roleYellow.name}`, value: roleYellow.id });
      colorRoles.push({ name: `💚 ${roleGreen.name}`, value: roleGreen.id });
      colorRoles.push({ name: `💙 ${roleBlue.name}`, value: roleBlue.id });
      colorRoles.push({ name: `💜 ${rolePurple.name}`, value: rolePurple.id });
      colorRoles.push({ name: `💗 ${rolePink.name}`, value: rolePink.id });
      colorRoles.push({ name: `🤍 ${roleWhite.name}`, value: roleWhite.id });
    }

    log.debug(F, `Color roles: ${JSON.stringify(colorRoles, null, 2)}`);
    // const colorNames = colorRoles.map(roleData => roleData.name);
    const colorIds = colorRoles.map(roleData => roleData.value);

    // Remove the other color roles if you're adding a color role
    if (colorIds.includes(role.id)) {
      // log.debug(F, 'Removing other color roles');
      const otherColorRoles = colorIds.filter(r => r !== role.id);
      await target.roles.remove([...otherColorRoles, ...premiumColorIds]);
    }

    // Remove the other premium color roles if you're adding a color role
    if (premiumColorIds.includes(role.id)) {
      // log.debug(F, 'Removing other premium color roles');
      const otherPremiumColorRoles = premiumColorIds.filter(r => r !== role.id);
      await target.roles.remove([...otherPremiumColorRoles, ...colorIds]);
    }

    const reactionroleData = await db.reaction_roles.findMany({
      where: {
        guild_id: interaction.guild.id,
        channel_id: interaction.channel.id,
        type: 'MINDSET',
      },
    });

    if (reactionroleData.length > 0) {
      const roleDrunk = await interaction.guild.roles.fetch(
        (reactionroleData.find(roleData => roleData.name === 'Drunk') as reaction_roles).role_id,
      ) as Role;
      const roleHigh = await interaction.guild.roles.fetch(
        (reactionroleData.find(roleData => roleData.name === 'High') as reaction_roles).role_id,
      ) as Role;
      const roleRolling = await interaction.guild.roles.fetch(
        (reactionroleData.find(roleData => roleData.name === 'Rolling') as reaction_roles).role_id,
      ) as Role;
      const roleTripping = await interaction.guild.roles.fetch(
        (reactionroleData.find(roleData => roleData.name === 'Tripping') as reaction_roles).role_id,
      ) as Role;
      const roleDissociating = await interaction.guild.roles.fetch(
        (reactionroleData.find(roleData => roleData.name === 'Dissociated') as reaction_roles).role_id,
      ) as Role;
      const roleStimming = await interaction.guild.roles.fetch(
        (reactionroleData.find(roleData => roleData.name === 'Stimming') as reaction_roles).role_id,
      ) as Role;
      const roleSedated = await interaction.guild.roles.fetch(
        (reactionroleData.find(roleData => roleData.name === 'Sedated') as reaction_roles).role_id,
      ) as Role;
      const roleTalkative = await interaction.guild.roles.fetch(
        (reactionroleData.find(roleData => roleData.name === 'Talkative') as reaction_roles).role_id,
      ) as Role;
      const roleWorking = await interaction.guild.roles.fetch(
        (reactionroleData.find(roleData => roleData.name === 'Working') as reaction_roles).role_id,
      ) as Role;

      const mindsetRoles = [
        { name: roleDrunk.name, value: roleDrunk.id },
        { name: roleHigh.name, value: roleHigh.id },
        { name: roleRolling.name, value: roleRolling.id },
        { name: roleTripping.name, value: roleTripping.id },
        { name: roleDissociating.name, value: roleDissociating.id },
        { name: roleStimming.name, value: roleStimming.id },
        { name: roleSedated.name, value: roleSedated.id },
        { name: roleTalkative.name, value: roleTalkative.id },
        { name: roleWorking.name, value: roleWorking.id },
      ] as RoleDef[];

      log.debug(F, `Mindset roles: ${JSON.stringify(mindsetRoles, null, 2)}`);
      // const mindsetNames = mindsetRoles.map(role => role.name);
      const mindsetIds = mindsetRoles.map(roleData => roleData.value);

      // Remove the other mindset roles if you're adding a mindset role
      if (mindsetIds.includes(role.id)) {
        // log.debug(F, 'Removing other mindset roles');
        const otherMindsetRoles = mindsetIds.filter(r => r !== role.id);
        await target.roles.remove([...otherMindsetRoles]);
      }
    }

    // // Remove the other pronoun roles if you're adding a pronoun role
    // if (pronounIds.includes(role.id)) {
    // log.debug(F, 'Removing other pronoun roles');
    //   const otherPronounRoles = pronounIds.filter(r => r !== role.id);
    //   await target.roles.remove([...otherPronounRoles]);
    // }
  }
}

async function createRoles(
  type: reaction_role_type,
  data: { name: string; emoji: string; color: string }[],
  interaction: ChatInputCommandInteraction,
):Promise<reaction_roles[]> {
  await Promise.allSettled(data.map(async roleData => {
    const newRole = await interaction.guild?.roles.create( // eslint-disable-line no-await-in-loop
      {
        name: roleData.name,
        color: `#${roleData.color}`,
        mentionable: false,
        icon: interaction.guild.premiumTier === 2 ? emojiGet(roleData.emoji).url : null,
        reason: creationReason,
        permissions: [],
      },
    ) as Role;

    await db.reaction_roles.upsert({
      where: {
        role_id_reaction_id: {
          role_id: newRole.id,
          reaction_id: '',
        },
      },
      create: {
        guild_id: interaction.guild?.id as string,
        channel_id: interaction.channel?.id as string,
        message_id: '',
        reaction_id: '',
        role_id: newRole.id,
        type,
        name: roleData.name,
      },
      update: {
        guild_id: interaction.guild?.id as string,
        channel_id: interaction.channel?.id as string,
        message_id: '',
        reaction_id: '',
        role_id: newRole.id,
        type,
        name: roleData.name,
      },
    });
  }));

  return db.reaction_roles.findMany({
    where: {
      guild_id: interaction.guild?.id as string,
      channel_id: interaction.channel?.id as string,
      type: 'COLOR',
    },
  });
}

const roleDefinitions = {
  COLOR: [
    { name: 'Tulip', emoji: 'TulipCircle', color: 'ff5f60' },
    { name: 'Marigold', emoji: 'MarigoldCircle', color: 'ffa45f' },
    { name: 'Daffodil', emoji: 'DaffodilCircle', color: 'ffdd5d' },
    { name: 'Waterlily', emoji: 'WaterlilyCircle', color: '6de194' },
    { name: 'Bluebell', emoji: 'BluebellCircle', color: '5acff5' },
    { name: 'Hyacinth', emoji: 'HyacinthCircle', color: 'b072ff' },
    { name: 'Azalea', emoji: 'AzaleaCircle', color: 'ff6dcd' },
    { name: 'Snowdrop', emoji: 'SnowdropCircle', color: 'dadada' },
  ],
  PREMIUM_COLOR: [
    { name: 'Ruby', emoji: 'RubyCircle', color: 'ff3c3e' },
    { name: 'Sunstone', emoji: 'SunstoneCircle', color: 'ff913b' },
    { name: 'Citrine', emoji: 'CitrineCircle', color: 'ffd431' },
    { name: 'Jade', emoji: 'JadeCircle', color: '45e47b' },
    { name: 'Sapphire', emoji: 'BluebellCircle', color: '22bef0' },
    { name: 'Amethyst', emoji: 'AmethystCircle', color: '9542ff' },
    { name: 'Pezzottaite', emoji: 'PezzottaiteCircle', color: 'ff4ac1' },
    { name: 'Labradorite', emoji: 'LabradoriteCircle', color: '626262' },
  ],
  MINDSET: [
    { name: 'Drunk', emoji: 'Alcohol', color: '000000' },
    { name: 'High', emoji: 'Weed', color: '000000' },
    { name: 'Rolling', emoji: 'Empathogens', color: '000000' },
    { name: 'Tripping', emoji: 'Psychedelics', color: '000000' },
    { name: 'Dissociated', emoji: 'Dissociatives', color: '000000' },
    { name: 'Stimming', emoji: 'Stimulants', color: '000000' },
    { name: 'Sedated', emoji: 'Depressants', color: '000000' },
    { name: 'Talkative', emoji: 'Talkative', color: '000000' },
    { name: 'Working', emoji: 'Working', color: '000000' },
  ],
  PRONOUN: [
    { name: 'AskMe', emoji: 'AskMePronouns', color: '000000' },
    { name: 'AnyPronouns', emoji: 'AnyPronouns', color: '000000' },
    { name: 'TheyThem', emoji: 'TheyThem', color: '000000' },
    { name: 'SheHer', emoji: 'SheHer', color: '000000' },
    { name: 'HeHim', emoji: 'HeHim', color: '000000' },
  ],
  NOTIFICATION: [
    { name: 'Announcements', emoji: 'Announcement', color: '000000' },
    { name: 'Voice Chatter', emoji: 'Discussion', color: '000000' }, // eslint-disable-line
    { name: 'Activity Crew', emoji: 'Game', color: '000000' }, // eslint-disable-line
    { name: 'TripBot Updates', emoji: 'Bot', color: '000000' }, // eslint-disable-line
    { name: 'TripTown Updates', emoji: 'buttonTown', color: '000000' }, // eslint-disable-line
  ],
  CUSTOM: [
  ],
};

async function getGuildRole(
  roleType: reaction_role_type,
  roleName: string,
  interaction: ChatInputCommandInteraction,
):Promise<Role> {
  if (!interaction.guild) return {} as Role;
  if (!interaction.channel) return {} as Role;
  let returnRole: Role;

  let reactionroleData = await db.reaction_roles.findMany({
    where: {
      guild_id: interaction.guild.id,
      channel_id: interaction.channel.id,
      type: roleType,
    },
  });
  try {
    log.debug(F, `Pulling role ${roleName} from database`);
    returnRole = await interaction.guild?.roles.fetch(
      (reactionroleData.find(role => role.name === roleName) as reaction_roles).role_id,
    ) as Role;
    log.debug(F, `Role ${returnRole} found in guild`);
  } catch (err) {
    log.debug(F, `Role ${roleName} not found in database`);
    reactionroleData = reactionroleData.filter(role => role.name !== roleName);
    reactionroleData.push(...await createRoles(
      'COLOR' as reaction_role_type,
      [{ name: 'Tulip', emoji: 'TulipCircle', color: 'ff5f60' }],
      interaction,
    ));
    // log.debug(F, `RoleData: ${JSON.stringify(reactionroleData, null, 2)}`);
    returnRole = await interaction.guild.roles.fetch(
      (reactionroleData.find(role => role.name === 'Tulip') as reaction_roles).role_id,
    ) as Role;
    log.debug(F, `Role ${returnRole} found in guild`);
  }
  return returnRole;
}

export async function createColorMessage(
  interaction: ChatInputCommandInteraction,
) {
  await interaction.deferReply({ ephemeral: true });
  if (!interaction.guild) return;
  if (!interaction.member) return;
  if (!interaction.channel) return;

  // const reactionMessage = await (interaction.channel as TextChannel).send({ content: loadingMessage });

  let reactionroleData = await db.reaction_roles.findMany({
    where: {
      guild_id: interaction.guild.id,
      channel_id: interaction.channel.id,
      type: 'COLOR',
    },
  });

  if (reactionroleData.length === 0) {
    // Create the roles and store them in the db
    reactionroleData = await createRoles(
      'COLOR' as reaction_role_type,
      roleDefinitions.COLOR,
      interaction,
    );
  }

  log.debug(F, `Reaction role data: ${JSON.stringify(reactionroleData, null, 2)}`);

  const roleRed = await getGuildRole('COLOR' as reaction_role_type, 'Tulip', interaction);
  const roleOrange = await getGuildRole('COLOR' as reaction_role_type, 'Marigold', interaction);
  const roleYellow = await getGuildRole('COLOR' as reaction_role_type, 'Daffodil', interaction);
  const roleGreen = await getGuildRole('COLOR' as reaction_role_type, 'Waterlily', interaction);
  const roleBlue = await getGuildRole('COLOR' as reaction_role_type, 'Bluebell', interaction);
  const rolePurple = await getGuildRole('COLOR' as reaction_role_type, 'Hyacinth', interaction);
  const rolePink = await getGuildRole('COLOR' as reaction_role_type, 'Azalea', interaction);
  const roleWhite = await getGuildRole('COLOR' as reaction_role_type, 'Snowdrop', interaction);

  const embed = embedTemplate()
    .setAuthor({ name: 'Colors' })
    .setDescription('React to this message to set the color of your nickname!')
    .setFooter({ text: 'You can only pick one color at a time!' })
    .setColor(interaction.options.getString('embed_color') ? `#${interaction.options.getString('embed_color')}` : Colors.Blue);

  const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setLabel(`${roleRed.name}`)
      .setCustomId(`"ID":"RR","RID":"${roleRed.id}"`)
      .setEmoji(emojiGet('TulipCircle').id)
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setLabel(`${roleOrange.name}`)
      .setCustomId(`"ID":"RR","RID":"${roleOrange.id}"`)
      .setEmoji(emojiGet('MarigoldCircle').id)
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setLabel(`${roleYellow.name}`)
      .setCustomId(`"ID":"RR","RID":"${roleYellow.id}"`)
      .setEmoji(emojiGet('DaffodilCircle').id)
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setLabel(`${roleGreen.name}`)
      .setCustomId(`"ID":"RR","RID":"${roleGreen.id}"`)
      .setEmoji(emojiGet('WaterlilyCircle').id)
      .setStyle(ButtonStyle.Primary),
  );

  const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setLabel(`${roleBlue.name}`)
      .setCustomId(`"ID":"RR","RID":"${roleBlue.id}"`)
      .setEmoji(emojiGet('BluebellCircle').id)
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setLabel(rolePurple.name)
      .setCustomId(`"ID":"RR","RID":"${rolePurple.id}"`)
      .setEmoji(emojiGet('HyacinthCircle').id)
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setLabel(rolePink.name)
      .setCustomId(`"ID":"RR","RID":"${rolePink.id}"`)
      .setEmoji(emojiGet('AzaleaCircle').id)
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setLabel(roleWhite.name)
      .setCustomId(`"ID":"RR","RID":"${roleWhite.id}"`)
      .setEmoji(emojiGet('SnowdropCircle').id)
      .setStyle(ButtonStyle.Primary),
  );

  await (interaction.channel as TextChannel).send({ embeds: [embed], components: [row1, row2] });

  await interaction.editReply({
    embeds: [
      embedTemplate()
        .setDescription(stripIndents`Color roles have been set up!
            You can modify each role's name and color code now.
            If you change the name, re-run this command to update this message with your custom name!`)
        .setColor(interaction.options.getString('embed_color') ? `#${interaction.options.getString('embed_color')}` : Colors.Blue),
    ],
  });
}

export async function createPremiumColorMessage(
  interaction: ChatInputCommandInteraction,
) {
  await interaction.deferReply({ ephemeral: true });
  if (!interaction.guild) return;
  if (!interaction.member) return;
  if (!interaction.channel) return;

  // const reactionMessage = await (interaction.channel as TextChannel).send({ content: loadingMessage });

  let reactionroleData = await db.reaction_roles.findMany({
    where: {
      guild_id: interaction.guild.id,
      channel_id: interaction.channel.id,
      type: 'PREMIUM_COLOR',
    },
  });

  if (reactionroleData.length === 0) {
    // Create the roles and store them in the db
    reactionroleData = await createRoles(
      'PREMIUM_COLOR' as reaction_role_type,
      roleDefinitions.PREMIUM_COLOR,
      interaction,
    );
  }

  log.debug(F, `Reaction role data: ${JSON.stringify(reactionroleData, null, 2)}`);

  const premiumRoles = interaction.options.getString('premium_roles');
  if (premiumRoles) {
    const roleMentions = premiumRoles
      .split(' ')
      .map(role => role.replace(/[<@&>]/g, ''))
      .join(',');
    const guildData = await db.discord_guilds.upsert({
      where: {
        id: interaction.guild?.id,
      },
      create: {
        id: interaction.guild?.id,
      },
      update: {},
    });
    guildData.premium_role_ids = roleMentions;
    await db.discord_guilds.update({
      where: {
        id: interaction.guild.id,
      },
      data: {
        premium_role_ids: roleMentions,
      },
    });
  }

  const roleDonorRed = await getGuildRole('PREMIUM_COLOR' as reaction_role_type, 'Ruby', interaction);
  const roleDonorOrange = await getGuildRole('PREMIUM_COLOR' as reaction_role_type, 'Sunstone', interaction);
  const roleDonorYellow = await getGuildRole('PREMIUM_COLOR' as reaction_role_type, 'Citrine', interaction);
  const roleDonorGreen = await getGuildRole('PREMIUM_COLOR' as reaction_role_type, 'Jade', interaction);
  const roleDonorBlue = await getGuildRole('PREMIUM_COLOR' as reaction_role_type, 'Sapphire', interaction);
  const roleDonorPurple = await getGuildRole('PREMIUM_COLOR' as reaction_role_type, 'Amethyst', interaction);
  const roleDonorPink = await getGuildRole('PREMIUM_COLOR' as reaction_role_type, 'Pezzottaite', interaction);
  const roleDonorBlack = await getGuildRole('PREMIUM_COLOR' as reaction_role_type, 'Labradorite', interaction);

  const embed = embedTemplate()
    .setDescription(stripIndents`Boosters and Patrons can access new colors!
  React to this message to set the color of your nickname!`)
    .setAuthor({ name: 'Premium Colors' })
    .setFooter({ text: 'You can only pick one color at a time, choose wisely!' })
    .setColor(interaction.options.getString('embed_color') ? `#${interaction.options.getString('embed_color')}` : Colors.Purple);

  const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setLabel(`${roleDonorRed.name}`)
      .setCustomId(`"ID":"RR","RID":"${roleDonorRed.id}"`)
      .setEmoji(emojiGet('RubyCircle').id)
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setLabel(`${roleDonorOrange.name}`)
      .setCustomId(`"ID":"RR","RID":"${roleDonorOrange.id}"`)
      .setEmoji(emojiGet('SunstoneCircle').id)
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setLabel(`${roleDonorYellow.name}`)
      .setCustomId(`"ID":"RR","RID":"${roleDonorYellow.id}"`)
      .setEmoji(emojiGet('CitrineCircle').id)
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setLabel(`${roleDonorGreen.name}`)
      .setCustomId(`"ID":"RR","RID":"${roleDonorGreen.id}"`)
      .setEmoji(emojiGet('JadeCircle').id)
      .setStyle(ButtonStyle.Primary),
  );

  const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setLabel(`${roleDonorBlue.name}`)
      .setCustomId(`"ID":"RR","RID":"${roleDonorBlue.id}"`)
      .setEmoji(emojiGet('SapphireCircle').id)
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setLabel(`${roleDonorPurple.name}`)
      .setCustomId(`"ID":"RR","RID":"${roleDonorPurple.id}"`)
      .setEmoji(emojiGet('AmethystCircle').id)
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setLabel(`${roleDonorPink.name}`)
      .setCustomId(`"ID":"RR","RID":"${roleDonorPink.id}"`)
      .setEmoji(emojiGet('PezzottaiteCircle').id)
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setLabel(`${roleDonorBlack.name}`)
      .setCustomId(`"ID":"RR","RID":"${roleDonorBlack.id}"`)
      .setEmoji(emojiGet('LabradoriteCircle').id)
      .setStyle(ButtonStyle.Primary),
  );
  await (interaction.channel as TextChannel).send({ embeds: [embed], components: [row1, row2] });

  await interaction.editReply({
    embeds: [
      embedTemplate()
        .setDescription(stripIndents`Premium Color roles have been set up!
            You can modify each role's name and color code now.
            If you change the name, re-run this command to update this message with your custom name!`)
        .setColor(interaction.options.getString('embed_color') ? `#${interaction.options.getString('embed_color')}` : Colors.Purple),
    ],
  });
}

export async function createMindsetMessage(
  interaction: ChatInputCommandInteraction,
) {
  await interaction.deferReply({ ephemeral: true });
  if (!interaction.guild) return;
  if (!interaction.member) return;
  if (!interaction.channel) return;

  // const reactionMessage = await (interaction.channel as TextChannel).send({ content: loadingMessage });

  let reactionroleData = await db.reaction_roles.findMany({
    where: {
      guild_id: interaction.guild.id,
      channel_id: interaction.channel.id,
      type: 'MINDSET',
    },
  });

  log.debug(F, `reactionRoleData: ${JSON.stringify(reactionroleData, null, 2)}`);

  if (reactionroleData.length === 0) {
    // Create the roles and store them in the db
    reactionroleData = await createRoles(
      'MINDSET' as reaction_role_type,
      roleDefinitions.MINDSET,
      interaction,
    );
  }

  log.debug(F, `reactionRoleData: ${JSON.stringify(reactionroleData, null, 2)}`);

  const roleDrunk = await getGuildRole('MINDSET' as reaction_role_type, 'Drunk', interaction);
  const roleHigh = await getGuildRole('MINDSET' as reaction_role_type, 'High', interaction);
  const roleRolling = await getGuildRole('MINDSET' as reaction_role_type, 'Rolling', interaction);
  const roleTripping = await getGuildRole('MINDSET' as reaction_role_type, 'Tripping', interaction);
  const roleDissociating = await getGuildRole('MINDSET' as reaction_role_type, 'Dissociated', interaction);
  const roleStimming = await getGuildRole('MINDSET' as reaction_role_type, 'Stimming', interaction);
  const roleSedated = await getGuildRole('MINDSET' as reaction_role_type, 'Sedated', interaction);
  const roleTalkative = await getGuildRole('MINDSET' as reaction_role_type, 'Talkative', interaction);
  const roleWorking = await getGuildRole('MINDSET' as reaction_role_type, 'Working', interaction);

  const embed = embedTemplate()
    .setAuthor({ name: 'Mindsets' })
    .setDescription(stripIndents`
        **React to this message to show your mindset!**
      `)
  // .setFooter({ text: 'These roles reset after 8 hours to (somewhat) accurately show your mindset!' })
    .setFooter({ text: 'You can only pick one mindset at a time!' })
    .setColor(interaction.options.getString('embed_color') ? `#${interaction.options.getString('embed_color')}` : Colors.Green);

  const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setLabel(`${roleDrunk.name}`)
      .setCustomId(`"ID":"RR","RID":"${roleDrunk.id}"`)
      .setEmoji(emojiGet('Alcohol').id)
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setLabel(`${roleHigh.name}`)
      .setCustomId(`"ID":"RR","RID":"${roleHigh.id}"`)
      .setEmoji(emojiGet('Weed').id)
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setLabel(`${roleRolling.name}`)
      .setCustomId(`"ID":"RR","RID":"${roleRolling.id}"`)
      .setEmoji(emojiGet('Empathogens').id)
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setLabel(`${roleTripping.name}`)
      .setCustomId(`"ID":"RR","RID":"${roleTripping.id}"`)
      .setEmoji(emojiGet('Psychedelics').id)
      .setStyle(ButtonStyle.Primary),
  );

  const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setLabel(`${roleStimming.name}`)
      .setCustomId(`"ID":"RR","RID":"${roleStimming.id}"`)
      .setEmoji(emojiGet('Stimulants').id)
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setLabel(`${roleSedated.name}`)
      .setCustomId(`"ID":"RR","RID":"${roleSedated.id}"`)
      .setEmoji(emojiGet('Depressants').id)
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setLabel(`${roleDissociating.name}`)
      .setCustomId(`"ID":"RR","RID":"${roleDissociating.id}"`)
      .setEmoji(emojiGet('Dissociatives').id)
      .setStyle(ButtonStyle.Primary),
  );

  const row3 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setLabel(`${roleTalkative.name}`)
      .setCustomId(`"ID":"RR","RID":"${roleTalkative.id}"`)
      .setEmoji(emojiGet('Talkative').id)
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setLabel(`${roleWorking.name}`)
      .setCustomId(`"ID":"RR","RID":"${roleWorking.id}"`)
      .setEmoji(emojiGet('Working').id)
      .setStyle(ButtonStyle.Primary),
  );

  // await reactionMessage.edit({ content: null, embeds: [embed], components: [row1, row2, row3] });
  await (interaction.channel as TextChannel).send({ embeds: [embed], components: [row1, row2, row3] });

  await interaction.editReply({
    embeds: [
      embedTemplate()
        .setDescription(stripIndents`Mindset roles have been set up!
            You can modify each role's name and color code now.
            If you change the name, re-run this command to update this message with your custom name!`)
        .setColor(interaction.options.getString('embed_color') ? `#${interaction.options.getString('embed_color')}` : Colors.Green),
    ],
  });
}

export async function createPronounMessage(
  interaction: ChatInputCommandInteraction,
) {
  await interaction.deferReply({ ephemeral: true });
  if (!interaction.guild) return;
  if (!interaction.member) return;
  if (!interaction.channel) return;

  // const reactionMessage = await (interaction.channel as TextChannel).send({ content: loadingMessage });

  let reactionroleData = await db.reaction_roles.findMany({
    where: {
      guild_id: interaction.guild.id,
      channel_id: interaction.channel.id,
      type: 'PRONOUN',
    },
  });

  log.debug(F, `Reactionrole data: ${JSON.stringify(reactionroleData)}`);

  if (reactionroleData.length === 0) {
    // Create the roles and store them in the db
    reactionroleData = await createRoles(
      'PRONOUN' as reaction_role_type,
      roleDefinitions.PRONOUN,
      interaction,
    );
  }

  log.debug(F, `Reactionrole data: ${JSON.stringify(reactionroleData)}`);

  const rolePronounAsk = await getGuildRole('PRONOUN' as reaction_role_type, 'AskMe', interaction);
  const rolePronounAny = await getGuildRole('PRONOUN' as reaction_role_type, 'AnyPronouns', interaction);
  const rolePronounThey = await getGuildRole('PRONOUN' as reaction_role_type, 'TheyThem', interaction);
  const rolePronounShe = await getGuildRole('PRONOUN' as reaction_role_type, 'SheHer', interaction);
  const rolePronounHe = await getGuildRole('PRONOUN' as reaction_role_type, 'HeHim', interaction);

  const embed = embedTemplate()
    .setAuthor({ name: 'Pronouns' })
    .setDescription(stripIndents`Click the button(s) below to pick your pronoun(s)!`)
    .setFooter({ text: 'You may pick as many pronoun roles as you want!' })
    .setColor(interaction.options.getString('embed_color') ? `#${interaction.options.getString('embed_color')}` : Colors.Yellow);

  const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setLabel(`${rolePronounHe.name}`)
      .setCustomId(`"ID":"RR","RID":"${rolePronounHe.id}"`)
      .setEmoji(emojiGet('HeHim').id)
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setLabel(`${rolePronounShe.name}`)
      .setCustomId(`"ID":"RR","RID":"${rolePronounShe.id}"`)
      .setEmoji(emojiGet('SheHer').id)
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setLabel(`${rolePronounThey.name}`)
      .setCustomId(`"ID":"RR","RID":"${rolePronounThey.id}"`)
      .setEmoji(emojiGet('TheyThem').id)
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setLabel(`${rolePronounAny.name}`)
      .setCustomId(`"ID":"RR","RID":"${rolePronounAny.id}"`)
      .setEmoji(emojiGet('AnyPronouns').id)
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setLabel(`${rolePronounAsk.name}`)
      .setCustomId(`"ID":"RR","RID":"${rolePronounAsk.id}"`)
      .setEmoji(emojiGet('AskMePronouns').id)
      .setStyle(ButtonStyle.Primary),
  );

  // await reactionMessage.edit({ content: null, embeds: [embed], components: [row1, row2] });
  await (interaction.channel as TextChannel).send({ embeds: [embed], components: [row1] });

  await interaction.editReply({
    embeds: [
      embedTemplate()
        .setDescription(stripIndents`Pronoun roles have been set up!
            You can modify each role's name and color code now.
            If you change the name, re-run this command to update this message with your custom name!`)
        .setColor(interaction.options.getString('embed_color') ? `#${interaction.options.getString('embed_color')}` : Colors.Yellow),
    ],
  });
}

export async function createNotificationMessage(
  interaction: ChatInputCommandInteraction,
) {
  await interaction.deferReply({ ephemeral: true });
  if (!interaction.guild) return;
  if (!interaction.member) return;
  if (!interaction.channel) return;

  // const reactionMessage = await (interaction.channel as TextChannel).send({ content: loadingMessage });
  const isHome = interaction.guild.id === env.DISCORD_GUILD_ID;

  let reactionroleData = await db.reaction_roles.findMany({
    where: {
      guild_id: interaction.guild.id,
      channel_id: interaction.channel.id,
      type: 'NOTIFICATION',
    },
  });

  if (reactionroleData.length === 0) {
    // Create the roles and store them in the db
    reactionroleData = await createRoles(
      'NOTIFICATION' as reaction_role_type,
      roleDefinitions.NOTIFICATION,
      interaction,
    );
  }

  const roleAnnouncements = await getGuildRole('NOTIFICATION' as reaction_role_type, 'Announcements', interaction);
  const roleVoiceChatter = await getGuildRole('NOTIFICATION' as reaction_role_type, 'Voice Chatter', interaction);
  const roleActivityCrew = await getGuildRole('NOTIFICATION' as reaction_role_type, 'Activity Crew', interaction);

  const embed = embedTemplate()
    .setAuthor({ name: 'Notifications' })
    .setDescription(stripIndents`Click the button${isHome ? 's' : ''} below to pick your notification role${isHome ? 's' : ''}!`)
    .setFooter({ text: 'Having one of these roles means you will receive a @ ping notification for the respective topic.' }) // eslint-disable-line max-len
    .setColor(interaction.options.getString('embed_color') ? `#${interaction.options.getString('embed_color')}` : Colors.Red);

  const row1 = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(
      new ButtonBuilder()
        .setLabel(`${roleAnnouncements.name}`)
        .setCustomId(`"ID":"RR","RID":"${roleAnnouncements.id}"`)
        .setEmoji(emojiGet('Announcement').id)
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setLabel(`${roleVoiceChatter.name}`)
        .setCustomId(`"ID":"RR","RID":"${roleVoiceChatter.id}"`)
        .setEmoji(emojiGet('Discussion').id)
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setLabel(`${roleActivityCrew.name}`)
        .setCustomId(`"ID":"RR","RID":"${roleActivityCrew.id}"`)
        .setEmoji(emojiGet('Game').id)
        .setStyle(ButtonStyle.Primary),
    );

  if (isHome) {
    const roleTripbotUpdates = await getGuildRole('NOTIFICATION' as reaction_role_type, 'TripBot Updates', interaction);
    const roleTriptownUpdates = await getGuildRole('NOTIFICATION' as reaction_role_type, 'TripTown Updates', interaction);
    row1
      .addComponents(
        new ButtonBuilder()
          .setLabel(`${roleTripbotUpdates.name}`)
          .setCustomId(`"ID":"RR","RID":"${roleTripbotUpdates.id}"`)
          .setEmoji(emojiGet('Bot').id)
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setLabel(`${roleTriptownUpdates.name}`)
          .setCustomId(`"ID":"RR","RID":"${roleTriptownUpdates.id}"`)
          .setEmoji(emojiGet('buttonTown').id)
          .setStyle(ButtonStyle.Primary),
      );
  }

  // await reactionMessage.edit({ content: null, embeds: [embed], components: [row1] });
  await (interaction.channel as TextChannel).send({ embeds: [embed], components: [row1] });

  await interaction.editReply({
    embeds: [
      embedTemplate()
        .setDescription(stripIndents`Notification roles have been set up!
            You can modify each role's name and color code now.
            If you change the name, re-run this command to update this message with your custom name!`)
        .setColor(interaction.options.getString('embed_color') ? `#${interaction.options.getString('embed_color')}` : Colors.Red),
    ],
  });
}

export const dReactionRole: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('reaction_role')
    .setDescription('Create a reaction role messages')
    .setIntegrationTypes([0])
    .addSubcommand(subcommand => subcommand
      .setName('help')
      .setDescription('Displays info on this command'))
    .addSubcommand(subcommand => subcommand
      .setName('custom')
      .setDescription('Create a custom reaction role message')
      .addRoleOption(option => option.setName('role')
        .setRequired(true)
        .setDescription('What role should be applied?'))
      .addStringOption(option => option.setName('emoji')
        .setDescription('What emoji should be used?'))
      .addStringOption(option => option.setName('label')
        .setDescription('What should the button label say?'))
      .addBooleanOption(option => option.setName('intro_message')
        .setDescription('Do they need to provide an intro message?'))
      .addChannelOption(option => option.setName('intro_channel')
        .setDescription('Where should the intro message be posted?'))
      .addStringOption(option => option.setName('embed_color')
        .setDescription(embedOption)
        .setAutocomplete(true)))
    .addSubcommand(subcommand => subcommand
      .setName('color')
      .setDescription('Creates the color reaction role message in this channel')
      .addStringOption(option => option.setName('embed_color')
        .setDescription(embedOption)
        .setAutocomplete(true)))
    .addSubcommand(subcommand => subcommand
      .setName('premium_color')
      .setDescription('Creates the premium color reaction role message in this channel')
      .addStringOption(option => option.setName('premium_roles')
        .setDescription('@ mention other roles that should have access to premium colors')
        .setRequired(true))
      .addStringOption(option => option.setName('embed_color')
        .setDescription(embedOption)
        .setAutocomplete(true)))
    .addSubcommand(subcommand => subcommand
      .setName('mindset')
      .setDescription('Creates the mindset reaction role message in this channel')
      .addStringOption(option => option.setName('embed_color')
        .setDescription(embedOption)
        .setAutocomplete(true)))
    .addSubcommand(subcommand => subcommand
      .setName('pronoun')
      .setDescription('Creates the pronoun reaction role message in this channel')
      .addStringOption(option => option.setName('embed_color')
        .setDescription(embedOption)
        .setAutocomplete(true)))
    .addSubcommand(subcommand => subcommand
      .setName('notification')
      .setDescription('Creates the notification reaction role message in this channel')
      .addBooleanOption(option => option.setName('include_voice')
        .setDescription('Include the voice chatter role?'))
      .addBooleanOption(option => option.setName('include_activities')
        .setDescription('Include the activities role?'))
      .addStringOption(option => option.setName('embed_color')
        .setDescription(embedOption)
        .setAutocomplete(true))),
  async execute(interaction) {
    log.info(F, await commandContext(interaction));
    if (!interaction.guild) {
      // log.debug(F, `no guild!`);
      await interaction.reply(guildError);
      return false;
    }

    // Check if the guild is a partner (or the home guild)
    const guildData = await db.discord_guilds.upsert({
      where: {
        id: interaction.guild?.id,
      },
      create: {
        id: interaction.guild?.id,
      },
      update: {},
    });
    if (interaction.guild.id !== env.DISCORD_GUILD_ID
      && !guildData.partner
      && !guildData.supporter) {
      await interaction.reply({
        embeds: [
          embedTemplate()
            .setDescription('This command can only be used in a partner or supporter guilds! Use /reaction_role help for more info.')
            .setColor(Colors.Red),
        ],
        ephemeral: true,
      });
      return false;
    }

    if (!interaction.member) {
      // log.debug(F, `no member!`);
      await interaction.reply(memberError);
    }
    if (!(interaction.member as GuildMember).permissions.has('ManageRoles' as PermissionResolvable)) {
      await interaction.reply({
        embeds: [
          embedTemplate()
            .setDescription('Error: You do not have the ManageRoles permission needed to create a reactionrole message!')
            .setColor(Colors.Red),
        ],
        ephemeral: true,
      });
      return false;
    }

    if (!interaction.guild) {
      await interaction.reply({
        embeds: [
          embedTemplate()
            .setDescription('Error: This command can only be used in a guild!')
            .setColor(Colors.Red),
        ],
        ephemeral: true,
      });
      return false;
    }

    if (!interaction.channel) {
      await interaction.reply({
        embeds: [
          embedTemplate()
            .setDescription('Error: This command can only be used in a channel!')
            .setColor(Colors.Red),
        ],
        ephemeral: true,
      });
      return false;
    }

    if (interaction.channel.type !== ChannelType.GuildText) {
      await interaction.reply({
        embeds: [
          embedTemplate()
            .setDescription('Error: This command can only be used in a text channel!')
            .setColor(Colors.Red),
        ],
        ephemeral: true,
      });
      return false;
    }

    // Check that i have permission to add roles
    const guildPerms = await checkGuildPermissions(interaction.guild, [
      'ManageRoles' as PermissionResolvable,
    ]);
    if (!guildPerms.hasPermission) {
      log.error(F, `Missing guild permission ${guildPerms.permission} in ${interaction.guild}!`);
      await interaction.reply({
        embeds: [
          embedTemplate()
            .setDescription(stripIndents`Error: Missing ${guildPerms.permission} permission in ${interaction.guild}!
            In order to setup the reaction roles feature I need:
            Manage Roles - In order to give and take away roles from users
            Note: My role needs to be higher than all other roles you want managed!`)
            .setColor(Colors.Red),
        ],
        ephemeral: true,
      });
      return false;
    }

    const channelPerms = await checkChannelPermissions(interaction.channel, [
      'ViewChannel' as PermissionResolvable,
      'SendMessages' as PermissionResolvable,
    ]);
    if (!channelPerms.hasPermission) {
      log.error(F, `Missing channel permission ${channelPerms.permission} in ${interaction.channel}!`);
      await interaction.reply({
        embeds: [
          embedTemplate()
            .setDescription(stripIndents`Error: Missing ${channelPerms.permission} permission in ${interaction.channel}!
            In order to setup the reaction roles feature I need:
            View Channel - In order to see the channel
            Send Messages - In order to send the reaction role message`)
            .setColor(Colors.Red),
        ],
        ephemeral: true,
      });
      return false;
    }

    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'help') {
      await interaction.reply({
        embeds: [
          embedTemplate()
            .setTitle('Reaction Role Help')
            .setDescription(stripIndents`This command allows you to create a reaction role message in the current channel.
              This message will allow users to react to it and get a role assigned to them.
              
              If this is your first time using one of the pre-defined reaction templates it will create the necessary roles for you.
              After the first run you can modify the role name, color and icon to your liking.
              You can then re-run the command to update the message with your new names and colors!

              Premium colors are available to:
              * Boosters and Subscribers of your guild, as defined by Discord boosts and subscriptions
              * Premium roles you define in the setup command, eg, Patreon subscribers or team members
              * You will need to re-define the premium list if you run the command again!

              Permissions Needed:
              Manage Roles - In order to give and take away roles from users
              Note: My role needs to be higher than all other roles you want managed!

              **This command can only be used in a partner or supporter guilds!**
              Want to be as supporter? Join our patreon!
              Want to be a partner? Let Moonbear know: this is a very new system and we are still working out the kinks!
              `)
            .addFields(
              {
                name: 'Usage',
                value: stripIndents`/reaction_role [subcommand]
                  /reaction_role help - Displays this message
                  /reaction_role color - Creates the color reaction role message in this channel
                  /reaction_role premium_color - Creates the premium color reaction role message in this channel
                  /reaction_role mindset - Creates the mindset reaction role message in this channel
                  /reaction_role pronoun - Creates the pronoun reaction role message in this channel
                  /reaction_role notification - Creates the notification reaction role message in this channel
                  /reaction_role custom - Creates a custom reaction role message in this channel`,
                inline: false,
              },
              {
                name: 'Examples',
                value: stripIndents`
                  /reaction_role custom Role:@Helper Emoji:🤔 Label:Helper" Intro_message:true Intro_channel:#helpers
                  This will create a reaction role message in the current channel with the role @Helper, the emoji 🤔 and the label Helper.
                  When they click on this button they will need to put in an intro message into the modal that pops up.
                  This intro message will be sent to the #helpers channel.

                  /reaction_role custom Role:@Verified Label:I understand the rules
                  This will create a reaction role message in the current channel with the @Verified role.
                  When they click on this the button that says "I understand the rules" they will be given the Verified role.
                  `,
                inline: false,
              },
            )
            .setColor(Colors.Blue),
        ],
        ephemeral: true,
      });
    } else if (subcommand === 'color') await createColorMessage(interaction);
    else if (subcommand === 'premium_color') await createPremiumColorMessage(interaction);
    else if (subcommand === 'mindset') await createMindsetMessage(interaction);
    else if (subcommand === 'pronoun') await createPronounMessage(interaction);
    else if (subcommand === 'notification') await createNotificationMessage(interaction);
    else if (subcommand === 'custom') await setupCustomReactionRole(interaction);
    return true;
  },
};

// export async function emojiReactionRole(
//   reaction:MessageReaction,
//   user:User,
//   add:boolean,
// ): Promise<void> {
//   const messageId = reaction.message.id;
//   const reactionId = reaction.emoji.id ?? `${reaction.emoji.name}`;
//   // log.debug(F, `messageId: ${messageId} | reactionId: ${reactionId}`);

//   if (!reaction.message.guild) return;

//   const ReactionRole = await reactionroleGet(messageId, reactionId);

//   if (!ReactionRole) {
//     // log.debug(F, `No reaction role found!`);
//     return;
//   }

//   const member = await reaction.message.guild.members.fetch(user.id);
//   const role = await reaction.message.guild.roles.fetch(ReactionRole.role_id);
//   if (role && member) {
//     // log.debug(F, `role: ${role.name}`);
//     if (add) {
//       // Add the role
//       await member.roles.add(role);

//       // Remove other reactions
//       reaction.message.fetch();
//       reaction.message.reactions.cache.each(r => {
//         if (r.emoji.name !== reaction.emoji.name) {
//           r.users.remove(user);
//         }
//       });

//       // If this is a mindset emoji, set the end date
//       if (mindsetEmojis.includes(`${reaction.emoji.name}`)) {
//         // Update the database
//         const userData = await getUser(user.id, null, null);

//         userData.discord_id = user.id;
//         userData.mindset_role = role.id;
//         userData.mindset_role_expires_at = new Date(Date.now() + mindsetRemovalTime);

//         await usersUpdate(userData);
//       }

//       // If this is the contributor role, send a message to the contributor room
//       if (role.id === env.ROLE_CONTRIBUTOR) {
//         const devCategory = await reaction.message.guild?.channels.fetch(env.CATEGORY_DEVELOPMENT) as CategoryChannel;
//         // const channelTripcord = await reaction.message.guild?.channels.fetch(env.CHANNEL_DISCORD) as TextChannel;
//         // const channelTripbot = await reaction.message.guild?.channels.fetch(env.CHANNEL_TRIPBOT) as TextChannel;
//         // const channelContent = await reaction.message.guild?.channels.fetch(env.CHANNEL_CONTENT) as TextChannel;
//         const channelDevelopment = await reaction.message.guild?.channels.fetch(env.CHANNEL_DEVELOPMENT) as TextChannel;
//         // const channelIrc = await reaction.message.guild?.channels.fetch(env.CHANNEL_IRC) as TextChannel;
//         // const channelMatrix = await reaction.message.guild?.channels.fetch(env.CHANNEL_MATRIX) as TextChannel;

//         await channelDevelopment.send(stripIndents`
//           Please welcome our newest ${role.name}, ${member}! We're excited to have you here!

//           Our ${devCategory} category holds the projects we're working on.

//           > **We encourage you to make a new thread whenever possible!**
//           > This allows us to organize our efforts and not lose track of our thoughts!

//           TripSit is run by volunteers, so things may be a bit slower than your day job.
//           Almost all the code is open source and can be found on our GitHub: <http://github.com/tripsit>
//           Discussion of changes happens mostly in the public channels in this category.
//           If you have an idea or feedback, make a new thread or chime in to the discussion:
//           We're happy to hear all sorts of input and ideas!
//         `);
//       }

//       // Same of OCCULT
//       if (role.id === env.ROLE_OCCULT) {
//         const channelOccult = await reaction.message.guild?.channels.fetch(env.CHANNEL_OCCULT) as TextChannel;
//         await channelOccult.send(stripIndents`
//           Please welcome our newest ${role.name} member, ${member}! We're excited to have you here!

//           This room is for discussion of occult topics such as religion, spirituality, psychonautics, and magic.
//           If this isn't your cup of tea you can leave the room by removing the role, but please be respectful of others.
//         `);
//       }

//       // Same of RECOVERY
//       if (role.id === env.ROLE_RECOVERY) {
//         const channelRecovery = await reaction.message.guild?.channels.fetch(env.CHANNEL_RECOVERY) as TextChannel;
//         await channelRecovery.send(stripIndents`
//           Please welcome our newest ${role.name} member, ${member}! We're excited to have you here!
//           The recovery space on tripsit is new and we're still working on it, for now it will hide the drug rooms.
//           No judgement if you don't want to be here or want to see those rooms, you can leave the room by removing the role.
//         `);
//       }
//     } else {
//       // Remove the role
//       await member.roles.remove(role);
//       // log.debug(F, `Removed role ${role.name} from ${user.username}`);
//     }
//   }
// }

export default dReactionRole;
