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
} from 'discord.js';
import {
  MessageFlags,
  TextInputStyle,
} from 'discord-api-types/v10';
import { stripIndents } from 'common-tags';
import { SlashCommand } from '../../@types/commandDef';
import commandContext from '../../utils/context';
import { embedTemplate } from '../../utils/embedTemplate';
import tripsitInfo from '../../../global/commands/g.about';

const F = f(__filename);

export async function feedbackReportModal(
  interaction:ChatInputCommandInteraction | ButtonInteraction,
) {
  await interaction.showModal(
    new ModalBuilder()
      .setCustomId(`feedbackReportModal~${interaction.id}`)
      .setTitle('TripBot Feedback Report')
      .addComponents(
        new ActionRowBuilder<TextInputBuilder>()
          .addComponents(
            new TextInputBuilder()
              .setCustomId('feedbackReport')
              .setLabel('What would you like to tell the bot dev team?')
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
      const devChan = await i.client.channels.fetch(env.CHANNEL_TRIPBOT) as TextChannel;
      if (!devChan) {
        log.error(F, 'Developer channel not found!');
        return;
      }
      await devChan.send(`Hey ${developerRole.toString()}, a user submitted a feedback report:\n${feedbackReport}`);

      const embed = embedTemplate()
        .setColor(Colors.Purple)
        .setTitle('Thank you!')
        // eslint-disable-next-line max-len
        .setDescription(stripIndents`
        Thank you! I\'ve submitted this feedback to Moonbear. 
        
        You\'re more than welcome to join the [TripSit server](${tripsitInfo.discord}) if you want!`);
      await i.editReply({ embeds: [embed] });
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
