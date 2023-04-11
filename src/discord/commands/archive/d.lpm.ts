import {
  Colors,
  SlashCommandBuilder,
  time,
  EmbedBuilder,
} from 'discord.js';

import { SlashCommand } from '../../@types/commandDef';
import { embedTemplate } from '../../utils/embedTemplate';
import commandContext from '../../utils/context';

export default dLpm;

const F = f(__filename);

const interval = env.NODE_ENV === 'production' ? 1000 * 5 : 1000 * 3;

const embedTitle = 'Shows the number of lines sent in the last X minutes / max ever recorded';
const header = '```Channel    5min    10min   30min   60min```';

export const dLpm: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('lpm')
    .setDescription('Shows the lines per minute of the guild!')
    .addBooleanOption(option => option.setName('ephemeral')
      .setDescription('Set to "True" to show the response only to you')),
  async execute(interaction) {
    log.info(F, await commandContext(interaction));
    await interaction.deferReply({ ephemeral: (interaction.options.getBoolean('ephemeral') === true) });

    const ephemeral = (interaction.options.getBoolean('ephemeral') === true);

    const msg = await interaction.editReply({
      embeds: [embedTemplate()
        .setTitle(embedTitle)
        .setDescription(header)
        .setColor(Colors.Blurple)
        .setFooter(null)],
      ephemeral,
      fetchReply: true,
    });

    msg.edit({ embeds: [await constructEmbed()] });

    function checkTimers() {
      setTimeout(
        async () => {
          try {
            // log.debug(F, 'Updating LPM message...');
            await msg.fetch();
            msg.edit({ embeds: [await constructEmbed()] });
            checkTimers();
          } catch (error) {
            // log.debug(F, 'LPM message was deleted, stopping timer.');
            // The message was deleted, stop the timer
          }
        },
        interval,
      );
    }
    checkTimers();

    return true;
  },
};


export type LpmDict = {
  [key: string]: {
    position: number;
    name: string;
    alert: number;
    lp1: number;
    lp1Max: number;
    lp5: number;
    lp5Max: number;
    lp10: number;
    lp10Max: number;
    lp30: number;
    lp30Max: number;
    lp60: number;
    lp60Max: number;
  }
};


async function constructEmbed():Promise<EmbedBuilder> {
  const embed = embedTemplate()
    .setTitle(embedTitle)
    .setDescription(header)
    .setColor(Colors.Blurple);

  if (global.lpmDict === undefined) {
    // This should only happen if someone tries to run the command while the bot is booting
    return embed;
  }

  // Get the LPM dict of all current LPMs, and reclassify two columns as potential strings
  const outputDict = lpmDict as {
    [key: string]: {
      position: number;
      name: string;
      alert: number;
      lp1: number | string;
      lp1Max: number | string;
      lp5: number | string;
      lp5Max: number | string;
      lp10: number | string;
      lp10Max: number | string;
      lp30: number | string;
      lp30Max: number | string;
      lp60: number | string;
      lp60Max: number | string;
    }
  };

  // Add the header, now that we can put strings in the LPM values
  outputDict.header = {
    position: 0,
    name: '│Channel',
    alert: 0,
    lp1: 0,
    lp1Max: 0,
    lp5: 0,
    lp5Max: 0,
    lp10: 0,
    lp10Max: 0,
    lp30: 0,
    lp30Max: 0,
    lp60: 0,
    lp60Max: 0,
  };

  // Find the length of the largest channel name
  const channelColLength = Object.entries(outputDict).reduce((acc, cur) => {
    if (cur[1].name.length > acc) return cur[1].name.length;
    return acc;
  }, 0);

  const lp1ColLength = Object.entries(outputDict).reduce((acc, cur) => {
    if (cur[1].lp1.toString().length > acc) return cur[1].lp1.toString().length;
    return acc;
  }, 0);

  const lp1MaxColLength = Object.entries(outputDict).reduce((acc, cur) => {
    if (cur[1].lp1Max.toString().length > acc) return cur[1].lp1Max.toString().length;
    return acc;
  }, 0);

  const lp5ColLength = Object.entries(outputDict).reduce((acc, cur) => {
    if (cur[1].lp5.toString().length > acc) return cur[1].lp5.toString().length;
    return acc;
  }, 0);

  const lp5MaxColLength = Object.entries(outputDict).reduce((acc, cur) => {
    if (cur[1].lp5Max.toString().length > acc) return cur[1].lp5Max.toString().length;
    return acc;
  }, 0);

  const lp10ColLength = Object.entries(outputDict).reduce((acc, cur) => {
    if (cur[1].lp10.toString().length > acc) return cur[1].lp10.toString().length;
    return acc;
  }, 0);

  const lp10MaxColLength = Object.entries(outputDict).reduce((acc, cur) => {
    if (cur[1].lp10Max.toString().length > acc) return cur[1].lp10Max.toString().length;
    return acc;
  }, 0);

  const lp30ColLength = Object.entries(outputDict).reduce((acc, cur) => {
    if (cur[1].lp30.toString().length > acc) return cur[1].lp30.toString().length;
    return acc;
  }, 0);

  const lp30MaxColLength = Object.entries(outputDict).reduce((acc, cur) => {
    if (cur[1].lp30Max.toString().length > acc) return cur[1].lp30Max.toString().length;
    return acc;
  }, 0);

  const lp60ColLength = Object.entries(outputDict).reduce((acc, cur) => {
    if (cur[1].lp60.toString().length > acc) return cur[1].lp60.toString().length;
    return acc;
  }, 0);

  const lp60MaxColLength = Object.entries(outputDict).reduce((acc, cur) => {
    if (cur[1].lp60Max.toString().length > acc) return cur[1].lp60Max.toString().length;
    return acc;
  }, 0);

  // Sort lpmDict by the position
  const descriptions = Object.entries(outputDict).sort((a, b) => {
    if (a[1].position < b[1].position) return -1;
    if (a[1].position > b[1].position) return 1;
    return 0;
  }).map(d => d[1]);

  // const numberColumnLength = 4;

  // log.debug(F, `description: ${JSON.stringify(descriptions, null, 2)}`);

  // For each channel name, add spaces to the end to make them all the same length
  const description = descriptions
    .map(d => {
      const channelColText = d.name.slice(d.name.indexOf('│') + 1);
      const channelColSpaceString = ' '.repeat(channelColLength - channelColText.length);
      const channelCol = `${channelColText}${channelColSpaceString}`;

      const lp1ColText = `${d.lp1.toString()}`;
      const lp1ColSpaceString = ' '.repeat(lp1ColLength - lp1ColText.length);
      const lp1Col = `${lp1ColText}${lp1ColSpaceString}`;

      const lp1MaxColText = `${d.lp1Max.toString()}`;
      const lp1MaxColSpaceString = ' '.repeat(lp1MaxColLength - lp1MaxColText.length);
      const lp1MaxCol = `${lp1MaxColText}${lp1MaxColSpaceString}`;

      const lp5ColText = `${d.lp5.toString()}`;
      const lp5ColSpaceString = ' '.repeat(lp5ColLength - lp5ColText.length);
      const lp5Col = `${lp5ColText}${lp5ColSpaceString}`;

      const lp5MaxColText = `${d.lp5Max.toString()}`;
      const lp5MaxColSpaceString = ' '.repeat(lp5MaxColLength - lp5MaxColText.length);
      const lp5MaxCol = `${lp5MaxColText}${lp5MaxColSpaceString}`;

      const lp10ColText = `${d.lp10.toString()}`;
      const lp10ColSpaceString = ' '.repeat(lp10ColLength - lp10ColText.length);
      const lp10Col = `${lp10ColText}${lp10ColSpaceString}`;

      const lp10MaxColText = `${d.lp10Max.toString()}`;
      const lp10MaxColSpaceString = ' '.repeat(lp10MaxColLength - lp10MaxColText.length);
      const lp10MaxCol = `${lp10MaxColText}${lp10MaxColSpaceString}`;

      const lp30ColText = `${d.lp30.toString()}`;
      const lp30ColSpaceString = ' '.repeat(lp30ColLength - lp30ColText.length);
      const lp30Col = `${lp30ColText}${lp30ColSpaceString}`;

      const lp30MaxColText = `${d.lp30Max.toString()}`;
      const lp30MaxColSpaceString = ' '.repeat(lp30MaxColLength - lp30MaxColText.length);
      const lp30MaxCol = `${lp30MaxColText}${lp30MaxColSpaceString}`;

      const lp60ColText = `${d.lp60.toString()}`;
      const lp60ColSpaceString = ' '.repeat(lp60ColLength - lp60ColText.length);
      const lp60Col = `${lp60ColText}${lp60ColSpaceString}`;

      const lp60MaxColText = `${d.lp60Max.toString()}`;
      const lp60MaxColSpaceString = ' '.repeat(lp60MaxColLength - lp60MaxColText.length);
      const lp60MaxCol = `${lp60MaxColText}${lp60MaxColSpaceString}`;

      if (channelColText.includes('Channel')) {
        const headerColText = d.name.slice(d.name.indexOf('│') + 1);
        const headerColumnLength = channelColLength + 2;
        const headerColSpaceString = ' '.repeat(headerColumnLength - headerColText.length);
        const headerCol = `${headerColText}${headerColSpaceString}`;
        // log.debug(F, `hCol: '${headerCol} | ${headerColumnLength}'`);

        const zeroColumnText = '1mins';
        const zeroColumnLength = lp1ColLength + lp1MaxColLength + 6;
        const zeroColumnSpaceString = ' '.repeat(zeroColumnLength - zeroColumnText.length);
        const zeroColumn = `${zeroColumnText}${zeroColumnSpaceString}`;
        // log.debug(F, `0col: '${zeroColumn} | ${zeroColumnLength}'`);

        const firstColumnText = '5mins';
        const firstColumnLength = lp5ColLength + lp5MaxColLength + 6;
        const firstColumnSpaceString = ' '.repeat(firstColumnLength - firstColumnText.length);
        const firstColumn = `${firstColumnText}${firstColumnSpaceString}`;
        // log.debug(F, `1col: '${firstColumn} | ${firstColumnLength}'`);

        const secondColumnText = '10min';
        const secondColumnLength = lp10ColLength + lp10MaxColLength + 6;
        const secondColumnSpaceString = ' '.repeat(secondColumnLength - secondColumnText.length);
        const secondColumn = `${secondColumnText}${secondColumnSpaceString}`;
        // log.debug(F, `2col: '${secondColumn} | ${secondColumnLength}'`);

        const thirdColumnText = '30min';
        const thirdColumnLength = lp30ColLength + lp30MaxColLength + 6;
        const thirdColumnSpaceString = ' '.repeat(thirdColumnLength - thirdColumnText.length);
        const thirdColumn = `${thirdColumnText}${thirdColumnSpaceString}`;
        // log.debug(F, `3col: '${thirdColumn} | ${thirdColumnLength}'`);

        const fourthColumnText = '60min';
        const fourthColumnLength = lp60ColLength + lp60MaxColLength + 5;
        const fourthColumnSpaceString = ' '.repeat(fourthColumnLength - fourthColumnText.length);
        const fourthColumn = `${fourthColumnText}${fourthColumnSpaceString}`;
        // log.debug(F, `4col: '${fourthColumn} | ${fourthColumnLength}'`);

        return `${headerCol}${zeroColumn}${firstColumn}${secondColumn}${thirdColumn}${fourthColumn}`;
      }
      return `${channelCol}| ${lp1Col} / ${lp1MaxCol} | ${lp5Col} / ${lp5MaxCol} | ${lp10Col} / ${lp10MaxCol} | ${lp30Col} / ${lp30MaxCol} | ${lp60Col} / ${lp60MaxCol} |`;
    })
    .join('\n');

  // Get the average of all global.lpmTime
  const average = global.lpmTime ? global.lpmTime.reduce((acc, cur) => acc + cur, 0) / global.lpmTime.length : 0;

  embed.setDescription(`\`\`\`${description}\`\`\`
      ${Math.round(average)}ms - ${time(new Date(), 'R')} `);
  embed.setFooter(null);
  return embed;
}
