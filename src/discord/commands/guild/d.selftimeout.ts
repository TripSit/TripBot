import type { ChatInputCommandInteraction, GuildMember, TextChannel } from 'discord.js';

import { MessageFlags, SlashCommandBuilder } from 'discord.js';

import type { SlashCommand } from '../../@types/commandDef';

import { parseDuration } from '../../../global/utils/parseDuration';
import commandContext from '../../utils/context';

const F = f(__filename);
export const selfTimeout: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('selftimeout')
    .setDescription('Timeout yourself!')
    .setIntegrationTypes([0])
    .addStringOption((option) =>
      option.setName('duration').setDescription('How long? Max is 2 weeks!').setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName('confirmation')
        .setDescription('Are you sure? You cannot undo this!')
        .addChoices(
          { name: "Yes, I won't ask a mod to undo.", value: 'yes' },
          { name: "No, I'm just testing.", value: 'no' },
        )
        .setRequired(true),
    ) as SlashCommandBuilder,
  async execute(interaction: ChatInputCommandInteraction) {
    log.info(F, await commandContext(interaction));
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    if (!interaction.guild) {
      return false;
    }

    const confirmation = interaction.options.getString('confirmation');

    if (confirmation === 'no') {
      await interaction.editReply({
        content: "This works exactly like you think it does, try again when you're sure!",
      });
      return false;
    }

    const target = interaction.member as GuildMember;
    const duration = interaction.options.getString('duration');

    const durationValue = await parseDuration(`${duration}`);

    await target.timeout(durationValue, 'Self timeout');

    await interaction.editReply({ content: `We'll see you in ${duration}!` });

    const tripsitGuild = await interaction.client.guilds.fetch(env.DISCORD_GUILD_ID);
    const moduleLog = (await tripsitGuild.channels.fetch(env.CHANNEL_MODLOG)) as TextChannel;
    await moduleLog.send(`**${target.user.tag}** self timed out for **${duration}**!`);

    return true;
  },
};

export default selfTimeout;
