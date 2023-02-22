import {
  Colors,
  SlashCommandBuilder,
  TextChannel,
  ChatInputCommandInteraction,
  time,
} from 'discord.js';

import { SlashCommand } from '../../@types/commandDef';
import { embedTemplate } from '../../utils/embedTemplate';
import { startLog } from '../../utils/startLog';

export default dLpm;

const F = f(__filename);

const interval = env.NODE_ENV === 'production' ? 1000 * 5 : 1000 * 3;

const channels = [
  // env.CATEGORY_HARMREDUCTIONCENTRE,
  env.CHANNEL_TRIPSITMETA,
  env.CHANNEL_TRIPSIT,
  env.CHANNEL_OPENTRIPSIT1,
  env.CHANNEL_OPENTRIPSIT2,
  env.CHANNEL_WEBTRIPSIT1,
  env.CHANNEL_WEBTRIPSIT2,
  env.CHANNEL_CLOSEDTRIPSIT,
  env.CHANNEL_RTRIPSIT,
  // env.CATEGORY_BACKSTAGE,
  env.CHANNEL_PETS,
  env.CHANNEL_FOOD,
  env.CHANNEL_OCCULT,
  env.CHANNEL_MUSIC,
  env.CHANNEL_MEMES,
  env.CHANNEL_MOVIES,
  env.CHANNEL_GAMING,
  env.CHANNEL_SCIENCE,
  env.CHANNEL_CREATIVE,
  env.CHANNEL_COMPSCI,
  env.CHANNEL_REPLICATIONS,
  env.CHANNEL_PHOTOGRAPHY,
  // env.CHANNEL_RECOVERY,
  // env.CATEGORY_CAMPGROUND,
  env.CHANNEL_LOUNGE,
  env.CHANNEL_VIPLOUNGE,
  env.CHANNEL_GOLDLOUNGE,
  env.CHANNEL_SANCTUARY,
  env.CHANNEL_TREES,
  env.CHANNEL_OPIATES,
  env.CHANNEL_STIMULANTS,
  env.CHANNEL_DEPRESSANTS,
  env.CHANNEL_DISSOCIATIVES,
  env.CHANNEL_PSYCHEDELICS,
];

export const dLpm: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('lpm')
    .setDescription('Shows the lines per minute of the guild!'),
  async execute(interaction) {
    startLog(F, interaction);
    let embed = embedTemplate()
      .setTitle('Lines per minute')
      .setDescription('Loading...')
      .setColor(Colors.Blurple);

    const msg = await interaction.reply({
      embeds: [embed],
      fetchReply: true,
    });

    embed = await checkLpm(interaction);

    msg.edit({
      embeds: [embed],
    });

    function checkTimers() {
      setTimeout(
        async () => {
          embed = await checkLpm(interaction);
          try {
            msg.edit({ embeds: [embed] });
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

async function checkLpm(interaction:ChatInputCommandInteraction) {
  // log.debug(F, 'Checking LPM...');
  const startTime = Date.now();
  const embed = embedTemplate()
    .setTitle('Lines per minute in top channels')
    .setColor(Colors.Blurple);

  const descriptions = [
    {
      position: 0,
      name: '📜│Channel',
      lpm: 'LPM',
    }] as {
    position: number;
    name: string;
    lpm: string;
  }[];

  async function getLpm(channelId:string, index:number) {
    const channel = await interaction.guild?.channels.fetch(channelId) as TextChannel; // eslint-disable-line no-await-in-loop, max-len
    try {
      await channel.messages.fetch(); // eslint-disable-line no-await-in-loop
    } catch (error) {
      const channelBotlog = await interaction.guild?.channels.fetch(env.CHANNEL_BOTLOG) as TextChannel; // eslint-disable-line no-await-in-loop, max-len
      channelBotlog.send(`Error fetching messages in ${channel.name} (${channel.id}) (${channelId}) (${index}))`);
      return;
    }
    const messages = await channel.messages.fetch({ limit: 100 }); // eslint-disable-line no-await-in-loop
    const lines = messages.reduce((acc, cur) => {
      if (cur.author.bot) return acc;
      if (Date.now() - cur.createdTimestamp > 1000 * 60) return acc;
      return acc + cur.content.split('\n').length;
    }, 0);

    if (lines > 0) {
      descriptions.push({
        position: index,
        name: channel.name,
        lpm: `${lines}`,
      });
    }
  }

  await Promise.all(channels.map(async (channelId, index) => {
    await getLpm(channelId, index);
  }));

  // Get the largest channel.name from descriptions
  const largestChannelLength = descriptions.reduce((acc, cur) => {
    if (cur.name.length > acc) return cur.name.length;
    return acc;
  }, 0);

  // Sort descriptions by the position
  descriptions.sort((a, b) => {
    if (a.position > b.position) return 1;
    if (a.position < b.position) return -1;
    return 0;
  });

  // For each channel name, add spaces to the end to make them all the same length
  const description = descriptions.map(d => {
    const spaces = largestChannelLength - d.name.length;
    const spaceString = '\ '.repeat(spaces); // eslint-disable-line no-useless-escape
    return `${d.name}${spaceString} | ${d.lpm}`;
  }).join('\n');

  embed.setDescription(`\`\`\`${description}
  \`\`\`
  Updated ${time(new Date(), 'R')} in ${Date.now() - startTime} ms`);

  return embed;
}
