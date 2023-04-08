import {
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  Colors,
  SlashCommandBuilder,
  ModalSubmitInteraction,
} from 'discord.js';
import {
  TextInputStyle,
} from 'discord-api-types/v10';
import { SlashCommand } from '../../@types/commandDef';
import { embedTemplate } from '../../utils/embedTemplate';
import { globalTemplate } from '../../../global/commands/_g.template';
import commandContext from '../../utils/context';
import { getUser } from '../../../global/utils/knex';

const F = f(__filename);

export const dTemplate: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('template')
    .setDescription('Example!')
    .addSubcommand(subcommand => subcommand
      .setName('subcommand')
      .setDescription('subcommand')
      .addStringOption(option => option.setName('string')
        .setDescription('string')
        .setRequired(true))
      .addNumberOption(option => option.setName('number')
        .setDescription('number')
        .setRequired(true))
      .addIntegerOption(option => option.setName('integer')
        .setDescription('integer')
        .setRequired(true))
      .addBooleanOption(option => option.setName('boolean')
        .setDescription('boolean')
        .setRequired(true))
      .addUserOption(option => option.setName('user')
        .setDescription('user')
        .setRequired(true))
      .addChannelOption(option => option.setName('channel')
        .setDescription('channel')
        .setRequired(true))
      .addRoleOption(option => option.setName('role')
        .setDescription('role')
        .setRequired(true))
      .addMentionableOption(option => option.setName('mentionable')
        .setDescription('mentionable')
        .setRequired(true))
      .addBooleanOption(option => option.setName('ephemeral')
        .setDescription('Set to "True" to show the response only to you'))),
  async execute(interaction) {
    log.info(F, await commandContext(interaction));
    // Below is if you just want a response (non-modal) command
    // await interaction.deferReply({ ephemeral: (interaction.options.getBoolean('ephemeral') === true) });
    // const input = i.fields.getTextInputValue('modalInput');
    // const string = interaction.options.getString('string');
    // const number = interaction.options.getNumber('number');
    // const integer = interaction.options.getInteger('integer');
    // const boolean = interaction.options.getBoolean('boolean');
    // const user = interaction.options.getUser('user');
    // const channel = interaction.options.getChannel('channel');
    // const role = interaction.options.getRole('role');
    // const mentionable = interaction.options.getMentionable('mentionable');
    // const response = await globalTemplate();
    // const userData = await getUser(i.user.id, null);
    // const embed = embedTemplate()
    //   .setTitle('Modal')
    //   .setColor(Colors.Blurple)
    //   .setDescription(`
    //   Your user id: ${userData.id}
    //   response: ${response}
    //   string: ${string}
    //   number: ${number}
    //   integer: ${integer}
    //   boolean: ${boolean}
    //   user: ${user}
    //   channel: ${channel}
    //   role: ${role}
    //   mentionable: ${mentionable}
    //   input: ${input}
    // `)
    // await interaction.editReply({
    //   embeds: [embed],
    // });

    const firstRowOfFive = new ActionRowBuilder<TextInputBuilder>()
      .addComponents(new TextInputBuilder()
        .setCustomId('modalInput')
        .setLabel('Input')
        .setStyle(TextInputStyle.Paragraph));

    const secondRowOfFive = new ActionRowBuilder<TextInputBuilder>()
      .addComponents(new TextInputBuilder()
        .setCustomId('modalInput')
        .setLabel('Input')
        .setStyle(TextInputStyle.Short));

    const modal = new ModalBuilder()
      .setCustomId(`modal~${interaction.id}`)
      .setTitle('Modal')
      .addComponents(firstRowOfFive, secondRowOfFive);

    await interaction.showModal(modal);

    const filter = (i:ModalSubmitInteraction) => i.customId.includes('feedbackReportModal');
    interaction.awaitModalSubmit({ filter, time: 0 })
      .then(async i => {
        if (i.customId.split('~')[1] !== interaction.id) return;
        await i.deferReply({ ephemeral: (interaction.options.getBoolean('ephemeral') === true) });
        const input = i.fields.getTextInputValue('modalInput');
        const string = interaction.options.getString('string');
        const number = interaction.options.getNumber('number');
        const integer = interaction.options.getInteger('integer');
        const boolean = interaction.options.getBoolean('boolean');
        const user = interaction.options.getUser('user');
        const channel = interaction.options.getChannel('channel');
        const role = interaction.options.getRole('role');
        const mentionable = interaction.options.getMentionable('mentionable');

        const response = await globalTemplate();
        const userData = await getUser(i.user.id, null, null);

        await i.editReply({
          embeds: [
            embedTemplate()
              .setTitle('Modal')
              .setColor(Colors.Blurple)
              .setDescription(`
                Your user id: ${userData.id}
                response: ${response}
                string: ${string} 
                number: ${number}
                integer: ${integer}
                boolean: ${boolean}
                user: ${user}
                channel: ${channel}
                role: ${role}
                mentionable: ${mentionable}
                input: ${input}
              `),
          ],
        });
      });
    return true;
  },
};

export default dTemplate;
