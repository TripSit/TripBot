import {
  GuildMember,
  SlashCommandBuilder,
  TextChannel,
} from 'discord.js';
import { SlashCommand } from '../../@types/commandDef';
import commandContext from '../../utils/context'; // eslint-disable-line @typescript-eslint/no-unused-vars

const F = f(__filename);

export const dSay: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('say')
    .setDescription('Say something like a real person!')
    .addStringOption(option => option.setName('say')
      .setDescription('What do you want to say?')
      .setRequired(true))
    .addChannelOption(option => option
      .setDescription('Where should I say it? (Default: \'here\')')
      .setName('channel')),
  async execute(interaction) {
    log.info(F, await commandContext(interaction));
    await interaction.deferReply({ ephemeral: true });
    if (!interaction.guild) {
      await interaction.editReply({ content: 'This command can only be used in a server!' });
      return false;
    }

    const channel = interaction.options.getChannel('channel') as TextChannel;
    const say = interaction.options.getString('say', true);
    const style = interaction.options.getString('style');

    if (channel) {
      // display typing status

      await channel.sendTyping();
      // wait 2 seconds
      await new Promise(resolve => setTimeout(resolve, 3000));
      // send message
      await channel.send(say);
    } else {
      // display typing status
      await interaction.channel?.sendTyping();
      // wait 2 seconds
      await new Promise(resolve => setTimeout(resolve, 3000));
      // send message
      await interaction.channel?.send(say);
    }

    // Set the type so it's not an API channel

    await channel.sendTyping(); // This method automatically stops typing after 10 seconds, or when a message is sent.
    setTimeout(async () => {
      await (channel as TextChannel).send(say);
    }, 3000);

    await interaction.editReply({ content: `I said '${say}' in ${channel.name}` }); // eslint-disable-line max-len

    const channelBotlog = await interaction.guild.channels.fetch(env.CHANNEL_BOTLOG) as TextChannel;
    if (channelBotlog) {
      await channelBotlog.send(`${(interaction.member as GuildMember).displayName} made me say '${say}' \
in ${channel ? channel.toString() : interaction.channel?.toString()}`);
    }

    return true;
  },
};

export default dSay;
