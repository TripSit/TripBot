import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  ButtonInteraction,
  GuildMember,
} from 'discord.js';
import { SlashCommand } from '../../@types/commandDef';
// import {embedTemplate} from '../../utils/embedTemplate';
// import {stripIndents} from 'common-tags';
// import env from '../../../global/utils/env.config';
// import log from '../../../global/utils/log';
import { tripsitmeButton, tripsitmeClose } from '../../utils/tripsitme';

// const F= f(__filename);

export default tripsitmode;

export const tripsitmode: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('tripsitmode')
    .setDescription(
      'This command will apply the NeedsHelp role onto a user, and remove other roles!',
    )
    .addSubcommand(subcommand => subcommand
      .setName('on')
      .setDescription('Turn on Tripsit Mode')
      .addUserOption(option => option
        .setName('user')
        .setDescription('Member to help')
        .setRequired(true)))
    .addSubcommand(subcommand => subcommand
      .setName('off')
      .setDescription('Turn off Tripsit Mode')
      .addUserOption(option => option
        .setName('user')
        .setDescription('Member to stop helping')
        .setRequired(true))),
  async execute(interaction:ChatInputCommandInteraction) {
    const enable = interaction.options.getSubcommand();

    const targetMember = interaction.options.getMember('user') as GuildMember;

    // log.debug(`[${PREFIX}]
    // enable: ${enable}
    // targetMember: ${JSON.stringify(targetMember, null, 2)}
    // `);

    if (enable === 'on') {
      const testInteraction = {
        client: interaction.client,
        id: interaction.id,
        customId: `tripsitmodeOn~${targetMember}`,
        guild: interaction.guild,
        member: targetMember,
        user: interaction.user,
        channel: interaction.channel,
        deferReply: () => interaction.deferReply(),
        reply: content => {
          if (interaction.deferred || interaction.replied) {
            return interaction.followUp(content);
          }
          return interaction.reply(content);
        },
        followUp: content => interaction.followUp(content),
        showModal: modal => interaction.showModal(modal),
        awaitModalSubmit: params => interaction.awaitModalSubmit(params),
      } as ButtonInteraction;
      tripsitmeButton(testInteraction);
    }
    if (enable === 'off') {
      const testInteraction = {
        client: interaction.client,
        id: interaction.id,
        customId: `tripsitmodeOff~${targetMember.id}`,
        guild: interaction.guild,
        member: interaction.member,
        user: interaction.user,
        channel: interaction.channel,
        deferReply: () => interaction.deferReply(),
        reply: content => {
          if (interaction.deferred || interaction.replied) {
            return interaction.followUp(content);
          }
          return interaction.reply(content);
        },
        editReply: content => interaction.editReply(content),
        followUp: content => interaction.followUp(content),
        showModal: modal => interaction.showModal(modal),
        awaitModalSubmit: params => interaction.awaitModalSubmit(params),
      } as ButtonInteraction;
      tripsitmeClose(testInteraction);
    }
    return true;
  },
};
