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
import { mergePr, postPrRejectionComment } from '../../../global/commands/g.prReview';
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
  checksPassed: boolean,
  checksSummary: string,
};

function prButtonId(action: 'ACCEPT' | 'REJECT', prNumber: number, checksPassed: boolean): string {
  return `"ID":"PR","T":"${action}","N":"${prNumber}","CP":"${checksPassed}"`;
}

/**
 * Sends a message to the TripBot dev channel announcing a newly opened PR,
 * pinging the TripBot dev role, with Accept/Reject buttons. Only called once
 * all CI checks have finished, so the message reflects their final result.
 * @param {PrNotification} pr
 */
export async function notifyPrOpened(pr: PrNotification): Promise<void> {
  const guild = await discordClient.guilds.fetch(env.DISCORD_GUILD_ID);
  const channel = await guild.channels.fetch(env.CHANNEL_TRIPBOT) as TextChannel;
  const role = await guild.roles.fetch(env.ROLE_TRIPBOTDEV);

  const embed = embedTemplate()
    .setColor(pr.checksPassed ? Colors.Blue : Colors.Yellow)
    .setTitle(pr.title)
    .setURL(pr.url)
    .setDescription(pr.body.slice(0, 4000) || '*No description provided.*')
    .addFields(
      { name: 'Author', value: pr.author, inline: true },
      { name: 'Tests', value: `${pr.testsPassed}/${pr.testsTotal} passed`, inline: true },
      {
        name: 'Checks',
        value: pr.checksPassed ? '✅ All checks passed' : `⚠️ Some checks failed\n${pr.checksSummary}`,
      },
    );

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(prButtonId('ACCEPT', pr.number, pr.checksPassed))
      .setLabel('Accept')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(prButtonId('REJECT', pr.number, pr.checksPassed))
      .setLabel('Reject')
      .setStyle(ButtonStyle.Danger),
  );

  const warning = pr.checksPassed ? '' : '\n\n⚠️ **Some CI checks failed.** Accepting will require a written justification.'; // eslint-disable-line max-len

  await channel.send({
    content: `Hey ${role} (tripbot devs), there's a new PR on GitHub: ${pr.url}${warning}`,
    embeds: [embed],
    components: [row],
  });

  log.info(F, `Posted PR notification for #${pr.number} to ${channel.name}`);
}

/**
 * Attempts to squash-merge the PR, returning an error message on failure
 * instead of throwing, so callers can report it without a try/catch.
 * @param {number} prNumber
 */
async function attemptMerge(prNumber: number): Promise<string | null> {
  try {
    await mergePr(prNumber);
    return null;
  } catch (error) {
    log.error(F, `Failed to merge PR #${prNumber}: ${error}`);
    return error instanceof Error ? error.message : 'Unknown error';
  }
}

/**
 * Handles clicks on the Accept/Reject buttons posted with a PR notification.
 * Restricted to members with the TripBot dev role.
 *
 * Accept squash-merges the PR into its base branch. If checks were failing
 * when the notification was posted, accepting instead opens a modal
 * requiring a written justification, which is merged in along with the PR
 * and recorded on the Discord message for visibility after the merge.
 * @param {ButtonInteraction} interaction
 */
export async function prReviewButton(interaction: ButtonInteraction): Promise<void> {
  const {
    T: action,
    N: prNumberString,
    CP: checksPassedString,
  } = JSON.parse(`{${interaction.customId}}`) as {
    T: 'ACCEPT' | 'REJECT',
    N: string,
    CP: string,
  };
  const prNumber = Number(prNumberString);
  const checksPassed = checksPassedString === 'true';

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
    if (checksPassed) {
      await interaction.deferUpdate();
      const mergeError = await attemptMerge(prNumber);
      if (mergeError) {
        await interaction.followUp({
          content: `Failed to merge PR #${prNumber}: ${mergeError}. You may need to merge it manually on GitHub.`,
          flags: MessageFlags.Ephemeral,
        });
        return;
      }
      const [embed] = interaction.message.embeds;
      await interaction.editReply({
        embeds: embed ? [{ ...embed.data, color: Colors.Green }] : [],
        content: `${interaction.message.content}\n\n✅ Accepted and merged by ${member.displayName}`,
        components: [],
      });
      return;
    }

    // Checks were failing: require a written justification before merging
    await interaction.showModal(new ModalBuilder()
      .setCustomId(`"ID":"PR","T":"ACCEPTOVERRIDE","N":"${prNumber}","II":"${interaction.id}"`)
      .setTitle(`Override failing checks on PR #${prNumber}`)
      .addComponents(new ActionRowBuilder<TextInputBuilder>()
        .addComponents(new TextInputBuilder()
          .setCustomId('reason')
          .setLabel('Are you sure? Why is this okay to merge?')
          .setRequired(true)
          .setMaxLength(1900)
          .setStyle(TextInputStyle.Paragraph))));

    const overrideFilter = (i: ModalSubmitInteraction) => i.customId.startsWith('"ID":"PR","T":"ACCEPTOVERRIDE"');
    interaction.awaitModalSubmit({ filter: overrideFilter, time: 0 })
      .then(async i => {
        const { II } = JSON.parse(`{${i.customId}}`) as { II: string };
        if (II !== interaction.id) return;

        await i.deferReply({ flags: MessageFlags.Ephemeral });

        const reason = i.fields.getTextInputValue('reason');
        const modalMember = i.member as GuildMember;

        const mergeError = await attemptMerge(prNumber);
        if (mergeError) {
          // eslint-disable-next-line max-len
          await i.editReply({ content: `Failed to merge PR #${prNumber}: ${mergeError}. You may need to merge it manually on GitHub.` });
          return;
        }

        const [embed] = interaction.message.embeds;
        // eslint-disable-next-line max-len
        const overrideNote = `\n\n⚠️ **Merged despite failing checks**, accepted by ${modalMember.displayName}:\n> ${reason}`;
        await interaction.message.edit({
          embeds: embed ? [{ ...embed.data, color: Colors.Green }] : [],
          content: `${interaction.message.content}${overrideNote}`,
          components: [],
        });

        await i.editReply({ content: 'Merged the PR and recorded your reasoning in Discord.' });
      })
      .catch(() => {
        log.debug(F, `No accept-override modal submission received for PR #${prNumber}`);
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
