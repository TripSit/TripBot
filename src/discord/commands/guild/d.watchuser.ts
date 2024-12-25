import {
  ChannelType,
  GuildMember,
  SlashCommandBuilder,
  TextChannel,
} from 'discord.js';
import { SlashCommand } from '../../@types/commandDef';
import commandContext from '../../utils/context'; // eslint-disable-line @typescript-eslint/no-unused-vars
import { executeWatch, deleteWatchRequest } from '../../../global/commands/g.watchuser';

const F = f(__filename);

export const dWatchUser: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('watch')
    .setDescription('Get notified when a user says something')
    .addSubcommand(subcommand => subcommand
      .setName('add')
      .setDescription('Set a Watch on a user.')
      .addUserOption(option => option.setName('target')
        .setDescription('The target user to watch for or their Discord ID')
        .setRequired(true))
      .addStringOption(option => option.setName('notification_method')
        .setDescription('How do you want to be notified?')
        .addChoices(
          { name: 'DM', value: 'dm' },
          { name: 'Channel', value: 'channel' },
        )
        .setRequired(true))
      .addChannelOption(option => option.setName('alert_channel')
        .setDescription('Where should I notify you? (Default: \'here\')')))
    .addSubcommand(subcommand => subcommand
      .setName('cancel')
      .setDescription('Cancel a Watch on a user')
      .addStringOption(option => option.setName('target')
        .setDescription('The target user you were watching')
        .setRequired(true))),
  async execute(interaction) {
    log.info(F, await commandContext(interaction));
    await interaction.deferReply({ ephemeral: true });

    if (!interaction.guild) {
      await interaction.editReply({ content: 'This command can only be used in a server!' });
      return false;
    }

    const targetUser = interaction.options.getUser('target', true);

    if (interaction.options.getSubcommand() === 'cancel') {
      if (await deleteWatchRequest(targetUser.id, interaction.user.id)) {
        await interaction.editReply({ content: 'Done! You won\'t be notified the next time this user is active.' });
        return true;
      }
      // eslint-disable-next-line max-len
      await interaction.editReply({ content: 'Whoops, it seems like you don\'t have any watch requests on this user to cancel!' });
      return false;
    }

    let alertChannel = interaction.options.getChannel('alert_channel') as TextChannel | null;

    if (!alertChannel) {
      alertChannel = interaction.channel as TextChannel;
    }

    // Ensure that the channel used is a text channel
    if (alertChannel.type !== ChannelType.GuildText) {
      await interaction.editReply({ content: 'This command can only be used in a text channel!' });
      return false;
    }

    const notificationMethod = interaction.options.getString('notification_method', true);
    // const target = await interaction.client.users.fetch(targetUser.id);

    if (await executeWatch(targetUser, notificationMethod, interaction.user.id, alertChannel)) {
      await interaction.editReply({ content: 'Done! You\'ll be notified when this user is next seen active.' });

      const channelBotlog = await interaction.guild.channels.fetch(env.CHANNEL_BOTLOG) as TextChannel;
      if (channelBotlog) {
        await channelBotlog.send(`${(interaction.member as GuildMember).displayName} used /watch on ${targetUser}`);
      }
    } else {
      // eslint-disable-next-line max-len
      await interaction.editReply({ content: 'Whoops, it seems like you\'re already watching this user! If you\'d like, you can cancel this or cancel and switch modes, by using /watch cancel.' });
    }

    return true;
  },
};

export default dWatchUser;
