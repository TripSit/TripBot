/* eslint-disable max-len */
import {
  SlashCommandBuilder,
  ButtonBuilder,
} from 'discord.js';
import {
  ButtonStyle,
} from 'discord-api-types/v10';
import {SlashCommand} from '../../utils/commandDef';
import {embedTemplate} from '../../utils/embedTemplate';
import env from '../../../global/utils/env.config';
import logger from '../../../global/utils/logger';
import {paginationEmbed} from '../../utils/pagination';

import * as path from 'path';
const PREFIX = path.parse(__filename).name;

const button1 = new ButtonBuilder()
    .setCustomId('previousbtn')
    .setLabel('Previous')
    .setStyle(ButtonStyle.Danger);

const button2 = new ButtonBuilder()
    .setCustomId('nextbtn')
    .setLabel('Next')
    .setStyle(ButtonStyle.Success);

const buttonList = [
  button1,
  button2,
];

export const help: SlashCommand = {
  data: new SlashCommandBuilder()
      .setName('help')
      .setDescription('Information bout TripBot Commands'),
  async execute(interaction) {
    logger.debug(`[${PREFIX}] starting!`);

    const globalCommands = await client.application?.commands.fetch();
    const guildCommands = await client.application?.commands.fetch({guildId: env.DISCORD_GUILD_ID});

    /**
     * Gets the description of a command
     * @param {string} commandName
     * @return {string}
     */
    function getDesc(commandName:string):string {
      logger.debug(`[${PREFIX}] getDesc: ${commandName}`);
      const desc = globalCommands?.filter((command) => command.name === commandName).at(0)?.description ??
      guildCommands?.filter((command) => command.name === commandName).at(0)?.description!;
      logger.debug(`[${PREFIX}] getDesc: ${desc}`);
      return desc;
    }

    const hrEmbed = embedTemplate()
        .setTitle('Harm Reduction Modules')
        .addFields(
            {name: 'Drug', value: getDesc('drug'), inline: true},
            {name: 'Combo', value: getDesc('drug'), inline: true},
            {name: 'iDose', value: getDesc('idose'), inline: true},

            {name: 'ComboChart', value: getDesc('drug'), inline: true},
            {name: 'Reagents', value: getDesc('drug'), inline: true},
            {name: 'Calc Psychedelics', value: getDesc('psychedelic_calc'), inline: true},

            {name: 'Calc DXM', value: getDesc('dxm_calc'), inline: true},
            {name: 'Calc Benzos', value: getDesc('benzo_calc'), inline: true},
            {name: 'Calc Ketamine', value: getDesc('ketamine_calc'), inline: true},

            {name: 'Recovery', value: getDesc('recovery'), inline: true},
            {name: 'Breathe', value: getDesc('breathe'), inline: true},
            {name: 'Warmline', value: getDesc('warmline'), inline: true},

            {name: 'KIPP', value: getDesc('kipp'), inline: true},
            {name: 'Hydrate', value: getDesc('hydrate'), inline: true},
            {name: 'EMS', value: getDesc('ems'), inline: true},
        );

    const funEmbed = embedTemplate()
        .setTitle('Other Modules')
        .addFields(
            {name: 'About', value: getDesc('about'), inline: true},
            {name: 'Contact', value: getDesc('contact'), inline: true},
            {name: 'Bug', value: getDesc('bug'), inline: true},

            {name: 'Triptoys', value: getDesc('triptoys'), inline: true},
            {name: 'Imgur', value: getDesc('imgur'), inline: true},
            {name: 'Magick8Ball', value: getDesc('magick8ball'), inline: true},

            {name: 'Urban Define', value: getDesc('urban_define'), inline: true},
            {name: 'Topic', value: getDesc('topic'), inline: true},
            {name: 'Joke', value: getDesc('joke'), inline: true},

            {name: 'Youtube', value: getDesc('youtube'), inline: true},
            {name: 'Coinflip', value: getDesc('coinflip'), inline: true},
            {name: 'Lovebomb', value: getDesc('lovebomb'), inline: true},

            {name: 'Remindme', value: getDesc('remindme'), inline: true},
            {name: 'Convert', value: getDesc('convert'), inline: true},
            {name: 'Poll', value: getDesc('poll'), inline: true},
        );

    const tripsitEmbed = embedTemplate()
        .setTitle('Tripsit-Only Modules')
        .addFields(
            {name: 'TripSit', value: getDesc('tripsit'), inline: true},
            {name: 'Clearchat', value: getDesc('clear-chat'), inline: true},
            {name: 'Bridge', value: getDesc('bridge'), inline: true},

            {name: 'Birthday', value: getDesc('birthday'), inline: true},
            {name: 'Time', value: getDesc('time'), inline: true},
            {name: 'Profile', value: getDesc('profile'), inline: true},

            {name: 'Moderate', value: getDesc('mod'), inline: true},
            {name: 'Report', value: getDesc('report'), inline: true},
        );

    const book = [
      hrEmbed,
      funEmbed,
      tripsitEmbed,
    ];
    paginationEmbed(interaction, book, buttonList, 120000);
    logger.debug(`[${PREFIX}] finished!`);
  },
};
