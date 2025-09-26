import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  Colors,
  MessageFlags,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
} from 'discord.js';
import { SlashCommand } from '../../@types/commandDef';
import commandContext from '../../utils/context';

const F = f(__filename);

export const dH2flow: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('h2flow')
    .setDescription('Welcome to the H2Flow Club!')
    .setIntegrationTypes([0])
    .addBooleanOption(option => option.setName('ephemeral')
      .setDescription('Set to "True" to show the response only to you')) as SlashCommandBuilder,

  async execute(interaction: ChatInputCommandInteraction) {
    log.info(F, await commandContext(interaction));
    const ephemeral = interaction.options.getBoolean('ephemeral') ? MessageFlags.Ephemeral : undefined;
    await interaction.deferReply({ flags: ephemeral });
    const userData = await db.users.upsert({
      where: { discord_id: interaction.user.id },
      create: { discord_id: interaction.user.id },
      update: {},
    });

    const sparklePoints = userData.sparkle_points;
    const movePoints = userData.move_points;
    const lovePoints = userData.empathy_points;
    const totalPoints = sparklePoints + movePoints + lovePoints;

    let platinumClub = 'Non-member =(';
    if (totalPoints >= 1000) platinumClub = 'Diamond Club';
    else if (totalPoints >= 900) platinumClub = 'Ruby Club';
    else if (totalPoints >= 800) platinumClub = 'Sapphire Club';
    else if (totalPoints >= 700) platinumClub = 'Emerald Club';
    else if (totalPoints >= 600) platinumClub = 'Platinum Club';
    else if (totalPoints >= 500) platinumClub = 'Gold Club';
    else if (totalPoints >= 400) platinumClub = 'Silver Club';
    else if (totalPoints >= 300) platinumClub = 'Bronze Club';
    else if (totalPoints >= 200) platinumClub = 'Copper Club';
    else if (totalPoints >= 100) platinumClub = 'Tin Club';
    else if (totalPoints >= 50) platinumClub = 'Aluminum Club';
    else if (totalPoints >= 25) platinumClub = 'Steel Club';
    else if (totalPoints >= 10) platinumClub = 'Iron Club';
    else if (totalPoints >= 5) platinumClub = 'Bronze Club';
    else if (totalPoints >= 1) platinumClub = 'Copper Club';

    await interaction.editReply({
      components: [
        new ContainerBuilder({
          accent_color: Colors.Blue,
          components: [
            new TextDisplayBuilder().setContent(`### ${interaction.user.displayName}'s H2Flow Progress`).toJSON(),
            new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(true).toJSON(),
            new TextDisplayBuilder().setContent([
              `**${Math.floor(sparklePoints / 10)}** 🌊 Aqua Badges 🔰 — ${sparklePoints} sparkle points`,
              `**${Math.floor(lovePoints / 10)}** 💖 Love Cups 🏆 — ${lovePoints} empathy points`,
              `**${Math.floor(movePoints / 10)}** 🏃 Move Medals 🏅 — ${movePoints} active points`,
            ].join('\n')).toJSON(),
            new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true).toJSON(),
            new TextDisplayBuilder().setContent([
              `**Total Points:** ${totalPoints}`,
              `**Club Status:** ${platinumClub}`,
              '*Keep moving, hydrating, and spreading love!*',
            ].join('\n')).toJSON(),
          ],
        }),
      ],
      flags: MessageFlags.IsComponentsV2,
      allowedMentions: { repliedUser: false },
    });

    return false;
  },
};

export default dH2flow;
