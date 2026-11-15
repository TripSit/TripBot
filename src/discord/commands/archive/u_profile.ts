import {
  ContextMenuCommandBuilder,
} from 'discord.js';
import {
  ApplicationCommandType,
} from 'discord-api-types/v10';
import { UserCommand } from '../../@types/commandDef';

export const info: UserCommand = {
  data: new ContextMenuCommandBuilder()
    .setName('Profile')
    .setType(ApplicationCommandType.User),
  async execute(interaction) {
    const testInteraction = {
      options: {},
      guild: interaction.guild,
      user: interaction.user,
      channel: interaction.channel,
      reply: (content:string) => interaction.reply(content),
    };

    const command = await interaction.client.commands.get('profile');
    await command.execute(testInteraction);

    return true;
  },
};
