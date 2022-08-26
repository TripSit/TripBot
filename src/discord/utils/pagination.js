'use strict';

const {
  ActionRowBuilder,
  // Interaction,
  // EmbedBuilder,
  // ButtonBuilder,
} = require('discord.js');

/**
 * Creates a pagination embed
 * @param {Interaction} interaction
 * @param {EmbedBuilder[]} pages
 * @param {ButtonBuilder[]} buttonList
 * @param {number} timeout
 * @returns
 */
const paginationEmbed = async (
    interaction,
    pages,
    buttonList,
    timeout = 120000,
) => {
  if (!pages) throw new Error('Pages are not given.');
  if (!buttonList) throw new Error('Buttons are not given.');
  if (
    buttonList[0].style === 'LINK' ||
    buttonList[1].style === 'LINK'
  ) {
    throw new Error(
        'Link buttons are not supported with discordjs-button-pagination',
    );
  }
  if (buttonList.length !== 2) throw new Error('Need two buttons.');

  let page = 0;

  const row = new ActionRowBuilder().addComponents(buttonList);

  if (interaction.deferred === false) {
    await interaction.deferReply();
  }

  const curPage = await interaction.editReply({
    embeds: [
      pages[page].setFooter({text: `Page ${page + 1} / ${pages.length}`}),
    ],
    components: [row],
    fetchReply: true,
  });

  const filter = (i) => i.custom_id === buttonList[1].custom_id ||
    i.custom_id === buttonList[0].custom_id;

  const collector = await curPage.createMessageComponentCollector({
    filter,
    time: timeout,
  });

  collector.on('collect', async (i) => {
    switch (i.customId) {
      case buttonList[0].data.custom_id:
        page = page > 0 ? page -= 1 : pages.length - 1;
        break;
      case buttonList[1].data.custom_id:
        page = page + 1 < pages.length ? page += 1 : 0;
        break;
      default:
        break;
    }
    await i.deferUpdate();
    await i.editReply({
      embeds: [
        pages[page].setFooter({text: `Page ${page + 1} / ${pages.length}`}),
      ],
      components: [row],
    });
    collector.resetTimer();
  });

  collector.on('end', (_, reason) => {
    if (reason !== 'messageDelete') {
      const disabledRow = new ActionRowBuilder().addComponents(
          buttonList[0].setDisabled(true),
          buttonList[1].setDisabled(true),
      );
      curPage.edit({
        embeds: [
          pages[page].setFooter({text: `Page ${page + 1} / ${pages.length}`}),
        ],
        components: [disabledRow],
      });
    }
  });

  return curPage;
};
module.exports = paginationEmbed;

/*
MIT License

Copyright (c) 2021-2022 Ryzyx - LunaUrsa

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

*/
