import {
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  Colors,
  SlashCommandBuilder,
  TextChannel,
  ModalSubmitInteraction,
  ChatInputCommandInteraction,
  ButtonInteraction,
  EmbedBuilder,
} from 'discord.js';
import {
  MessageFlags,
  TextInputStyle,
} from 'discord-api-types/v10';
import { SlashCommand } from '../../@types/commandDef';
import commandContext from '../../utils/context';
import { embedTemplate } from '../../utils/embedTemplate';
import tripsitInfo from '../../../global/commands/g.about';
import { t, getLocale, getCommandLocalizations } from '../../../i18n/index';

const F = f(__filename);

export async function feedbackReportModal(
  interaction:ChatInputCommandInteraction | ButtonInteraction,
  locale: string,
) {
  await interaction.showModal(
    new ModalBuilder()
      .setCustomId(`feedbackReportModal~${interaction.id}`)
      .setTitle(t(locale, 'feedback', 'modalTitle'))
      .addComponents(
        new ActionRowBuilder<TextInputBuilder>()
          .addComponents(
            new TextInputBuilder()
              .setCustomId('feedbackReport')
              .setLabel(t(locale, 'feedback', 'modalLabel'))
              .setStyle(TextInputStyle.Paragraph),
          ),
      ),
  );

  const filter = (i:ModalSubmitInteraction) => i.customId.includes('feedbackReportModal');
  // log.debug(F, 'Showing the modal');
  interaction.awaitModalSubmit({ filter, time: 0 })
    .then(async i => {
      // log.debug(F, 'Modal submit interaction received');
      if (i.customId.split('~')[1] !== interaction.id) return;
      await i.deferReply({ flags: MessageFlags.Ephemeral });
      const guildName = ` in ${i.guild?.name}`;
      const guildMessage = `${i.guild ? guildName : 'DM'}`;

      const feedbackReport = i.fields.getTextInputValue('feedbackReport');

      const botOwner = await i.client.users.fetch(env.DISCORD_OWNER_ID);
      const botOwnerEmbed = embedTemplate()
        .setColor(Colors.Purple)
        .setDescription(`Hey ${botOwner.toString()},\n${i.user.tag}${guildMessage} reports:\n${feedbackReport}`);
      await botOwner.send({ embeds: [botOwnerEmbed] });

      const tripsitGuild = await i.client.guilds.fetch(env.DISCORD_GUILD_ID);
      tripsitGuild.roles.fetch();
      const developerRole = await tripsitGuild.roles.fetch(env.ROLE_DEVELOPER);
      if (!developerRole) {
        log.error(F, 'Developer role not found!');
        return;
      }
      const devChan = await i.client.channels.fetch(env.CHANNEL_DEVELOPERS) as TextChannel;
      if (!devChan) {
        log.error(F, 'Developer channel not found!');
        return;
      }
      const feedbackEmbed = new EmbedBuilder()
        .setTitle(t(i.locale, 'feedback', 'feedbackReportTitle'))
        .setDescription(feedbackReport)
        .setColor(0x00b0f4) // Choose your desired color
        .addFields({ name: t(i.locale, 'feedback', 'mentionFieldName'), value: developerRole.toString(), inline: false })
        .setTimestamp();

      await devChan.send({
        embeds: [feedbackEmbed],
        allowedMentions: {
          parse: [], // Prevents pinging the role
        },
      });

      const embed = embedTemplate()
        .setColor(Colors.Purple)
        .setTitle(t(i.locale, 'feedback', 'thankYouTitle'))
        // eslint-disable-next-line max-len
        .setDescription(t(i.locale, 'feedback', 'thankYouDescription', { discordUrl: tripsitInfo.discord }));
      await i.editReply({ embeds: [embed] });
    });
  // log.debug(F, 'Modal submit interaction listener set up');
}
export const dFeedback: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('feedback')
    .setNameLocalizations(getCommandLocalizations('feedback', 'commandName'))
    .setDescription('Share feedback or report a bug to the TripBot dev team!')
    .setDescriptionLocalizations(getCommandLocalizations('feedback', 'commandDescription'))
    .setIntegrationTypes([0]),
  async execute(interaction) {
    log.info(F, await commandContext(interaction));
    const locale = await getLocale(interaction, 'feedback');
    await feedbackReportModal(interaction, locale);
    return true;
  },
};

export default dFeedback;
