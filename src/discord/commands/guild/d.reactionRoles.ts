/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  SlashCommandBuilder,
  TextChannel,
} from 'discord.js';
import { db } from '../../../global/utils/knex';
import {
  ReactionRoles,
} from '../../../global/@types/pgdb';
import { SlashCommand } from '../../@types/commandDef';
import { embedTemplate } from '../../utils/embedTemplate';
import { startLog } from '../../utils/startLog';

const F = f(__filename);

export default dReactionRoles;

export const dReactionRoles: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('createreactionrole')
    .setDescription('Set up a reaction role message!')
    .addStringOption(option => option.setName('description')
      .setDescription('What should the message say?')
      .setRequired(true))
    .addStringOption(option => option.setName('emoji')
      .setDescription('What emoji should be used?')
      .setRequired(true))
    .addRoleOption(option => option.setName('role')
      .setDescription('What role should be applied?')
      .setRequired(true)),
  async execute(interaction) {
    startLog(F, interaction);

    const description = interaction.options.getString('description', true);
    const emoji = interaction.options.getString('emoji', true);
    const role = interaction.options.getRole('role', true);

    const mindsetEmbed = embedTemplate()
      .setDescription(description);

    // log.debug(F, `Emoji length is ${emoji.length}`);

    await (interaction.channel as TextChannel).send({ embeds: [mindsetEmbed] })
      .then(async msg => {
        if (emoji.includes('<')) {
          const emojiId = emoji.slice(emoji.indexOf(':', 3) + 1, emoji.indexOf('>'));
          // log.debug(F, `Emoji ID is ${emojiId}!`);
          // const emojiId = emoji.split(':')[2].replace('>', '');
          try {
            await msg.react(emojiId);
          } catch (err) {
            // If there's an error adding the emoji, delete the message
            msg.delete();
            interaction.reply({
              content: 'Reaction role message NOT created!\n\nMake sure you used a proper emoji that this bot can see!',
              ephemeral: true,
            });
            return false;
          }
        } else {
          try {
            await msg.react(emoji);
          } catch (err) {
            // If there's an error adding the emoji, delete the message
            msg.delete();
            interaction.reply({
              content: 'Reaction role message NOT created!\n\nMake sure you used a proper emoji that this bot can see!',
              ephemeral: true,
            });
            return false;
          }
        }
        const reactionRoleInfo = [
          {
            guild_id: msg.channel.guild.id,
            channel_id: msg.channel.id,
            message_id: msg.id,
            reaction_id: emoji,
            role_id: role.id,
          },
        ];
        await db<ReactionRoles>('reaction_roles')
          .insert(reactionRoleInfo)
          .onConflict(['role_id', 'reaction_id'])
          .merge();
        interaction.reply({ content: 'Reaction role message created!', ephemeral: true });
        return true;
      });

    return true;
  },
};
