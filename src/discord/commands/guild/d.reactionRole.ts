/* eslint-disable no-unused-vars */

import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  GuildMember,
  Role,
  SlashCommandBuilder,
  TextChannel,
  ButtonInteraction,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ModalSubmitInteraction,
} from 'discord.js';
// import { db } from '../../../global/utils/knex';
// import {
//   ReactionRoles,
// } from '../../../global/@types/pgdb';
import { SlashCommand } from '../../@types/commandDef';
import { embedTemplate } from '../../utils/embedTemplate';

const F = f(__filename);

export default dReactionRole;

const guildError = 'This must be performed in a guild!';
const memberError = 'This must be performed by a member of a guild!';

export const dReactionRole: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('reaction_role')
    .setDescription('Create a reaction role message')
    .addRoleOption(option => option.setName('role')
      .setRequired(true)
      .setDescription('What role should be applied?'))
    .addStringOption(option => option.setName('emoji')
      .setRequired(true)
      .setDescription('What emoji should be used?'))
    .addBooleanOption(option => option.setName('intro_message')
      .setDescription('Do they need to provide an intro message?'))
    .addChannelOption(option => option.setName('intro_channel')
      .setDescription('Where should the announcement be posted?')),
  // .addBooleanOption(option => option.setName('needs_approval')
  //   .setDescription('Does this role need approval?')),
  async execute(interaction) {
    startlog(F, interaction);
    if (!interaction.guild) return false;
    const emoji = interaction.options.getString('emoji', true);
    const role = interaction.options.getRole('role', true) as Role;
    const introMessage = interaction.options.getBoolean('intro_message')
      ? `"${interaction.options.getBoolean('intro_message')}"`
      : null;
    const introChannel = interaction.options.getChannel('intro_channel')
      ? `"${interaction.options.getChannel('intro_channel', true).id}"`
      : null;

    if (!(interaction.member as GuildMember).roles.cache.has(env.ROLE_DEVELOPER)) {
      await interaction.reply({ content: 'You do not have permission to use this command!', ephemeral: true });
      return false;
    }

    // Display modal to get intro message from the user
    const modal = new ModalBuilder()
      .setCustomId(`"ID":"RR","II":"${interaction.id}"`)
      .setTitle(`${role.name} Description`);
    modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder()
      .setCustomId('description')
      .setRequired(true)
      .setLabel('Describe this role!')
        .setPlaceholder(`This will go into the embed to let people know what they're clicking on!`) // eslint-disable-line
      .setMaxLength(2000)
      .setStyle(TextInputStyle.Paragraph)));
    await interaction.showModal(modal);

    // Collect a modal submit interaction
    const filter = (i:ModalSubmitInteraction) => i.customId.startsWith('"ID":"RR"');
    interaction.awaitModalSubmit({ filter, time: 0 })
      .then(async i => {
        const {
          II,
        } = JSON.parse(`{${i.customId}}`);

        if (II !== interaction.id) return;
        if (!i.guild) {
          // log.debug(F, `no guild!`);
          i.reply(guildError);
          return;
        }
        if (!i.member) {
          // log.debug(F, `no member!`);
          i.reply(memberError);
        }

        const description = i.fields.getTextInputValue('description');

        const embed = embedTemplate()
          .setFooter(null)
          .setDescription(description);

        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setCustomId(`"ID":"RR","RID":"${role.id}","IM":${introMessage},"IC":${introChannel}`) // eslint-disable-line
            .setEmoji(emoji)
            .setStyle(ButtonStyle.Primary),
        );
        await (interaction.channel as TextChannel).send({ embeds: [embed], components: [row] });

        const channelBotlog = await i.guild.channels.fetch(env.CHANNEL_BOTLOG) as TextChannel;
        await channelBotlog.send(`${(interaction.member as GuildMember).displayName} created a new reaction role message`);
        i.reply({ content: 'Reaction role message created!', ephemeral: true });
      });

    return true;
  },
};

export async function processReactionRole(
  interaction:ButtonInteraction,
) {
  log.debug(F, `Processing reaction role click Options: ${JSON.stringify(interaction.customId, null, 2)}`);
  const {
    RID, IM, IC,
  } = JSON.parse(`{${interaction.customId}}`);

  log.debug(F, `RID: ${RID}, IM: ${IM}, IC: ${IC}`);

  const target = interaction.member as GuildMember;

  const role = await interaction.guild?.roles.fetch(RID);

  if (!role) {
    log.error(F, `Role ${RID} not found`);
    return;
  }

  if (target.roles.cache.has(role.id)) {
    // Display modal to get intro message from the user
    const modal = new ModalBuilder()
      .setCustomId(`"ID":"RR","II":"${interaction.id}"`)
      .setTitle(`Are you sure you want to remove ${role.name}?`);
    modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder()
      .setCustomId('reason')
      .setLabel('You can optionally tell us why!')
        .setPlaceholder(`We'll use this to try and improve our process!`) // eslint-disable-line
      .setMaxLength(2000)
      .setStyle(TextInputStyle.Paragraph)));
    await interaction.showModal(modal);

    // Collect a modal submit interaction
    const filter = (i:ModalSubmitInteraction) => i.customId.startsWith('"ID":"RR"');
    interaction.awaitModalSubmit({ filter, time: 0 })
      .then(async i => {
        log.debug(F, `${JSON.stringify(i.customId)}`);
        const {
          II,
        } = JSON.parse(`{${i.customId}}`);

        if (II !== interaction.id) return;
        if (!i.guild) {
          // log.debug(F, `no guild!`);
          i.reply(guildError);
          return;
        }
        if (!i.member) {
          // log.debug(F, `no member!`);
          i.reply(memberError);
        }

        await target.roles.remove(role);
        await i.reply({ content: `Removed role ${role.name}`, ephemeral: true });

        const channelAudit = await i.guild.channels.fetch(env.CHANNEL_AUDITLOG) as TextChannel;
        const reason = i.fields.getTextInputValue('reason');
        await channelAudit.send(`${(i.member as GuildMember).displayName} removed role ${role.name} because: ${reason}`);
      });
    return;
  }

  let introMessage = '' as string;
  if (IM) {
    if (!IC) {
      log.error(F, 'Intro message is true but intro channel is not set');
      interaction.reply({
        content: 'If the user must supply an intro message, you must supply what channel that message is sent!',
        ephemeral: true,
      });
      return;
    }
    // Display modal to get intro message from the user
    const modal = new ModalBuilder()
      .setCustomId(`"ID":"RR","II":"${interaction.id}"`)
      .setTitle(`${role.name} Introduction`);
    modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder()
      .setCustomId('introduction')
      .setRequired(true)
      .setLabel('Tell us a bit about yourself!')
      .setPlaceholder(`Why do you want to be a ${role.name}?  This will be sent to the channel!`) // eslint-disable-line
      .setMaxLength(2000)
      .setStyle(TextInputStyle.Paragraph)));
    await interaction.showModal(modal);

    // Collect a modal submit interaction
    const filter = (i:ModalSubmitInteraction) => i.customId.startsWith('"ID":"RR"');
    interaction.awaitModalSubmit({ filter, time: 0 })
      .then(async i => {
        log.debug(F, `${JSON.stringify(i.customId)}`);
        const {
          II,
        } = JSON.parse(`{${i.customId}}`);

        log.debug(F, `II: ${II}`);
        log.debug(F, `II: ${II}`);

        if (II !== interaction.id) return;
        if (!i.guild) {
          // log.debug(F, `no guild!`);
          i.reply(guildError);
          return;
        }
        if (!i.member) {
        // log.debug(F, `no member!`);
          i.reply(memberError);
        }

        introMessage = i.fields.getTextInputValue('introduction');
        log.debug(F, `introMessage: ${introMessage}`);

        await target.roles.add(role);
        await i.reply({ content: `Added role ${role.name}`, ephemeral: true });

        const channel = await i.guild?.channels.fetch(IC) as TextChannel;
        channel.send(`${target} has joined as a ${role.name}, please welcome them!\n A little about them:\n\n> ${introMessage}`); // eslint-disable-line
      });
  } else if (IC) {
    const channel = await interaction.guild?.channels.fetch(IC) as TextChannel;
    await target.roles.add(role);
    await interaction.reply({ content: `Added role ${role.name}`, ephemeral: true });
    // Post intro message to the channel
    channel.send(`${target} has joined as a ${role.name}, please welcome them!`);
  } else {
    await target.roles.add(role);
    await interaction.reply({ content: `Added role ${role.name}`, ephemeral: true });
  }

  // const isMod = (interaction.member as GuildMember).roles.cache.has(env.ROLE_MODERATOR);
  // const isTs = (interaction.member as GuildMember).roles.cache.has(env.ROLE_TRIPSITTER);
  // const isDonor = (interaction.member as GuildMember).roles.cache.has(env.ROLE_DONOR);
  // const isPatron = (interaction.member as GuildMember).roles.cache.has(env.ROLE_PATRON);
}
