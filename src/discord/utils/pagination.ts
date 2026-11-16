import {
  CommandInteraction,
  EmbedBuilder,
  ButtonBuilder,
  ActionRowBuilder,
  Message,
  ButtonInteraction,
} from 'discord.js';
import {
  ButtonStyle,
  MessageFlags,
} from 'discord-api-types/v10';

export default paginationEmbed;

const PREVIOUS_ID = 'previousButton';
const NEXT_ID = 'nextButton';

/** Builds a fresh pair of buttons for one pagination session, so ending one session cannot disable another's. */
function buildButtons(disabled = false): ButtonBuilder[] {
  return [
    new ButtonBuilder()
      .setCustomId(PREVIOUS_ID)
      .setLabel('Previous')
      .setStyle(ButtonStyle.Danger)
      .setDisabled(disabled),
    new ButtonBuilder()
      .setCustomId(NEXT_ID)
      .setLabel('Next')
      .setStyle(ButtonStyle.Success)
      .setDisabled(disabled),
  ];
}

/**
 * Creates a pagination embed
 * @param {BaseCommandInteraction} interaction The interaction to paginate
 * @param {EmbedBuilder[]} pages The pages to paginate
 * @param {number} timeout The timeout in milliseconds to wait for reactions
 * @return {Promise<void>}
 */
export async function paginationEmbed(
  interaction:CommandInteraction,
  pages:EmbedBuilder[],
  timeout = 120000,
  ephemeral:boolean = false,
): Promise<Message> {
  if (interaction.deferred === false) {
    await interaction.deferReply({ flags: ephemeral ? MessageFlags.Ephemeral : undefined });
  }

  let page = 0;

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(buildButtons());

  const curPage = await interaction.editReply({
    embeds: [
      pages[page].setFooter({ text: `Page ${page + 1} / ${pages.length}` }),
    ],
    components: [row],
  });

  const filter = (i:{ customId: string }) => i.customId === PREVIOUS_ID || i.customId === NEXT_ID;

  const collector = curPage.createMessageComponentCollector({
    filter,
    time: timeout,
  });

  collector.on('collect', async (i:ButtonInteraction) => {
    switch (i.customId) {
      case PREVIOUS_ID:
        page = page > 0 ? page - 1 : pages.length - 1;
        break;
      case NEXT_ID:
        page = page + 1 < pages.length ? page + 1 : 0;
        break;
      default:
        break;
    }
    await i.deferUpdate();
    await i.editReply({
      embeds: [
        pages[page].setFooter({ text: `Page ${page + 1} / ${pages.length}` }),
      ],
      components: [row],
    });
    collector.resetTimer();
  });

  collector.on('end', (_, reason) => {
    if (reason !== 'messageDelete') {
      const disabledRow = new ActionRowBuilder<ButtonBuilder>().addComponents(buildButtons(true));
      curPage.edit({
        embeds: [
          pages[page].setFooter({ text: `Page ${page + 1} / ${pages.length}` }),
        ],
        components: [disabledRow],
      }).catch(() => {
        // Message was deleted before the collector timed out — nothing to disable.
      });
    }
  });

  return curPage;
}
