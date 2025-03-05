import {
  SlashCommandBuilder,
} from 'discord.js';
import { stripIndents } from 'common-tags';
import { SlashCommand } from '../../@types/commandDef';
import { privacy } from '../../../global/commands/g.privacy';
import { embedTemplate } from '../../utils/embedTemplate';
import commandContext from '../../utils/context';

const F = f(__filename);

export const dPrivacy: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('privacy')
    .setDescription('See and manage how TripSit uses your data!')
    .setIntegrationTypes([0])
    .addSubcommand(subcommand => subcommand
      .setName('get')
      .setDescription('Get what data is stored on your user!'))
    .addSubcommand(subcommand => subcommand
      .setName('delete')
      .setDescription('Instructions on deleting your data!')
      .addStringOption(option => option.setName('confirmation')
        .setDescription('Enter your confirmation code to delete your data!'))),
  async execute(interaction) {
    log.info(F, await commandContext(interaction));
    await interaction.deferReply({ ephemeral: true });
    const command = interaction.options.getSubcommand() as 'get' | 'delete';
    const embed = embedTemplate();

    const userData = await privacy('get', interaction.user.id);

    if (command === 'get') {
      embed.setTitle('Your Data')
        .setDescription(`Here is what data we store on you: ${userData}`);
    } else if (command === 'delete') {
      const confirmation = interaction.options.getString('confirmation');
      if (confirmation === 'YesPlease!') {
        const userDeleteData = await privacy('delete', interaction.user.id);
        embed.setTitle('Deleting Your Data')
          .setDescription(`Your data was deleted:
          ${userDeleteData}`);
      } else {
        embed.setTitle('Are you sure?') /* eslint-disable max-len */
          .setDescription(stripIndents`This will delete all data we have on you, except:
          1) Moderation actions taken against your Discord ID will remain on file for 6 months from the last time your user ID was seen.
          2) If your user has been banned, your Discord ID and status of your ban will remain on file indefinitely.
          
          In other words: If you're not banned and you don't interact with the bot for 6 months, your data will be deleted.
          
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
