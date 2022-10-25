import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  // Colors,
  GuildMember,
  ModalBuilder,
  TextInputBuilder,
  ActionRowBuilder,
  ModalSubmitInteraction,
} from 'discord.js';
import {
  TextInputStyle,
} from 'discord-api-types/v10';
import {SlashCommand} from '../../@types/commandDef';
// import {embedTemplate} from '../../utils/embedTemplate';
import {moderate} from '../../../global/commands/g.moderate';
import env from '../../../global/utils/env.config';
import logger from '../../../global/utils/logger';
import * as path from 'path';
const PREFIX = path.parse(__filename).name;

export const mod: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('mod')
    .setDescription('Moderation actions!')
    .addSubcommand((subcommand) => subcommand
      .setDescription('Info on a user')
      .addStringOption((option) => option
        .setName('target')
        .setDescription('User to get info on!')
        .setRequired(true))
      .setName('info'))
    .addSubcommand((subcommand) => subcommand
      .setDescription('Ban a user')
      .addStringOption((option) => option
        .setName('target')
        .setDescription('User to ban!')
        .setRequired(true))
      .setName('ban'))
    .addSubcommand((subcommand) => subcommand
      .setDescription('Underban a user')
      .addStringOption((option) => option
        .setName('target')
        .setDescription('User to underban!')
        .setRequired(true))
      .setName('underban'))
    .addSubcommand((subcommand) => subcommand
      .setDescription('Warn a user')
      .addStringOption((option) => option
        .setName('target')
        .setDescription('User to warn!')
        .setRequired(true))
      .setName('warn'))
    .addSubcommand((subcommand) => subcommand
      .setDescription('Create a note about a user')
      .addStringOption((option) => option
        .setName('target')
        .setDescription('User to note about!')
        .setRequired(true))
      .setName('note'))
    .addSubcommand((subcommand) => subcommand
      .setDescription('Timeout a user')
      .addStringOption((option) => option
        .setName('target')
        .setDescription('User to timeout!')
        .setRequired(true))
      .addStringOption((option) => option
        .setName('toggle')
        .setDescription('On off?')
        .addChoices(
          {name: 'On', value: 'on'},
          {name: 'Off', value: 'off'},
        ))
      .setName('timeout'))
    .addSubcommand((subcommand) => subcommand
      .setDescription('Kick a user')
      .addStringOption((option) => option
        .setName('target')
        .setDescription('User to kick!')
        .setRequired(true))
      .setName('kick')),
  async execute(interaction:ChatInputCommandInteraction) {
    // logger.debug(`[${PREFIX}] started!`);
    // await interaction.deferReply({ephemeral: true});
    // const embed = embedTemplate()
    //   .setColor(Colors.DarkBlue)
    //   .setDescription('Moderating...');
    // await interaction.editReply({embeds: [embed]});

    const actor = interaction.member;
    const command = interaction.options.getSubcommand();
    const target = interaction.options.getString('target');
    let toggle = interaction.options.getString('toggle') as 'on' | 'off' | null;

    if (toggle === null) {
      toggle = 'on';
    }

    logger.debug(`[${PREFIX}] toggle: ${toggle}`);

    const targetGuild = await interaction!.client.guilds.fetch(env.DISCORD_GUILD_ID);

    logger.debug(`[${PREFIX}] target: ${target}`);
    const targetMember = await targetGuild.members.fetch((target as string).slice(2, -1)) as GuildMember;
    logger.debug(`[${PREFIX}] targetMember: ${targetMember}`);

    let verb = '';
    if (command === 'ban') {
      if (toggle === 'on') {
        verb = 'banning';
      } else {
        verb = 'unbanning';
      }
    } else if (command === 'underban') {
      if (toggle === 'on') {
        verb = 'underbanning';
      } else {
        verb = 'un-underbanning';
      }
    } else if (command === 'warn') {
      verb = 'warning';
    } else if (command === 'note') {
      verb = 'noting';
    } else if (command === 'timeout') {
      if (toggle === 'on') {
        verb = 'timing out';
      } else {
        verb = 'untiming out';
      }
    } else if (command === 'kick') {
      verb = 'kicking';
    } else if (command === 'info') {
      verb = 'getting info on';
    }

    if (command === 'info') {
      const result = await moderate(
        actor as GuildMember,
        'info',
        targetMember,
        toggle,
        null,
        null,
        null,
        interaction);
      logger.debug(`[${PREFIX}] Result: ${result}`);
      interaction.reply(result);
      logger.debug(`[${PREFIX}] finished!`);
      return;
    }

    const modal = new ModalBuilder()
      .setCustomId(`modModal~${command}`)
      .setTitle(`Tripbot ${command}`);
    const privReason = new TextInputBuilder()
      .setLabel(`Why are you ${verb} this user?`)
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder(`Tell the team why you're doing this`)
      .setRequired(true)
      .setCustomId('privReason');
    const pubReason = new TextInputBuilder()
      .setLabel('What should we tell the user?')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder(`Tell the user why you're doing this`)
      .setRequired(true)
      .setCustomId('pubReason');
    const timeoutDuration = new TextInputBuilder()
      .setLabel('Timeout for how long? (Max/default 7 days)')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('4 days 3hrs 2 mins 30 seconds')
      .setCustomId('duration');

    const firstActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(privReason);
    const secondActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(pubReason);
    modal.addComponents(firstActionRow, secondActionRow);

    if (command === 'timeout') {
      const thirdActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(timeoutDuration);
      modal.addComponents(thirdActionRow);
    }

    await interaction.showModal(modal);

    const filter = (interaction:ModalSubmitInteraction) => interaction.customId.startsWith(`modModal`);
    interaction.awaitModalSubmit({filter, time: 0})
      .then(async (interaction) => {
        const privReason = interaction.fields.getTextInputValue('privReason');
        const pubReason = interaction.fields.getTextInputValue('pubReason');
        let duration = null;
        try {
          duration = interaction.fields.getTextInputValue('duration');
        } catch (e) {
          // logger.error(`[${PREFIX}] ${e}`);
        }
        const modalCommand = interaction.customId.split('~')[1];
        const result = await moderate(
          actor as GuildMember,
          modalCommand,
          targetMember,
          toggle,
          privReason,
          pubReason,
          duration,
          interaction);
        logger.debug(`[${PREFIX}] Result: ${result}`);
        interaction.reply(result);
        logger.debug(`[${PREFIX}] finished!`);
      });
  },
};
