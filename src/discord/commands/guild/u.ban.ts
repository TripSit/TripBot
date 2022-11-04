import {
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  ContextMenuCommandBuilder,
  GuildMember,
  ModalSubmitInteraction,
} from 'discord.js';
import {
  ApplicationCommandType,
  TextInputStyle,
} from 'discord-api-types/v10';
import {parseDuration} from '../../../global/utils/parseDuration';
import {UserCommand} from '../../@types/commandDef';
import log from '../../../global/utils/log';
import {moderate} from '../../../global/commands/g.moderate';
import * as path from 'path';
const PREFIX = path.parse(__filename).name;

export const uBan: UserCommand = {
  data: new ContextMenuCommandBuilder()
    .setName('Ban')
    .setType(ApplicationCommandType.User),
  async execute(interaction) {
    const actor = interaction.member as GuildMember;
    const target = interaction.targetMember as GuildMember;

    const modal = new ModalBuilder()
      .setCustomId(`banModal~${interaction.id}`)
      .setTitle('Tripbot Ban');
    const privReason = new TextInputBuilder()
      .setLabel('Why are you banning this user?')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('Tell the team why you are banning this user.')
      .setRequired(true)
      .setCustomId('privReason');
    const pubReason = new TextInputBuilder()
      .setLabel('What should we tell the user?')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('This will be sent to the user!')
      .setRequired(true)
      .setCustomId('pubReason');
    const deleteMessages = new TextInputBuilder()
      .setLabel('How many days of msg to remove?')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('Between 0 and 7 days (Default 0)')
      .setCustomId('duration')
      .setRequired(true);

    const firstActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(privReason);
    const secondActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(pubReason);
    const thirdActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(deleteMessages);
    modal.addComponents(firstActionRow, secondActionRow, thirdActionRow);
    await interaction.showModal(modal);

    const filter = (interaction:ModalSubmitInteraction) => interaction.customId.includes(`banModal`);
    interaction.awaitModalSubmit({filter, time: 0})
      .then(async (i) => {
        if (i.customId.split('~')[1] !== interaction.id) return;
        const privReason = i.fields.getTextInputValue('privReason');
        const pubReason = i.fields.getTextInputValue('pubReason');
        const durationInput = i.fields.getTextInputValue('duration');

        let duration = 0;
        // Check if the given duration is a number between 0 and 7
        const days = parseInt(durationInput);
        if (isNaN(days) || days < 0 || days > 7) {
          i.reply({content: 'Invalid number of days given', ephemeral: true});
          return;
        } else {
          duration = duration ?
            await parseDuration(`${durationInput} days`) :
            0;
          log.debug(`[${PREFIX}] duration: ${duration}`);
        }

        const result = await moderate(
          actor,
          'ban',
          target,
          privReason,
          pubReason,
          duration,
          i);

        log.debug(`[${PREFIX}] Result: ${result}`);
        i.reply(result);

        log.debug(`[${PREFIX}] finished!`);
      });
    return true;
  },
};
