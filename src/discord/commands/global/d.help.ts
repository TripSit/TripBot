/* eslint-disable max-len */
import {
  SlashCommandBuilder,
  ButtonBuilder,
} from 'discord.js';
import {
  ButtonStyle,
} from 'discord-api-types/v10';
import { SlashCommand } from '../../@types/commandDef';
import { embedTemplate } from '../../utils/embedTemplate';
import { startLog } from '../../utils/startLog';
import { paginationEmbed } from '../../utils/pagination';

const F = f(__filename);

const previousButton = new ButtonBuilder()
  .setCustomId('previousButton')
  .setLabel('Previous')
  .setStyle(ButtonStyle.Danger);

const nextButton = new ButtonBuilder()
  .setCustomId('nextButton')
  .setLabel('Next')
  .setStyle(ButtonStyle.Success);

const buttonList = [
  previousButton,
  nextButton,
];

export const dHelp: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Information about TripBot Commands')
    .addBooleanOption(option => option.setName('ephemeral')
      .setDescription('Set to "True" to show the response only to you')),

  async execute(interaction) {
    startLog(F, interaction);
    await interaction.deferReply({ ephemeral: (interaction.options.getBoolean('ephemeral') === true) });

    const globalCommands = await interaction.client.application.commands.fetch();
    const guildCommands = await interaction.client.application.commands.fetch({ guildId: env.DISCORD_GUILD_ID });

    function getDesc(commandName:string):string | undefined {
      // log.debug(F, `getDesc: ${commandName}`);
      if (!globalCommands || !guildCommands) return undefined;
      // log.debug(F, `getDesc: ${desc}`);
      return globalCommands.filter(command => command.name === commandName).at(0)?.description
      ?? guildCommands.filter(command => command.name === commandName).at(0)?.description;
    }

    if (getDesc('drug') === undefined) {
      log.error(F, 'getDesc(\'drug\') is undefined');
      return false;
    }

    const hrEmbed = embedTemplate();
    hrEmbed.setTitle('Harm Reduction Modules');
    hrEmbed.addFields({ name: 'Drug', value: getDesc('drug') ?? '', inline: true });
    hrEmbed.addFields({ name: 'Combo', value: getDesc('drug') ?? '', inline: true });
    hrEmbed.addFields({ name: 'iDose', value: getDesc('idose') ?? '', inline: true });
    hrEmbed.addFields({ name: 'ComboChart', value: getDesc('drug') ?? '', inline: true });
    hrEmbed.addFields({ name: 'Reagents', value: getDesc('drug') ?? '', inline: true });
    hrEmbed.addFields({ name: 'Calc Psychedelics', value: getDesc('calc_psychedelics') ?? '', inline: true });
    hrEmbed.addFields({ name: 'Calc DXM', value: getDesc('calc_dxm') ?? '', inline: true });
    hrEmbed.addFields({ name: 'Calc Benzos', value: getDesc('calc_benzo') ?? '', inline: true });
    hrEmbed.addFields({ name: 'Calc Ketamine', value: getDesc('calc_ketamine') ?? '', inline: true });
    hrEmbed.addFields({ name: 'Recovery', value: getDesc('recovery') ?? '', inline: true });
    hrEmbed.addFields({ name: 'Breathe', value: getDesc('breathe') ?? '', inline: true });
    hrEmbed.addFields({ name: 'Warmline', value: getDesc('warmline') ?? '', inline: true });
    hrEmbed.addFields({ name: 'KIPP', value: getDesc('kipp') ?? '', inline: true });
    hrEmbed.addFields({ name: 'Hydrate', value: getDesc('hydrate') ?? '', inline: true });
    hrEmbed.addFields({ name: 'Crisis', value: getDesc('crisis') ?? '', inline: true });

    const funEmbed = embedTemplate();
    funEmbed.setTitle('Other Modules');
    funEmbed.addFields({ name: 'About', value: getDesc('about') ?? '', inline: true });
    funEmbed.addFields({ name: 'Contact', value: getDesc('contact') ?? '', inline: true });
    funEmbed.addFields({ name: 'Feedback', value: getDesc('feedback') ?? '', inline: true });
    funEmbed.addFields({ name: 'Triptoys', value: getDesc('triptoys') ?? '', inline: true });
    funEmbed.addFields({ name: 'Imgur', value: getDesc('imgur') ?? '', inline: true });
    funEmbed.addFields({ name: 'Magick8Ball', value: getDesc('magick8ball') ?? '', inline: true });
    // funEmbed.addFields({ name: 'Urban Define', value: getDesc('urban_define') ?? '', inline: true });
    funEmbed.addFields({ name: 'Topic', value: getDesc('topic') ?? '', inline: true });
    funEmbed.addFields({ name: 'Joke', value: getDesc('joke') ?? '', inline: true });
    // funEmbed.addFields({ name: 'Youtube', value: getDesc('youtube') ?? '', inline: true });
    funEmbed.addFields({ name: 'Coinflip', value: getDesc('coinflip') ?? '', inline: true });
    funEmbed.addFields({ name: 'Lovebomb', value: getDesc('lovebomb') ?? '', inline: true });
    funEmbed.addFields({ name: 'Remindme', value: getDesc('remind_me') ?? '', inline: true });
    funEmbed.addFields({ name: 'Convert', value: getDesc('convert') ?? '', inline: true });
    funEmbed.addFields({ name: 'Poll', value: getDesc('poll') ?? '', inline: true });
    // funEmbed.addFields({name: 'Youtube', value: getDesc('youtube'), inline: true});

    const tripsitEmbed = embedTemplate();
    tripsitEmbed.setTitle('Tripsit-Only Modules');
    // tripsitEmbed.addFields({name: 'TripSit', value: getDesc('tripsit'), inline: true});
    tripsitEmbed.addFields({ name: 'Clearchat', value: getDesc('clear-chat') ?? '', inline: true });
    tripsitEmbed.addFields({ name: 'Birthday', value: getDesc('birthday') ?? '', inline: true });
    tripsitEmbed.addFields({ name: 'Timezone', value: getDesc('timezone') ?? '', inline: true });
    tripsitEmbed.addFields({ name: 'Profile', value: getDesc('profile') ?? '', inline: true });
    tripsitEmbed.addFields({ name: 'Moderate', value: getDesc('mod') ?? '', inline: true });
    tripsitEmbed.addFields({ name: 'Report', value: getDesc('report') ?? '', inline: true });

    const book = [
      hrEmbed,
      funEmbed,
      tripsitEmbed,
    ];
    paginationEmbed(interaction, book, buttonList, 0);
    return true;
  },
};

export default dHelp;
