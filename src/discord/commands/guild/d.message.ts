import {
  SlashCommandBuilder,
  EmbedBuilder,
  Message,
} from 'discord.js';
import { SlashCommand } from '../../@types/commandDef';

const F = f(__filename);

async function messageGrab(
  message: Message,
):Promise<string> {
  // check if message contains embed
  if (message.embeds.length > 0) {
    const embed = message.embeds[0];
    const embedData = embed.toJSON();
    // await interaction.editReply({ content: `\`\`\`json\n${embedString}\`\`\`` });
    return JSON.stringify(embedData, null, 2);
  }
  // await interaction.editReply({ content: `Message with ID '${id}' does not contain an embed!` });
  return `Message with ID '${message.id}' does not contain an embed!`;
}

async function messageEdit(
  message: Message,
  content: string,
):Promise<string> {
  // check if message is from bot
  if (message.author.id !== message.client.user?.id) {
    return `Message with ID '${message.id}' is not from me!`;
  }
  // check if message is raw embed code
  if (content.startsWith('{')) {
    try {
      const embedData = JSON.parse(content);
      const embed = new EmbedBuilder(embedData);
      message.edit({ embeds: [embed] })
        .then(() => 'Successfully edited message with new embed!\'')
        .catch(error => {
          log.error(F, error);
          return 'Error: Failed to edit message with embed.\'';
        });
    } catch (error) {
      log.error(F, `${error}`);
      return 'Error: There is an error in your embed code!';
    }
  } else {
  // edit message
    await message.edit(content);
  }
  return `I edited message with ID '${message.id}' to say '${content}'`;
}

export const dMessage: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('message')
    .setDescription('Do stuff with a bot message')

    .addSubcommand(subcommand => subcommand
      .setName('edit')
      .setDescription('Edit a message')
      .addStringOption(option => option.setName('id')
        .setDescription('What is the message ID?')
        .setRequired(true))
      .addStringOption(option => option.setName('message')
        .setDescription('What do you want to say?')
        .setRequired(true)))
    .addSubcommand(subcommand => subcommand
      .setName('grab')
      .setDescription('Grab the raw embed code of a message')
      .addStringOption(option => option.setName('id')
        .setDescription('What is the message ID?')
        .setRequired(true))),
  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    if (!interaction.guild) {
      await interaction.editReply({ content: 'This command can only be used in a server!' });
      return false;
    }

    // check if message id is valid
    const id = interaction.options.getString('id', true);
    const message = await interaction.channel?.messages.fetch(id);
    if (!message) {
      await interaction.editReply({ content: `Message with ID '${id}' not found!` });
      return false;
    }

    let response = '';
    // if edit command
    if (interaction.options.getSubcommand() === 'edit') {
      const content = interaction.options.getString('message', true);
      response = await messageEdit(message, content);
    }
    // if grab command
    if (interaction.options.getSubcommand() === 'grab') {
      response = await messageGrab(message);
    }

    if (response.toLowerCase().startsWith('error')) {
      await interaction.editReply({
        embeds: [],
        content: response,
      });
      return false;
    }
    await interaction.editReply({
      embeds: [],
      content: response,
    });
    return true;
  },
};

export default dMessage;
