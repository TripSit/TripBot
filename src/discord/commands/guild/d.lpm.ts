import {
  Colors,
  SlashCommandBuilder,
  time,
  EmbedBuilder,
} from 'discord.js';

import { SlashCommand } from '../../@types/commandDef';
import { embedTemplate } from '../../utils/embedTemplate';
import { startLog } from '../../utils/startLog';

export default dLpm;

const F = f(__filename);

const interval = env.NODE_ENV === 'production' ? 1000 * 5 : 1000 * 3;

export const dLpm: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('lpm')
    .setDescription('Shows the lines per minute of the guild!'),
  async execute(interaction) {
    startLog(F, interaction);

    const msg = await interaction.reply({
      embeds: [embedTemplate()
        .setTitle('Lines per minute')
        .setDescription('Loading...')
        .setColor(Colors.Blurple)],
      fetchReply: true,
    });

    msg.edit({ embeds: [await constructEmbed()] });

    function checkTimers() {
      setTimeout(
        async () => {
          try {
            msg.edit({ embeds: [await constructEmbed()] });
            checkTimers();
          } catch (error) {
            //
          }
        },
        interval,
      );
    }
    checkTimers();

    return true;
  },
};

async function constructEmbed():Promise<EmbedBuilder> {
  const embed = embedTemplate()
    .setTitle('Lines per minute')
    .setDescription('Loading...')
    .setColor(Colors.Blurple);

  if (global.lpmDict === undefined) {
    // This should only happen if someone tries to run the command while the bot is booting
    return embed;
  }

  const outputDict = lpmDict as {
    [key: string]: {
      position: number;
      name: string;
      lpm: number | string;
      lph: number | string;
      maxLpm: number;
      maxLph: number;
    }
  };
  outputDict.header = {
    name: '📜|Channel',
    lpm: 'LPM',
    lph: 'LPH',
    position: 0,
    maxLpm: 0,
    maxLph: 0,
  };

  const firstColLength = Object.entries(outputDict).reduce((acc, cur) => {
    if (cur[1].name.length > acc) return cur[1].name.length;
    return acc;
  }, 0);

  // Get the largest lpm from descriptions
  const secondColLength = Object.entries(outputDict).reduce((acc, cur) => {
    if (cur[1].lpm.toString().length > acc) return cur[1].lpm.toString().length;
    return acc;
  }, 0);

  // Sort lpmDict by the position
  const descriptions = Object.entries(outputDict).sort((a, b) => {
    if (a[1].position < b[1].position) return -1;
    if (a[1].position > b[1].position) return 1;
    return 0;
  }).map(d => d[1]);

  // For each channel name, add spaces to the end to make them all the same length
  const description = descriptions.map(d => {
    const firstColSpaces = firstColLength - d.name.length;
    const firstColSpaceString = ' '.repeat(firstColSpaces);

    const secondColSpaces = secondColLength - d.lpm.toString().length;
    const secondColSpaceString = ' '.repeat(secondColSpaces);

    return `${d.name}${firstColSpaceString} | ${d.lpm}${secondColSpaceString} | ${d.lph}`;
  }).join('\n');

  embed.setDescription(`\`\`\`${description}
      \`\`\`
      Updated ${time(new Date(), 'R')}`);
  return embed;
}
