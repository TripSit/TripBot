import {
  ActionRowBuilder,
  AttachmentBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  ChatInputCommandInteraction,
  ComponentType,
  EmbedBuilder,
} from 'discord.js';

export type PagerPayload = {
  embeds?: EmbedBuilder[];
  files?: AttachmentBuilder[];
};

export type PagerOptions = {
  pageCount: number;
  renderPage: (index: number) => Promise<PagerPayload>;
  idPrefix: string;
  timeoutMs?: number;
  startIndex?: number;
  // Set false when a single page shouldn't get Back/Next buttons at all (e.g. d.leaderboard.ts).
  showControls?: boolean;
};

/**
 * Runs a user-filtered Back/Next collector against an already-deferred interaction, re-rendering
 * the page on each click and disabling the buttons when the collector ends.
 * @param {ChatInputCommandInteraction} interaction The deferred interaction to edit
 * @param {PagerOptions} options Pager configuration
 * @return {Promise<void>}
 */
export async function runPager(
  interaction: ChatInputCommandInteraction,
  options: PagerOptions,
): Promise<void> {
  const {
    pageCount, renderPage, idPrefix, timeoutMs = 120000, startIndex = 0, showControls = true,
  } = options;

  let page = startIndex;
  const backId = `${idPrefix}Back`;
  const nextId = `${idPrefix}Next`;

  const buildRow = (current: number) => new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(backId)
      .setLabel('Back')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(current === 0),
    new ButtonBuilder()
      .setCustomId(nextId)
      .setLabel('Next')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(current === pageCount - 1),
  );

  const firstPayload = await renderPage(page);
  const message = await interaction.editReply({
    ...firstPayload,
    components: showControls ? [buildRow(page)] : [],
  });

  if (!showControls) return;

  const collector = message.createMessageComponentCollector({
    filter: i => i.user.id === interaction.user.id && (i.customId === backId || i.customId === nextId),
    componentType: ComponentType.Button,
    time: timeoutMs,
  });

  collector.on('collect', async (i: ButtonInteraction) => {
    await i.deferUpdate();
    page = i.customId === nextId ? Math.min(page + 1, pageCount - 1) : Math.max(page - 1, 0);
    const payload = await renderPage(page);
    await interaction.editReply({ ...payload, components: [buildRow(page)] });
  });

  collector.on('end', async () => {
    const disabledRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      ...buildRow(page).components.map(button => button.setDisabled(true)),
    );
    await interaction.editReply({ components: [disabledRow] }).catch(() => {
      // Message was deleted before the collector ended — nothing to disable.
    });
  });
}

export default runPager;
