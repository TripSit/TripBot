import type {
  ButtonInteraction,
  CommandInteraction,
  EmbedBuilder,
  Interaction,
  Message,
} from 'discord.js';

import { ButtonStyle, MessageFlags } from 'discord-api-types/v10';
import { ActionRowBuilder, ButtonBuilder } from 'discord.js';
// import log from '../../global/utils/log';
// import {parse} from 'path';
// const F = f(__filename);

export default paginationEmbed;

const previousButton = new ButtonBuilder()
  .setCustomId('previousButton')
  .setLabel('Previous')
  .setStyle(ButtonStyle.Danger);

const nextButton = new ButtonBuilder()
  .setCustomId('nextButton')
  .setLabel('Next')
  .setStyle(ButtonStyle.Success);

const buttonList = [previousButton, nextButton];

/**
 * Creates a pagination embed
 * @param {BaseCommandInteraction} interaction The interaction to paginate
 * @param {EmbedBuilder[]} pages The pages to paginate
 * @param {number} timeout The timeout in milliseconds to wait for reactions
 * @return {Promise<void>}
 */
export async function paginationEmbed(
  interaction: CommandInteraction,
  pages: EmbedBuilder[],
  timeout = 120_000,
  ephemeral = false,
): Promise<Message> {
  if (!interaction.deferred) {
    await interaction.deferReply({ flags: ephemeral ? MessageFlags.Ephemeral : undefined });
  }
  // log.debug(`${PREFIX} - Paginating ${pages.length} pages.`);

  let page = 0;

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(buttonList);

  const currentPage = await interaction.editReply({
    components: [row],
    embeds: [pages[page].setFooter({ text: `Page ${page + 1} / ${pages.length}` })],
  });

  // There is a bug in the typescript definition of the buttonList[x].data.customId
  const filter = (index: Interaction): boolean => {
    return (
      // @ts-expect-error Actually works
      index.customId === buttonList[1].data.custom_id ||
      // @ts-expect-error Actually works
      index.customId === buttonList[0].data.custom_id
    );
  };

  const collector = currentPage.createMessageComponentCollector({
    filter,
    time: timeout,
  });

  collector.on('collect', async (index: ButtonInteraction) => {
    switch (index.customId) {
      // @ts-ignore
      case buttonList[0].data.custom_id: {
        page = page > 0 ? page - 1 : pages.length - 1;
        break;
      }
      // @ts-ignore
      case buttonList[1].data.custom_id: {
        page = page + 1 < pages.length ? page + 1 : 0;
        break;
      }
      default: {
        break;
      }
    }
    await index.deferUpdate();
    await index.editReply({
      components: [row],
      embeds: [pages[page].setFooter({ text: `Page ${page + 1} / ${pages.length}` })],
    });
    collector.resetTimer();
  });

  collector.on('end', (_, reason) => {
    if (reason !== 'messageDelete') {
      const disabledRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
        buttonList[0].setDisabled(true),
        buttonList[1].setDisabled(true),
      );
      currentPage.edit({
        components: [disabledRow],
        embeds: [pages[page].setFooter({ text: `Page ${page + 1} / ${pages.length}` })],
      });
    }
  });

  return currentPage;
}
