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
import {SlashCommand} from '../../@types/commandDef';
import {embedTemplate} from '../../utils/embedTemplate';
import env from '../../../global/utils/env.config';
import logger from '../../../global/utils/logger';
import * as path from 'path';
const PREFIX = path.parse(__filename).name;

export const bug: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('bug')
    .setDescription('Report a bug or other feedback to the bot dev team!'),
  async execute(interaction) {
    logger.debug(`[${PREFIX}] starting!`);

    // Create the modal
    const modal = new ModalBuilder()
      .setCustomId(`bugReportModal~${interaction.id}`)
      .setTitle('Tripbot Bug Report');
    const bugReport = new TextInputBuilder()
      .setCustomId('bugReport')
      .setLabel('What would you like to tell the bot dev team?')
      .setStyle(TextInputStyle.Paragraph);
    const firstActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(bugReport);
    modal.addComponents(firstActionRow);
    await interaction.showModal(modal);
    const filter = (interaction:ModalSubmitInteraction) => interaction.customId.includes(`bugReportModal`);
    interaction.awaitModalSubmit({filter, time: 0})
      .then(async (i) => {
        if (i.customId.split('~')[1] !== interaction.id) return;
        const username = `${i.user.username}#${i.user.discriminator}`;
        const guildMessage = `${i.guild ? ` in ${i.guild.name}` : 'DM'}`;

        const bugReport = i.fields.getTextInputValue('bugReport');

        const botOwner = await i.client.users.fetch(env.DISCORD_OWNER_ID);
        const botOwnerEmbed = embedTemplate()
          .setColor(Colors.Purple)
          .setDescription(`Hey ${botOwner.toString()},\n${username}${guildMessage} reports:\n${bugReport}`);
        botOwner.send({embeds: [botOwnerEmbed]});

        const tripsitGuild = await i.client.guilds.fetch(env.DISCORD_GUILD_ID);
        const developerRole = tripsitGuild.roles.cache.find((role) => role.id === env.ROLE_DEVELOPER);
        if (!developerRole) {
          logger.error(`[${PREFIX}]Developer role not found!`);
          return;
        }
        const devChan = i.client.channels.cache.get(env.CHANNEL_TRIPBOT) as TextChannel;
        if (!devChan) {
          logger.error(`[${PREFIX}]Developer channel not found!`);
          return;
        }
        devChan.send(`Hey ${developerRole.toString()}, a user submitted a bug report:\n${bugReport}`);

        const embed = embedTemplate()
          .setColor(Colors.Purple)
          .setTitle('Thank you!')
        // eslint-disable-next-line max-len
          .setDescription('I\'ve submitted this feedback to the bot owner. \n\n\You\'re more than welcome to join the TripSit server and speak to Moonbear directly if you want! Check the /contact command for more info.');
        i.reply({embeds: [embed], ephemeral: true});
      });
  },
};
