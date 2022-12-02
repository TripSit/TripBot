/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  GuildMember,
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  SlashCommandBuilder,
  ModalSubmitInteraction,
} from 'discord.js';
import {
  TextInputStyle,
} from 'discord-api-types/v10';
import { parse } from 'path';
import { stripIndent, stripIndents } from 'common-tags';
import { botmod } from '../../../global/commands/g.botmod';
import { SlashCommand } from '../../@types/commandDef';
import { embedTemplate } from '../../utils/embedTemplate';
import { globalTemplate } from '../../../global/commands/_g.template';
import { db, getGuild } from '../../../global/utils/knex';
import env from '../../../global/utils/env.config';
import log from '../../../global/utils/log';
import { startLog } from '../../utils/startLog';
import { DiscordGuilds } from '../../../global/@types/pgdb';

const PREFIX = parse(__filename).name;

type GuildActionType = 'BOTKICK' | 'BOTBAN' | 'UNBOTBAN' | 'BOTWARNING' | 'BOTNOTE' | 'BOTINFO';
type UserActionType = 'BOTBAN' | 'UNBOTBAN';

export default dTemplate;

export const dTemplate: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('botmod')
    .setDescription('Bot Mod Actions!')
    .addSubcommandGroup(subcommandgroup => subcommandgroup
      .setName('guild')
      .setDescription('Bot mod guilds')
      .addSubcommand(subcommand => subcommand
        .setName('botinfo')
        .setDescription('Info on an ID')
        .addStringOption(option => option
          .setName('target')
          .setDescription('Guild ID to get info on!')
          .setRequired(true)))
      .addSubcommand(subcommand => subcommand
        .setName('botwarn')
        .setDescription('Warn an ID')
        .addStringOption(option => option
          .setName('target')
          .setDescription('Guild to warn!')
          .setRequired(true)))
      .addSubcommand(subcommand => subcommand
        .setName('botkick')
        .setDescription('Kick an ID')
        .addStringOption(option => option
          .setName('target')
          .setDescription('Guild to kick!')
          .setRequired(true)))
      .addSubcommand(subcommand => subcommand
        .setName('botban')
        .setDescription('Ban an ID')
        .addStringOption(option => option
          .setName('target')
          .setDescription('Guild to ban!')
          .setRequired(true))
        .addStringOption(option => option
          .setName('toggle')
          .setDescription('On off?')
          .addChoices(
            { name: 'On', value: 'on' },
            { name: 'Off', value: 'off' },
          )
          .setRequired(true))))
    .addSubcommandGroup(subcommandgroup => subcommandgroup
      .setName('user')
      .setDescription('Bot mod users')
      .addSubcommand(subcommand => subcommand
        .setName('botinfo')
        .setDescription('Info on an ID')
        .addStringOption(option => option
          .setName('target')
          .setDescription('User ID to get info!')
          .setRequired(true)))
      .addSubcommand(subcommand => subcommand
        .setName('botwarn')
        .setDescription('Warn an ID')
        .addStringOption(option => option
          .setName('target')
          .setDescription('User to warn!')
          .setRequired(true)))
      .addSubcommand(subcommand => subcommand
        .setName('botban')
        .setDescription('Ban an ID')
        .addStringOption(option => option
          .setName('target')
          .setDescription('User to ban!')
          .setRequired(true))
        // eslint-disable-next-line
      // .addStringOption(option => option.setName('duration').setDescription('Duration of ban!').setRequired(true))
        .addStringOption(option => option
          .setName('toggle')
          .setDescription('On off?')
          .addChoices(
            { name: 'On', value: 'on' },
            { name: 'Off', value: 'off' },
          )
          .setRequired(true)))),

  async execute(interaction) {
    startLog(PREFIX, interaction);
    const actor = interaction.member as GuildMember;
    // log.debug(`[${PREFIX}] Actor: ${actor}`);
    let command = interaction.options.getSubcommand().toUpperCase() as GuildActionType | UserActionType;
    // log.debug(`[${PREFIX}] Command: ${command}`);
    const group = interaction.options.getSubcommandGroup() as 'user' | 'guild';
    // log.debug(`[${PREFIX}] Group: ${group}`);
    const targetId = interaction.options.getString('target', true);
    // log.debug(`[${PREFIX}] target: ${targetId}`);
    const toggle = interaction.options.getString('toggle') ?? 'on' as 'on' | 'off';
    // log.debug(`[${PREFIX}] toggle: ${toggle}`);

    if (toggle === 'off' && command === 'BOTBAN') {
      command = `UN${command}`;
    }

    let verb = '';
    if (command === 'BOTBAN') {
      verb = 'banning';
    } else if (command === 'UNBOTBAN') {
      verb = 'unbanning';
    } else if (command === 'BOTWARNING') {
      verb = 'warning';
    } else if (command === 'BOTKICK') {
      verb = 'kicking';
    } else if (command === 'BOTINFO') {
      verb = 'getting info on';
    }

    if (command === 'BOTINFO') {
      const result = await botmod(
        interaction,
        group,
        actor,
        'BOTINFO',
        targetId,
        null,
        null,
      );
      // log.debug(`[${PREFIX}] Result: ${result}`);
      await interaction.reply(result);
      return true;
    }

    const modal = new ModalBuilder()
      .setCustomId(`botModModal~${interaction.id}`)
      .setTitle(`Tripbot bot ${command}`);
    const privReasonInput = new TextInputBuilder()
      .setLabel(`Why are you ${verb} this ${group}?`)
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('Tell the team why you\'re doing this')
      .setRequired(true)
      .setCustomId('privReason');
    const pubReasonInput = new TextInputBuilder()
      .setLabel(`What should we tell the ${group}?`)
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder(`Tell the ${group} why you're doing this`)
      .setRequired(true)
      .setCustomId('pubReason');

    const firstActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(privReasonInput);
    modal.addComponents(firstActionRow);

    if (['WARN', 'KICK', 'BAN', 'UNBAN'].includes(command)) {
      const pubReasonText = new ActionRowBuilder<TextInputBuilder>().addComponents(pubReasonInput);
      modal.addComponents(pubReasonText);
    }

    await interaction.showModal(modal);

    const filter = (i:ModalSubmitInteraction) => i.customId.startsWith('botModModal');
    interaction.awaitModalSubmit({ filter, time: 0 })
      .then(async i => {
        if (i.customId.split('~')[1] !== interaction.id) return;
        i.deferReply({ ephemeral: true });
        const privReason = i.fields.getTextInputValue('privReason');
        let pubReason = '';
        try {
          pubReason = i.fields.getTextInputValue('pubReason');
        } catch (e) {
          // ignore
        }
        const result = await botmod(interaction, group, actor, command, targetId, privReason, pubReason);
        i.editReply(result);
      });
    return false;
  },
};
