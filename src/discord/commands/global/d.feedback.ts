import type {
  ButtonInteraction,
  ChatInputCommandInteraction,
  ModalSubmitInteraction,
  TextChannel,
} from 'discord.js';

import { stripIndents } from 'common-tags';
import { MessageFlags, TextInputStyle } from 'discord-api-types/v10';
import {
  ActionRowBuilder,
  Colors,
  EmbedBuilder,
  ModalBuilder,
  SlashCommandBuilder,
  TextInputBuilder,
} from 'discord.js';

import type { SlashCommand } from '../../@types/commandDef';

import tripsitInfo from '../../../global/commands/g.about';
import commandContext from '../../utils/context';
import { embedTemplate } from '../../utils/embedTemplate';

const F = f(__filename);

export async function feedbackReportModal(
  interaction: ButtonInteraction | ChatInputCommandInteraction,
) {
  await interaction.showModal(
    new ModalBuilder()
      .setCustomId(`feedbackReportModal~${interaction.id}`)
      .setTitle('TripBot Feedback Report')
      .addComponents(
        new ActionRowBuilder<TextInputBuilder>().addComponents(
          new TextInputBuilder()
            .setCustomId('feedbackReport')
            .setLabel('What would you like to tell the bot dev team?')
            .setStyle(TextInputStyle.Paragraph),
        ),
      ),
  );

  const filter = (index: ModalSubmitInteraction) => index.customId.includes('feedbackReportModal');
  // log.debug(F, 'Showing the modal');
  interaction.awaitModalSubmit({ filter, time: 0 }).then(async (index) => {
    // log.debug(F, 'Modal submit interaction received');
    if (index.customId.split('~')[1] !== interaction.id) {
      return;
    }
    await index.deferReply({ flags: MessageFlags.Ephemeral });
    const guildName = ` in ${index.guild?.name}`;
    const guildMessage = index.guild ? guildName : 'DM';

    const feedbackReport = index.fields.getTextInputValue('feedbackReport');

    const botOwner = await index.client.users.fetch(env.DISCORD_OWNER_ID);
    const botOwnerEmbed = embedTemplate()
      .setColor(Colors.Purple)
      .setDescription(
        `Hey ${botOwner.toString()},\n${index.user.tag}${guildMessage} reports:\n${feedbackReport}`,
      );
    await botOwner.send({ embeds: [botOwnerEmbed] });

    const tripsitGuild = await index.client.guilds.fetch(env.DISCORD_GUILD_ID);
    tripsitGuild.roles.fetch();
    const developerRole = await tripsitGuild.roles.fetch(env.ROLE_DEVELOPER);
    if (!developerRole) {
      log.error(F, 'Developer role not found!');
      return;
    }
    const developmentChan = (await index.client.channels.fetch(
      env.CHANNEL_DEVELOPERS,
    )) as TextChannel;
    if (!developmentChan) {
      log.error(F, 'Developer channel not found!');
      return;
    }
    const feedbackEmbed = new EmbedBuilder()
      .setTitle('📝 New Feedback Report')
      .setDescription(feedbackReport)
      .setColor(0x00_b0_f4) // Choose your desired color
      .addFields({ inline: false, name: 'Mention', value: developerRole.toString() })
      .setTimestamp();

    await developmentChan.send({
      allowedMentions: {
        parse: [], // Prevents pinging the role
      },
      embeds: [feedbackEmbed],
    });

    const embed = embedTemplate().setColor(Colors.Purple).setTitle('Thank you!')
      .setDescription(stripIndents`
        Thank you! I\'ve submitted this feedback to Moonbear. 
        
        You\'re more than welcome to join the [TripSit server](${tripsitInfo.discord}) if you want!`);
    await index.editReply({ embeds: [embed] });
  });
  // log.debug(F, 'Modal submit interaction listener set up');
}
export const dFeedback: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('feedback')
    .setDescription('Share feedback or report a bug to the TripBot dev team!')
    .setIntegrationTypes([0]),
  async execute(interaction) {
    log.info(F, await commandContext(interaction));
    await feedbackReportModal(interaction);
    return true;
  },
};

export default dFeedback;
