import {
  SlashCommandBuilder,
  ButtonBuilder,
} from 'discord.js';
import {
  ButtonStyle,
} from 'discord-api-types/v10';
import {SlashCommand} from '../../utils/commandDef';
import {embedTemplate} from '../../utils/embedTemplate';
import env from '../../../global/utils/env.config';
import logger from '../../../global/utils/logger';
import {paginationEmbed} from '../../utils/pagination';

const PREFIX = require('path').parse(__filename).name;

const button1 = new ButtonBuilder()
    .setCustomId('previousbtn')
    .setLabel('Previous')
    .setStyle(ButtonStyle.Danger);

const button2 = new ButtonBuilder()
    .setCustomId('nextbtn')
    .setLabel('Next')
    .setStyle(ButtonStyle.Success);

const buttonList = [
  button1,
  button2,
];

export const help: SlashCommand = {
  data: new SlashCommandBuilder()
      .setName('help')
      .setDescription('Information bout TripBot Commands'),
  async execute(interaction) {
    const globalEmbed = embedTemplate()
        .setTitle('TripBot Commands')
        .addFields(
            {name: 'Drug', value: 'This command looks up drug information!', inline: true},
            {name: 'iDose', value: 'Remind yourself when you last dosed.', inline: true},
            {name: 'Calc Psychedelics', value: 'Calculate psychedelic dosages', inline: true},

            {name: 'Calc DXM', value: 'Use this to calculate dxm dosages', inline: true},
            {name: 'Calc Benzos', value: 'Calculate dosages between benzos', inline: true},
            {name: 'Calc Ketamine', value: 'Calculate ketamine dosages', inline: true},

            {name: 'Combo', value: 'Checks the interactions between two drugs.', inline: true},
            {name: 'ComboChart', value: 'Checks the interactions between two drugs.', inline: true},
            {name: 'Reagents', value: 'Shows a reaction chart.', inline: true},

            {name: 'Breathe', value: 'Gif: Breathing exercises.', inline: true},
            {name: 'Hydrate', value: 'Reminder to drink water.', inline: true},
            {name: 'EMS', value: 'Emergency medical info.', inline: true},

            {name: 'About', value: 'Information on Team TripSit and who built this bot.', inline: true},
            {name: 'Contact', value: 'How to contact Team TripSit and the bot builder.', inline: true},
            {name: 'Bug', value: 'Sends a message to dev.\nAll feedback welcome!', inline: true},
        );

    // logger.debug(`[${PREFIX}] interaction.guild.id: ${interaction.guild.id}`);
    // logger.debug(`[${PREFIX}]] DISCORD_GUILD_ID: ${DISCORD_GUILD_ID}`);
    if (interaction.guild) {
      if (interaction.guild.id !== env.DISCORD_GUILD_ID) {
        interaction.reply({embeds: [globalEmbed], ephemeral: false});
        return;
      }
    } else {
      interaction.reply({embeds: [globalEmbed], ephemeral: false});
      return;
    }

    const hrEmbed = embedTemplate()
        .setTitle('Harm Reduction Modules')
        .addFields(
            {name: 'Drug', value: 'This command looks up drug information!', inline: true},
            {name: 'iDose', value: 'Remind yourself when you last dosed.', inline: true},
            {name: 'Calc Psychedelics', value: 'Calculate psychedelic dosages', inline: true},

            {name: 'Calc DXM', value: 'Use this to calculate dxm dosages', inline: true},
            {name: 'Calc Benzos', value: 'Calculate dosages between benzos', inline: true},
            {name: 'Calc Ketamine', value: 'Calculate ketamine dosages', inline: true},

            {name: 'Combo', value: 'Checks the interactions between two drugs.', inline: true},
            {name: 'ComboChart', value: 'Checks the interactions between two drugs.', inline: true},
            {name: 'Reagents', value: 'Shows a reaction chart.', inline: true},
        );

    const tripsittingEmbed = embedTemplate()
        .setTitle('Tripsitting Modules')
        .addFields(
            {name: 'TripSit', value: 'Applies the "NeedsHelp" role on a user, removes all other roles.', inline: true},
            {name: 'Recovery', value: 'Image: Recovery position.', inline: true},
            {name: 'Breathe', value: 'Gif: Breathing exercises.', inline: true},

            {name: 'KIPP', value: 'Keep It Positive Please!', inline: true},
            {name: 'Hydrate', value: 'Reminder to drink water.', inline: true},
            {name: 'EMS', value: 'Emergency medical info.', inline: true},

            {name: 'Topic', value: 'Displays a random topic.', inline: true},
            {name: 'Joke', value: 'Displays a random joke.', inline: true},
            {name: 'Motivate', value: 'Displays a random quote.', inline: true},

            {name: 'Triptoys', value: 'Cool toys to play with!', inline: true},
            {name: 'Urban Define', value: 'Defines a word.', inline: true},
            {name: 'Remindme', value: 'Sends a reminder in PM.', inline: true},
        );

    const utilityEmbed = embedTemplate()
        .setTitle('Utility Modules')
        .addFields(
            {name: 'About', value: 'Information on Team TripSit and who built this bot.', inline: true},
            {name: 'Contact', value: 'How to contact Team TripSit and the bot builder.', inline: true},
            {name: 'Help', value: 'Information on all commands, you\'re here now!', inline: true},

            {name: 'Time', value: 'Set and view user\'s timezones', inline: true},
            {name: 'Birthday', value: 'Set and view user\'s birthday', inline: true},
            {name: 'Bug', value: 'Sends a message to dev.\nAll feedback welcome!', inline: true},

            {name: 'Karma', value: 'Displays karma (reactions) given and received.', inline: true},
            {name: 'Report', value: 'Allows users to report someone to the TripSit Team.', inline: true},
            {name: '\u200b', value: '\u200b', inline: true},
        );

    const tripsitEmbed = embedTemplate()
        .setTitle('Admin Modules')
        .addFields(
            {name: 'Mod', value: 'Applies mod actions on a user (timeout, kick, ban).', inline: true},
            {name: 'Botmod', value: 'Bans users/guilds from the bot after abuse.', inline: true},
            {name: 'Issue', value: 'Submits an issue to the github', inline: true},

            {name: 'Button', value: 'Creates the button in the #tripsit room', inline: true},
            {name: 'Invite', value: 'Create an invite to the server for a specific room.', inline: true},
            {name: 'Test', value: 'Tests every command, this is locked to Admin only', inline: true},
        );

    const book = [
      hrEmbed,
      tripsittingEmbed,
      utilityEmbed,
      tripsitEmbed,
    ];
    // eslint-disable-next-line
    // interaction.reply({ embeds: [paginationEmbed(interaction, book, buttonList)], ephemeral: false });
    // interaction.reply(paginationEmbed(interaction, book, buttonList))
    // if (!interaction.replied) { interaction.reply({ embeds: [embed], ephemeral: false });}
    // else {interaction.followUp({ embeds: [embed], ephemeral: false });}
    paginationEmbed(interaction, book, buttonList, 120000);
    logger.debug(`[${PREFIX}] finished!`);
  },
};
