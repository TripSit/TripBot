import {
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  Colors,
  SlashCommandBuilder,
  TextChannel,
} from 'discord.js';
import {
  TextInputStyle,
} from 'discord-api-types/v10';
import {SlashCommand} from '../../utils/commandDef';
import {embedTemplate} from '../../utils/embedTemplate';
import env from '../../../global/utils/env.config';
import logger from '../../../global/utils/logger';
const PREFIX = require('path').parse(__filename).name;

export const bug: SlashCommand = {
  data: new SlashCommandBuilder()
      .setName('bug')
      .setDescription('Report a bug or other feedback to the bot dev team!'),
  async execute(interaction) {
    logger.debug(`[${PREFIX}] starting!`);

    // Create the modal
    const modal = new ModalBuilder()
        .setCustomId('bugReportModal')
        .setTitle('Tripbot Bug Report');
    const bugReport = new TextInputBuilder()
        .setCustomId('bugReport')
        .setLabel('What would you like to tell the bot dev team?')
        .setStyle(TextInputStyle.Paragraph);
    // An action row only holds one text input, so you need one action row per text input.
    const firstActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(bugReport);
    // Add inputs to the modal
    modal.addComponents(firstActionRow);
    // Show the modal to the user
    await interaction.showModal(modal);
    logger.debug(`[${PREFIX}] displayed modal!`);
  },
  async submit(interaction) {
    const username = `${interaction.user.username}#${interaction.user.discriminator}`;
    const guildMessage = `${interaction.guild ? ` in ${interaction.guild.name}` : 'DM'}`;

    const bugReport = interaction.fields.getTextInputValue('bugReport');
    // logger.debug(`[${PREFIX}] bugReport:`, bugReport);

    const botOwner = await interaction.client.users.fetch(env.DISCORD_OWNER_ID)!;
    const botOwnerEmbed = embedTemplate()
        .setColor(Colors.Purple)
        .setDescription(`Hey ${botOwner.toString()},\n${username}${guildMessage} reports:\n${bugReport}`);
    botOwner.send({embeds: [botOwnerEmbed]});

    const tripsitGuild = await interaction.client.guilds.cache.get(env.DISCORD_GUILD_ID)!;
    const developerRole = tripsitGuild.roles.cache.find((role) => role.id === env.ROLE_DEVELOPER)!;
    const devChan = interaction.client.channels.cache.get(env.CHANNEL_TRIPBOT)! as TextChannel;
    // const devEmbed = embedTemplate()
    //   .setColor(Colors.Purple)
    //   .setDescription(`Hey ${developerRole.toString()},
    // a user submitted a bug report:\n${bugReport}`);
    devChan.send(`Hey ${developerRole.toString()}, a user submitted a bug report:\n${bugReport}`);

    const embed = embedTemplate()
        .setColor(Colors.Purple)
        .setTitle('Thank you!')
        // eslint-disable-next-line max-len
        .setDescription('I\'ve submitted this feedback to the bot owner. \n\n\You\'re more than welcome to join the TripSit server and speak to Moonbear directly if you want! Check the /contact command for more info.');
    if (!interaction.replied) {
      interaction.reply({
        embeds: [embed],
        ephemeral: true,
      });
    } else {
      interaction.followUp({
        embeds: [embed],
        ephemeral: false,
      });
    }
  },
};
