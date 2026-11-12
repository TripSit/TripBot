import {
  MessageFlags,
  SlashCommandBuilder,
} from 'discord.js';
import { stripIndents } from 'common-tags';
import { SlashCommand } from '../../@types/commandDef';
import { privacy, setIrcBridgeOptOut } from '../../../global/commands/g.privacy';
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
        .setDescription('Enter your confirmation code to delete your data!')))
    .addSubcommand(subcommand => subcommand
      .setName('bridge')
      .setDescription('Choose whether your messages are relayed to IRC by the chat bridge')
      .addBooleanOption(option => option.setName('relay')
        .setDescription('True to relay your messages to IRC, False to stop relaying them')
        .setRequired(true))),
  async execute(interaction) {
    log.info(F, await commandContext(interaction));
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const command = interaction.options.getSubcommand() as 'get' | 'delete' | 'bridge';
    const embed = embedTemplate();

    if (command === 'bridge') {
      const relay = interaction.options.getBoolean('relay', true);
      const optedOut = await setIrcBridgeOptOut(interaction.user.id, !relay);
      embed.setTitle('IRC Bridge')
        .setDescription(optedOut
          ? stripIndents`Your messages will no longer be relayed to IRC.
          Messages already relayed stay on IRC. Run this again with relay set to True to turn relaying back on.`
          : 'Your messages in bridged channels will be relayed to IRC.');
      await interaction.editReply({ embeds: [embed] });
      return true;
    }

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
