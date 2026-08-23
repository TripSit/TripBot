import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  Colors,
  GuildMember,
  MessageFlags,
  ModalBuilder,
  ModalSubmitInteraction,
  TextChannel,
  TextInputBuilder,
  TextInputStyle,
} from 'discord.js';
import { postPrRejectionComment } from '../../../global/commands/g.prReview';
import { embedTemplate } from '../../utils/embedTemplate';

const F = f(__filename);

export default prReviewButton;

export type PrNotification = {
  number: number,
  title: string,
  body: string,
  url: string,
  author: string,
  testsPassed: number,
  testsTotal: number,
};

function prButtonId(action: 'ACCEPT' | 'REJECT', prNumber: number): string {
  return `"ID":"PR","T":"${action}","N":"${prNumber}"`;
}

/**
 * Sends a message to the TripBot dev channel announcing a newly opened PR,
 * pinging the TripBot dev role, with Accept/Reject buttons.
 * @param {PrNotification} pr
 */
export async function notifyPrOpened(pr: PrNotification): Promise<void> {
  const guild = await discordClient.guilds.fetch(env.DISCORD_GUILD_ID);
  const channel = await guild.channels.fetch(env.CHANNEL_TRIPBOT) as TextChannel;
  const role = await guild.roles.fetch(env.ROLE_TRIPBOTDEV);

  const embed = embedTemplate()
    .setTitle(pr.title)
    .setURL(pr.url)
    .setDescription(pr.body.slice(0, 4000) || '*No description provided.*')
    .addFields(
      { name: 'Author', value: pr.author, inline: true },
      { name: 'Tests', value: `${pr.testsPassed}/${pr.testsTotal} passed`, inline: true },
    );

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(prButtonId('ACCEPT', pr.number))
      .setLabel('Accept')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(prButtonId('REJECT', pr.number))
      .setLabel('Reject')
      .setStyle(ButtonStyle.Danger),
  );

  await channel.send({
    content: `Hey ${role} (tripbot devs), there's a new PR on GitHub: ${pr.url}`,
    embeds: [embed],
    components: [row],
  });

  log.info(F, `Posted PR notification for #${pr.number} to ${channel.name}`);
}

/**
 * Handles clicks on the Accept/Reject buttons posted with a PR notification.
 * Restricted to members with the TripBot dev role.
 * @param {ButtonInteraction} interaction
 */
export async function prReviewButton(interaction: ButtonInteraction): Promise<void> {
  const { T: action, N: prNumberString } = JSON.parse(`{${interaction.customId}}`) as {
    T: 'ACCEPT' | 'REJECT',
    N: string,
  };
  const prNumber = Number(prNumberString);

  if (!interaction.guild || !interaction.member) return;

  const member = interaction.member as GuildMember;
  if (!member.roles.cache.has(env.ROLE_TRIPBOTDEV)) {
    await interaction.reply({
      content: 'You do not have permission to review PRs.',
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  if (action === 'ACCEPT') {
    const [embed] = interaction.message.embeds;
    await interaction.update({
      embeds: embed ? [
        { ...embed.data, color: Colors.Green },
      ] : [],
      content: `${interaction.message.content}\n\n✅ Accepted by ${member.displayName}`,
      components: [],
    });
    return;
  }

  // REJECT: collect a comment via modal, then post it to the GitHub PR
  await interaction.showModal(new ModalBuilder()
    .setCustomId(`"ID":"PR","T":"REJECTMODAL","N":"${prNumber}","II":"${interaction.id}"`)
    .setTitle(`Reject PR #${prNumber}`)
    .addComponents(new ActionRowBuilder<TextInputBuilder>()
      .addComponents(new TextInputBuilder()
        .setCustomId('comment')
        .setLabel('Why are you rejecting this PR?')
        .setRequired(true)
        .setMaxLength(1900)
        .setStyle(TextInputStyle.Paragraph))));

  const filter = (i: ModalSubmitInteraction) => i.customId.startsWith('"ID":"PR","T":"REJECTMODAL"');
  interaction.awaitModalSubmit({ filter, time: 0 })
    .then(async i => {
      const { II, N: modalPrNumberString } = JSON.parse(`{${i.customId}}`) as { II: string, N: string };
      if (II !== interaction.id) return;

      await i.deferReply({ flags: MessageFlags.Ephemeral });

      const comment = i.fields.getTextInputValue('comment');
      const modalMember = i.member as GuildMember;

      try {
        await postPrRejectionComment(Number(modalPrNumberString), modalMember.displayName, comment);
      } catch (error) {
        log.error(F, `Failed to post rejection comment on PR #${modalPrNumberString}: ${error}`);
        await i.editReply({ content: 'Failed to post your comment to GitHub. Please try again or comment manually.' });
        return;
      }

      const [embed] = interaction.message.embeds;
      await interaction.message.edit({
        embeds: embed ? [
          { ...embed.data, color: Colors.Red },
        ] : [],
        content: `${interaction.message.content}\n\n❌ Rejected by ${modalMember.displayName}`,
        components: [],
      });

      await i.editReply({ content: 'Posted your feedback to the PR on GitHub.' });
    })
    .catch(() => {
      log.debug(F, `No reject modal submission received for PR #${prNumber}`);
    });
}
