import {
  ActionRowBuilder,
  TextInputBuilder,
  ModalBuilder,
  ButtonInteraction,
  TextChannel,
  ButtonBuilder,
  GuildMember,
  User,
  ThreadChannel,
  ModalSubmitInteraction,
  Colors,
  EmbedBuilder,
  AllowedThreadTypeForTextChannel,
} from 'discord.js';
import {
  ChannelType,
  TextInputStyle,
  ButtonStyle,
} from 'discord-api-types/v10';
import { stripIndents } from 'common-tags';

const F = f(__filename);

const guildOnly = 'This command can only be used in a guild!';

export async function techHelpClick(interaction:ButtonInteraction) {
  // log.debug(F, `Message: ${JSON.stringify(interaction, null, 2)}!`);
  if (!interaction.guild) {
    await interaction.reply({
      content: guildOnly,
      ephemeral: true,
    });
    return;
  }

  const issueType = interaction.customId.split('~')[1];

  const guildData = await db.discord_guilds.upsert({
    where: {
      id: interaction.guild?.id,
    },
    create: {
      id: interaction.guild?.id,
    },
    update: {},
  });

  if (!guildData.role_techhelp) {
    log.error(F, `- techHelpClick] techhelp role not found: ${interaction.guild.id}`);
    await interaction.reply({ content: 'The role provided could not be found!' });
    return;
  }

  const roleTechReview = await interaction.guild.roles.fetch(guildData.role_techhelp);

  if (!roleTechReview) {
    log.error(F, `- techHelpClick] roleTechReview not found: ${interaction.guild.id}`);
    await interaction.reply({ content: 'The role provided could not be found!' });
    return;
  }

  // log.debug(`[${PREFIX} - techHelpClick] issueType: ${issueType}`);
  // log.debug(`[${PREFIX} - techHelpClick] role: ${role.id}`);

  let placeholder = '';
  if (issueType === 'discord') {
    placeholder = `I have an issue with ${interaction.guild.name}'s discord, can you please help?`;
  } else if (issueType === 'other') {
    placeholder = `I just wanted to say that ${interaction.guild.name} is super cool and I love it!`;
  }

  await interaction.showModal(new ModalBuilder()
    .setCustomId(`techHelpSubmit~${interaction.id}`)
    .setTitle(`${interaction.guild.name} Feedback`)
    .addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder()
      .setLabel('What is your issue? Be super detailed!')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder(placeholder)
      .setCustomId(`${issueType}IssueInput`)
      .setRequired(true)
      .setMinLength(10)
      .setMaxLength(1800))));

  const filter = (i:ModalSubmitInteraction) => i.customId.includes('techHelpSubmit');
  interaction.awaitModalSubmit({ filter, time: 0 })
    .then(async i => {
      if (i.customId.split('~')[1] !== interaction.id) return;
      await i.deferReply({ ephemeral: true });

      if (!i.guild) {
        await interaction.editReply({ content: guildOnly });
        return;
      }

      // Get whatever they sent in the modal
      const modalInput = i.fields.getTextInputValue(`${issueType}IssueInput`);
      // log.debug(F, `modalInput: ${modalInput}!`);

      // Get the actor
      const actor = (i.member ?? i.user) as GuildMember | User;

      // Get the actors name.
      const targetName = (actor as GuildMember | null)?.displayName
        ?? (actor as User | null)?.username
        ?? '[Deleted Discord Account]';

      // Create a new thread in channel
      const ticketThread = await (i.channel as TextChannel).threads.create({
        name: `🧡│${targetName}'s ${issueType} issue!`,
        autoArchiveDuration: 1440,
        type: ChannelType.PrivateThread as AllowedThreadTypeForTextChannel,
        reason: `${targetName} submitted a(n) ${issueType} issue`,
        invitable: false,
      });
      // log.debug(F, `Created meta-thread ${ticketThread.id}`);

      const message = stripIndents`
        Hey ${roleTechReview}! ${actor} has submitted a new issue:
    
        > ${modalInput}
    
        Please look into it and respond to them in this thread!`;

      const techHelpButtons = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId(`techHelpOwn~${issueType}~${actor?.id}`)
            .setLabel('Own this issue!')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId(`techHelpClose~${issueType}~${actor?.id}`)
            .setLabel('Close this issue!')
            .setStyle(ButtonStyle.Success),
        );

      await ticketThread.send({ content: message, components: [techHelpButtons] });

      const embed = new EmbedBuilder();
      embed.setDescription(
        stripIndents`Thank you, check out ${ticketThread} to talk with a team member about your issue!`,
      );
      await i.editReply({ embeds: [embed] });

    // log.debug(F, `Sent intro message to meta-thread ${ticketThread.id}`);
    });
}

/**
 *
 * @param {ButtonInteraction} interaction The button that submitted this
 */
export async function techHelpOwn(interaction:ButtonInteraction) {
  if (!interaction.guild) return;
  const issueType = interaction.customId.split('~')[1];
  const targetId = interaction.customId.split('~')[2];
  const target = await interaction.guild.members.fetch(targetId);

  if (interaction.member === target) {
    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setDescription('You can\'t claim your own issue!')
          .setColor(Colors.Yellow),
      ],
      ephemeral: true,
    });
    return;
  }

  (interaction.channel as ThreadChannel).setName(`💛│${target.displayName}'s ${issueType} issue!`);

  await interaction.reply({
    embeds: [
      new EmbedBuilder()
        .setDescription(stripIndents`${(interaction.member as GuildMember).displayName} has claimed this \
        issue and will either help you or figure out how to get you help!`)
        .setColor(Colors.Green),
    ],
  });
}

/**
 *
 * @param {ButtonInteraction} interaction The button that submitted this
 */
export async function techHelpClose(interaction:ButtonInteraction) {
  if (!interaction.guild) return;
  if (!interaction.member) return;

  const targetId = interaction.customId.split('~')[2];

  let target = {} as GuildMember;
  try {
    target = await interaction.guild.members.fetch(targetId);
  } catch (e) {
    log.debug(F, `Failed to fetch member ${targetId}! They probably left the guild.`);
  }

  const message = interaction.member === target
    ? stripIndents`${interaction.member.displayName} has indicated that they no longer need help!`
    : stripIndents`${(interaction.member as GuildMember).displayName} has indicated that this issue has been resolved!`;

  if (interaction.member === target) {
    // Replace the first character of the channel name with a green heart
    (interaction.channel as ThreadChannel).setName(`💚|${(interaction.channel as ThreadChannel).name.slice(1)}`);
  } else {
    (interaction.channel as ThreadChannel).setName(`💙|${(interaction.channel as ThreadChannel).name.slice(1)}`);
  }

  await interaction.reply({
    embeds: [
      new EmbedBuilder()
        .setDescription(message)
        .setColor(Colors.Green),
    ],
  });
}
