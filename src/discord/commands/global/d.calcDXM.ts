/* eslint-disable max-len */
import {
  Colors,
  SlashCommandBuilder,
} from 'discord.js';
import {SlashCommand1} from '../../@types/commandDef';
import {calcDxm} from '../../../global/commands/g.calcDxm';
import {embedTemplate} from '../../utils/embedTemplate';
// import logger from '../../../global/utils/logger';
// import * as path from 'path';
// const PREFIX = path.parse(__filename).name;

type DxmDataType = {
  First: {min: number, max: number};
  Second: {min: number, max: number};
  Third: {min: number, max: number};
  Fourth: {min: number, max: number};
};

export const calxDXM: SlashCommand1 = {
  data: new SlashCommandBuilder()
    .setName('calc_dxm')
    .setDescription('Get DXM dosage information')
    .addNumberOption((option) => option.setName('calc_weight')
      .setDescription('How much do you weigh?')
      .setRequired(true))
    .addStringOption((option) => option.setName('units')
      .setDescription('In what units?')
      .setRequired(true)
      .addChoices(
        {name: 'kg', value: 'kg'},
        {name: 'lbs', value: 'lbs'},
      ))
    .addStringOption((option) => option.setName('taking')
    // eslint-disable-next-line max-len
      .setDescription('What are you taking? All products listed here contain DXM hBr as the sole active ingredient.')
      .setRequired(true)
      .addChoices(
        {name: 'RoboTablets (30 mg tablets)', value: 'RoboTablets (30 mg tablets)'},
        {name: 'RoboCough (ml)', value: 'RoboCough (ml)'},
        {name: 'Robitussin DX (oz)', value: 'Robitussin DX (oz)'},
        {name: 'Robitussin DX (ml)', value: 'Robitussin DX (ml)'},
        {name: 'Robitussin Gelcaps (15 mg caps)', value: 'Robitussin Gelcaps (15 mg caps)'},
        {name: 'Pure (mg)', value: 'Pure (mg)'},
        {name: '30mg Gelcaps (30 mg caps)', value: '30mg Gelcaps (30 mg caps)'},
      )),
  async execute(interaction) {
    // Calculate each plat min/max value
    const givenWeight = interaction.options.getNumber('calc_weight')!;
    const weightUnits = interaction.options.getString('units')!;
    const taking = interaction.options.getString('taking')!;


    const results = await calcDxm(givenWeight, weightUnits, taking);
    const dosageData = results[0] as DxmDataType;
    const units = results[1] as string;

    const embed = embedTemplate()
      .setColor(Colors.Purple)
      .setTitle(`DXM Dosages`)
      .setDescription(`For a ${givenWeight}${weightUnits} individual taking ${taking}`);
    let header = true;
    Object.keys(dosageData).forEach((key) => {
      embed.addFields(
        {name: `${header ? 'Plateau' : '\u200B'}`, value: `**${key}**`, inline: true},
        {name: `${header ? 'Minimum' : '\u200B'}`, value: `${dosageData[key as keyof DxmDataType].min} ${units}`, inline: true},
        {name: `${header ? 'Maximum' : '\u200B'}`, value: `${dosageData[key as keyof DxmDataType].max} ${units}`, inline: true},
      );
      header = false;
    });
    interaction.reply({embeds: [embed], ephemeral: false});
    // logger.debug(`[${PREFIX}] finished!`);
    return true;
  },
};
