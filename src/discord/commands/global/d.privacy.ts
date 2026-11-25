import {
  MessageFlags,
  SlashCommandBuilder,
} from 'discord.js';
import type { TextChannel } from 'discord.js';
import { stripIndents } from 'common-tags';
import { SlashCommand } from '../../@types/commandDef';
import { privacy } from '../../../global/commands/g.privacy';
import { embedTemplate } from '../../utils/embedTemplate';
import { deleteDiscordPrivacyData } from '../../utils/privacyDeletion';

const F = f(__filename);

async function alertPrivacyDeletionFailure(interaction: Parameters<SlashCommand['execute']>[0]): Promise<void> {
  try {
    const channel = await interaction.client.channels.fetch(env.CHANNEL_BOTLOG) as TextChannel | null;
    if (!channel?.isTextBased() || !('send' in channel)) throw new Error('Bot log channel is unavailable');
    await channel.send({
      content: `A privacy deletion failed. The user was asked to retry. <@${env.DISCORD_OWNER_ID}>`,
      allowedMentions: { users: [env.DISCORD_OWNER_ID] },
    });
  } catch {
    log.error(F, 'Could not send the privacy deletion failure alert to the bot log channel.');
  }
}

export const dPrivacy: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('privacy')
    .setDescription('See and manage how TripSit uses your data!')
    .setIntegrationTypes([0])
    .addSubcommand(subcommand => subcommand
      .setName('get')
      .setDescription('Get what data is stored on your user!')
      .addBooleanOption(option => option.setName('ephemeral')
        .setDescription('Set to False to show the response to everyone')))
    .addSubcommand(subcommand => subcommand
      .setName('delete')
      .setDescription('Instructions on deleting your data!')
      .addStringOption(option => option.setName('confirmation')
        .setDescription('Enter your confirmation code to delete your data!'))
      .addBooleanOption(option => option.setName('ephemeral')
        .setDescription('Set to False to show the response to everyone'))),
  async execute(interaction) {
    log.info(F, 'privacy command used');
    const ephemeral = interaction.options.getBoolean('ephemeral') ?? true;
    await interaction.deferReply({ flags: ephemeral ? MessageFlags.Ephemeral : undefined });
    const command = interaction.options.getSubcommand() as 'get' | 'delete';
    const embed = embedTemplate();

    if (command === 'get') {
      const userData = await privacy('get', interaction.user.id);
      embed.setTitle('Your Data')
        .setDescription(`Here is what data we store on you: ${userData}`);
    } else if (command === 'delete') {
      const confirmation = interaction.options.getString('confirmation');
      if (confirmation === 'YesPlease!') {
        try {
          const userDeleteData = await privacy('delete', interaction.user.id, deleteDiscordPrivacyData);
          embed.setTitle('Deletion Complete')
            .setDescription(`Your data was deleted:
            ${userDeleteData}`);
        } catch {
          log.error(F, 'Privacy deletion failed');
          await alertPrivacyDeletionFailure(interaction);
          embed.setTitle('Deletion Could Not Be Completed')
            .setDescription('I could not confirm that your data was deleted. Some Discord cleanup may have completed, but your database deletion did not finish. Please run `/privacy delete` again to retry.');
        }
      } else {
        const userData = await privacy('get', interaction.user.id);
        embed.setTitle('Are you sure?') /* eslint-disable max-len */
          .setDescription(stripIndents`This will delete all data we have on you, except:
          Your TripBot moderation history will be deleted. Your moderator identity and notes on other users’ moderation records will be anonymized.
          If you have a temporary Discord ban awaiting its automatic lift, TripBot keeps only the account, guild, and expiry data needed to lift it; that timer record is deleted after Discord confirms the unban.

          Command usage is counted by command with a most recent use time. These aggregate stats have no user, guild, channel, or option data.
          
          This removes your TripBot profile and feature data, support ticket lifecycle records and their threads, moderator discussion thread, appeals, moderation history, saved Best Of copies, messages in TripBot’s bot and moderation log channels that contain your Discord ID, and the IRC Bridge role. Discord-managed bans are controlled by Discord and are not changed. Copies already relayed to IRC may remain as described in our privacy policy.
          
          This will delete everything else. Be sure you want to do this! 
          
          **Run this same command but with 'YesPlease!' as the confirmation code.**
          
          The following data will be deleted:
          ${userData}`);
      }
    }

    await interaction.editReply({ embeds: [embed] });
    return true;
  },
};

export default dPrivacy;
