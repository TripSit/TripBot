import {
  SlashCommandBuilder,
  GuildMember,
  MessageFlags,
} from 'discord.js';
import { SlashCommand } from '../../@types/commandDef';
import commandContext from '../../utils/context';
import { embedTemplate } from '../../utils/embedTemplate';
// import log from '../../../global/utils/log';

const F = f(__filename);

// const karmaQuotes = require('../../../global/assets/data/karma_quotes.json');

export const dKarma: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('karma')
    .setDescription('Get someone\'s karma!')
    .setIntegrationTypes([0])
    .addUserOption(option => option
      .setName('target')
      .setDescription('User to lookup'))
    .addBooleanOption(option => option.setName('ephemeral')
      .setDescription('Set to "True" to show the response only to you')) as SlashCommandBuilder,
  async execute(interaction) {
    log.info(F, await commandContext(interaction));
    const ephemeral = interaction.options.getBoolean('ephemeral') ? MessageFlags.Ephemeral : undefined;
    await interaction.deferReply({ flags: ephemeral });
    const member = interaction.options.getMember('target')
      ? interaction.options.getMember('target') as GuildMember
      : interaction.member as GuildMember;

    const userData = await db.users.upsert({
      where: {
        discord_id: member.id,
      },
      create: {
        discord_id: member.id,
      },
      update: {},
    });

    const message = `${member.displayName} has received ${userData.karma_received} karma and given ${userData.karma_given} karma`; // eslint-disable-line max-len

    // const quote = karmaQuotes[Math.floor(Math.random() * karmaQuotes.length)];
    const embed = embedTemplate()
      .setTitle(message);
      // .setFooter({text: `${quote}`});
    await interaction.editReply({ embeds: [embed] });
    return true;
  },
};

export default dKarma;
