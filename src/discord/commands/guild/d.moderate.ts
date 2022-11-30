import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  // Colors,
  GuildMember,
  ModalBuilder,
  TextInputBuilder,
  ActionRowBuilder,
  ModalSubmitInteraction,
  Guild,
} from 'discord.js';
import {
  TextInputStyle,
} from 'discord-api-types/v10';
import { parse } from 'path';
import { SlashCommand } from '../../@types/commandDef';
// import {embedTemplate} from '../../utils/embedTemplate';
import { parseDuration } from '../../../global/utils/parseDuration';
import { moderate } from '../../../global/commands/g.moderate';
import { startLog } from '../../utils/startLog';
import env from '../../../global/utils/env.config';
// import log from '../../../global/utils/log';
import { ModAction } from '../../../global/@types/database';
import { UserActionType } from '../../../global/@types/pgdb';

const PREFIX = parse(__filename).name;

export default mod;

export const mod: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('mod')
    .setDescription('Moderation actions!')
    .addSubcommand(subcommand => subcommand
      .setDescription('Info on a user')
      .addStringOption(option => option
        .setName('target')
        .setDescription('User to get info on!')
        .setRequired(true))
      .setName('info'))
    .addSubcommand(subcommand => subcommand
      .setDescription('Full ban a user')
      .addStringOption(option => option
        .setName('target')
        .setDescription('User to fully ban!')
        .setRequired(true))
      .setName('full_ban'))
    .addSubcommand(subcommand => subcommand
      .setDescription('Underban a user')
      .addStringOption(option => option
        .setName('target')
        .setDescription('User to underban!')
        .setRequired(true))
      .setName('underban'))
    .addSubcommand(subcommand => subcommand
      .setDescription('Warn a user')
      .addStringOption(option => option
        .setName('target')
        .setDescription('User to warn!')
        .setRequired(true))
      .setName('warning'))
    .addSubcommand(subcommand => subcommand
      .setDescription('Create a note about a user')
      .addStringOption(option => option
        .setName('target')
        .setDescription('User to note about!')
        .setRequired(true))
      .setName('note'))
    .addSubcommand(subcommand => subcommand
      .setDescription('Timeout a user')
      .addStringOption(option => option
        .setName('target')
        .setDescription('User to timeout!')
        .setRequired(true))
      .addStringOption(option => option
        .setName('toggle')
        .setDescription('On off?')
        .addChoices(
          { name: 'On', value: 'on' },
          { name: 'Off', value: 'off' },
        ))
      .setName('timeout'))
    .addSubcommand(subcommand => subcommand
      .setDescription('Kick a user')
      .addStringOption(option => option
        .setName('target')
        .setDescription('User to kick!')
        .setRequired(true))
      .setName('kick')),
  async execute(interaction:ChatInputCommandInteraction) {
    startLog(PREFIX, interaction);

    const actor = interaction.member;
    let command = interaction.options.getSubcommand().toUpperCase();
    const target = interaction.options.getString('target');
    let toggle = interaction.options.getString('toggle') as 'on' | 'off' | null;

    if (toggle === null) {
      toggle = 'on';
    }

    if (toggle === 'off') {
      command = `UN${command}`;
    }

    // log.debug(`[${PREFIX}] toggle: ${toggle}`);

    const targetGuild = await interaction.client.guilds.fetch(env.DISCORD_GUILD_ID) as Guild;

    // log.debug(`[${PREFIX}] target: ${target}`);
    const targetMember = await targetGuild.members.fetch((target as string).slice(2, -1)) as GuildMember;
    // log.debug(`[${PREFIX}] targetMember: ${targetMember}`);

    let verb = '';
    if (command === 'FULL_BAN') {
      verb = 'banning';
    } else if (command === 'UNBAN') {
      verb = 'unbanning';
    } else if (command === 'UNDERBAN') {
      verb = 'underbanning';
    } else if (command === 'UNUNDERBAN') {
      verb = 'un-underbanning';
    } else if (command === 'WARNING') {
      verb = 'warning';
    } else if (command === 'NOTE') {
      verb = 'noting';
    } else if (command === 'TIMEOUT') {
      verb = 'timing out';
    } else if (command === 'UNTIMEOUT') {
      verb = 'untiming out';
    } else if (command === 'KICK') {
      verb = 'kicking';
    } else if (command === 'INFO') {
      verb = 'getting info on';
    }

    if (command === 'INFO') {
      const result = await moderate(
        actor as GuildMember,
        'INFO',
        targetMember,
        null,
        null,
        null,
      );
      // log.debug(`[${PREFIX}] Result: ${result}`);
      interaction.reply(result);
      return true;
    }

    const modal = new ModalBuilder()
      .setCustomId(`modModal~${command}~${interaction.id}`)
      .setTitle(`Tripbot ${command}`);
    const privReasonInput = new TextInputBuilder()
      .setLabel(`Why are you ${verb} this user?`)
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('Tell the team why you\'re doing this')
      .setRequired(true)
      .setCustomId('privReason');
    const pubReasonInput = new TextInputBuilder()
      .setLabel('What should we tell the user?')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('Tell the user why you\'re doing this')
      .setRequired(true)
      .setCustomId('pubReason');
    const timeoutDuration = new TextInputBuilder()
      .setLabel('Timeout for how long?')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('4 days 3hrs 2 mins 30 seconds (Max/default 7 days)')
      .setCustomId('duration')
      .setRequired(true);
    const deleteMessages = new TextInputBuilder()
      .setLabel('How many days of msg to remove?')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('Between 0 and 7 days (Default 0)')
      .setCustomId('duration')
      .setRequired(true);

    const firstActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(privReasonInput);
    modal.addComponents(firstActionRow);

    if (['WARNING', 'KICK', 'TIMEOUT', 'UNTIMEOUT', 'FULL_BAN', 'UNBAN', 'UNDERBAN', 'UNUNDERBAN'].includes(command)) {
      const pubReasonText = new ActionRowBuilder<TextInputBuilder>().addComponents(pubReasonInput);
      modal.addComponents(pubReasonText);
    }
    if (command === 'TIMEOUT') {
      const timeoutDurationText = new ActionRowBuilder<TextInputBuilder>().addComponents(timeoutDuration);
      modal.addComponents(timeoutDurationText);
    }
    if (command === 'FULL_BAN') {
      const deleteMessagesText = new ActionRowBuilder<TextInputBuilder>().addComponents(deleteMessages);
      modal.addComponents(deleteMessagesText);
    }

    await interaction.showModal(modal);

    const filter = (i:ModalSubmitInteraction) => i.customId.startsWith('modModal');
    interaction.awaitModalSubmit({ filter, time: 0 })
      .then(async i => {
        if (i.customId.split('~')[2] !== interaction.id) return;
        i.deferReply({ ephemeral: true });
        const privReason = i.fields.getTextInputValue('privReason');
        let pubReason = '';
        try {
          pubReason = i.fields.getTextInputValue('pubReason');
        } catch (e) {
          // ignore
        }
        let duration = null as number | null;
        try {
          const durationInput = i.fields.getTextInputValue('duration');
          if (command === 'FULL_BAN' || command === 'UNDERBAN') {
            // Check if the given duration is a number between 0 and 7
            const days = parseInt(durationInput, 10);
            if (Number.isNaN(days) || days < 0 || days > 7) {
              i.editReply({ content: 'Invalid number of days given' });
              return;
            }
            duration = duration
              ? await parseDuration(`${durationInput} days`)
              : 604800;
            // log.debug(`[${PREFIX}] duration: ${duration}`);
          } else if (command === 'TIMEOUT') {
            // Get duration
            duration = duration
              ? await parseDuration(durationInput)
              : 604800000;
            // log.debug(`[${PREFIX}] duration: ${duration}`);
          }
        } catch (e) {
          // log.error(`[${PREFIX}] ${e}`);
        }
        const modalCommand = i.customId.split('~')[1] as ModAction;
        const result = await moderate(
          actor as GuildMember,
          modalCommand as UserActionType,
          targetMember,
          privReason,
          pubReason,
          duration,
        );
          // log.debug(`[${PREFIX}] Result: ${result}`);
        i.editReply(result);
      });

    return false;
  },
};
