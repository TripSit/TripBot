import {
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  Colors,
  SlashCommandBuilder,
  TextChannel,
  ModalSubmitInteraction,
} from 'discord.js';
import {
  TextInputStyle,
} from 'discord-api-types/v10';
import { SlashCommand } from '../../@types/commandDef';
import { startLog } from '../../utils/startLog';
import { embedTemplate } from '../../utils/embedTemplate';

const F = f(__filename);

export default dFeedback;

export const dFeedback: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('feedback')
    .setDescription('Report a bug or other feedback to the bot dev team!'),
  async execute(interaction) {
    startLog(F, interaction);
    // Create the modal
    const modal = new ModalBuilder()
      .setCustomId(`feedbackReportModal~${interaction.id}`)
      .setTitle('TripBot Feedback Report');
    const feedbackInput = new TextInputBuilder()
      .setCustomId('feedbackReport')
      .setLabel('What would you like to tell the bot dev team?')
      .setStyle(TextInputStyle.Paragraph);
    const firstActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(feedbackInput);
    modal.addComponents(firstActionRow);
    await interaction.showModal(modal);
    const filter = (i:ModalSubmitInteraction) => i.customId.includes('feedbackReportModal');
    interaction.awaitModalSubmit({ filter, time: 0 })
      .then(async i => {
        if (i.customId.split('~')[1] !== interaction.id) return;
        const guildName = ` in ${i.guild?.name}`;
        const guildMessage = `${i.guild ? guildName : 'DM'}`;

        const feedbackReport = i.fields.getTextInputValue('feedbackReport');

        const botOwner = await i.client.users.fetch(env.DISCORD_OWNER_ID);
        const botOwnerEmbed = embedTemplate()
          .setColor(Colors.Purple)
          .setDescription(`Hey ${botOwner.toString()},\n${i.user.tag}${guildMessage} reports:\n${feedbackReport}`);
        await botOwner.send({ embeds: [botOwnerEmbed] });

        const tripsitGuild = await i.client.guilds.fetch(env.DISCORD_GUILD_ID);
        const developerRole = tripsitGuild.roles.cache.find(role => role.id === env.ROLE_DEVELOPER);
        if (!developerRole) {
          log.error(F, 'Developer role not found!');
          return;
        }
        const devChan = i.client.channels.cache.get(env.CHANNEL_TRIPBOT) as TextChannel;
        if (!devChan) {
          log.error(F, 'Developer channel not found!');
          return;
        }
        await devChan.send(`Hey ${developerRole.toString()}, a user submitted a feedback report:\n${feedbackReport}`);

        const embed = embedTemplate()
          .setColor(Colors.Purple)
          .setTitle('Thank you!')
          // eslint-disable-next-line max-len
          .setDescription('I\'ve submitted this feedback to the bot owner. \n\nYou\'re more than welcome to join the TripSit server and speak to Moonbear directly if you want! Check the /contact command for more info.');
        i.reply({ embeds: [embed], ephemeral: true });
      });
    return true;
  },
};
