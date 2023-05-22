import {
  GuildMember,
  SlashCommandBuilder,
  TextChannel,
  EmbedBuilder,
} from 'discord.js';
import { SlashCommand } from '../../@types/commandDef';
import commandContext from '../../utils/context'; // eslint-disable-line @typescript-eslint/no-unused-vars

const F = f(__filename);

export const dSay: SlashCommand = {
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
        .setRequired(true)),
    )
    .addSubcommand(subcommand => subcommand
      .setName('grab')
      .setDescription('Grab the raw embed code of a message')
      .addStringOption(option => option.setName('id')
        .setDescription('What is the message ID?')
        .setRequired(true)),
    ),
  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    
    // if edit command
    if (interaction.options.getSubcommand() === 'edit') {
      if (!interaction.guild) {
        await interaction.editReply({ content: 'This command can only be used in a server!' });
        return false;
      }
      // check if message id is valid
      const id = interaction.options.getString('id', true);
      const message = await interaction.channel?.messages.fetch(id);
      const say = interaction.options.getString('message', true);
      if (!message) {
        await interaction.editReply({ content: `Message with ID '${id}' not found!` });
        return false;
      }
      // check if message is from bot
      if (message.author.id !== interaction.client.user?.id) {
        await interaction.editReply({ content: `Message with ID '${id}' is not from me!` });
        return false;
      }
      // check if message is raw embed code
      if (say.startsWith('{')) {
        try {
          const embedData = JSON.parse(say);
          const embed = new EmbedBuilder(embedData);
          message.edit({ embeds: [embed] })
            .then(() => {
              interaction.editReply({ content: `Successfully edited message with new embed!'` });
              return true;
            })
            .catch((error) => {
              console.error(error);
              interaction.editReply({ content: `Failed to edit message with embed.'` });
              return false;
            });
        } catch (error) {
          console.error(error);
          interaction.editReply({ content: `There is an error in your embed code!` });
          return false;
        }
        return true;
      } else {
        // edit message
        await message.edit(say);
        await interaction.editReply({ content: `I edited message with ID '${id}' to say '${say}'` });
        return true;
      }
    }
    // if grab command
    if (interaction.options.getSubcommand() === 'grab') {
      if (!interaction.guild) {
      await interaction.editReply({ content: 'This command can only be used in a server!' });
      return false;
      }
      // 
      const id = interaction.options.getString('id', true);
      const message = await interaction.channel?.messages.fetch(id);
      // check if message id is valid
      if (!message) {
        await interaction.editReply({ content: `Message with ID '${id}' not found!` });
        return false;
      }
      // check if message contains embed
      if (message.embeds.length > 0) {
        const embed = message.embeds[0];
        const embedData = embed.toJSON();
        const embedString = JSON.stringify(embedData, null, 2);
        await interaction.editReply({ content: `\`\`\`json\n${embedString}\`\`\`` });
        return true;
      } else {
        await interaction.editReply({ content: `Message with ID '${id}' does not contain an embed!` });
        return false;
      }
    }

  return true;
  },
};