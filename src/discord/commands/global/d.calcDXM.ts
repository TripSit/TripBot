/* eslint-disable max-len */
import {
  Colors,
  SlashCommandBuilder,
} from 'discord.js';
import { SlashCommand } from '../../@types/commandDef';
import { calcDxm } from '../../../global/commands/g.calcDxm';
import { startLog } from '../../utils/startLog';
import { embedTemplate } from '../../utils/embedTemplate';

const F = f(__filename);

type DxmDataType = {
  First: { min: number, max: number };
  Second: { min: number, max: number };
  Third: { min: number, max: number };
  Fourth: { min: number, max: number };
};

export default dCalcDXM;

export const dCalcDXM: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('calc_dxm')
    .setDescription('Get DXM dosage information')
    .addNumberOption(option => option.setName('calc_weight')
      .setDescription('How much do you weigh?')
      .setRequired(true))
    .addStringOption(option => option.setName('units')
      .setDescription('In what units?')
      .addChoices(
        { name: 'kg', value: 'kg' },
        { name: 'lbs', value: 'lbs' },
      )
      .setRequired(true))
    .addStringOption(option => option.setName('taking')
      // eslint-disable-next-line max-len
      .setDescription('What are you taking? All products listed here contain DXM hBr as the sole active ingredient.')
      .addChoices(
        { name: 'RoboTablets (30 mg tablets)', value: 'RoboTablets (30 mg tablets)' },
        { name: 'RoboCough (ml)', value: 'RoboCough (ml)' },
        { name: 'Robitussin DX (oz)', value: 'Robitussin DX (oz)' },
        { name: 'Robitussin DX (ml)', value: 'Robitussin DX (ml)' },
        { name: 'Robitussin Gelcaps (15 mg caps)', value: 'Robitussin Gelcaps (15 mg caps)' },
        { name: 'Pure (mg)', value: 'Pure (mg)' },
        { name: '30mg Gelcaps (30 mg caps)', value: '30mg Gelcaps (30 mg caps)' },
      )
      .setRequired(true))
    .addBooleanOption(option => option.setName('ephemeral')
      .setDescription('Set to "True" to show the response only to you')),
  async execute(interaction) {
    const startTime = new Date().getTime();
    // log.info(F, `Command started at ${startTime}`);
    startLog(F, interaction);
    // log.info(F, `Printed startlog in ${new Date().getTime() - startTime}ms`);
    // const deferTime = new Date().getTime();
    // log.info(F, `Started Defer reply at ${deferTime}`);
    await interaction.deferReply({ ephemeral: (interaction.options.getBoolean('ephemeral') === true) });
    // log.info(F, `Defer reply took ${new Date().getTime() - deferTime}ms`);
    // Calculate each plat min/max value
    const givenWeight = interaction.options.getNumber('calc_weight', true);
    const weightUnits = interaction.options.getString('units', true);
    const taking = interaction.options.getString('taking', true);

    const results = await calcDxm(givenWeight, weightUnits, taking);
    const dosageData = results.data as DxmDataType;
    const { units } = results;

    const embed = embedTemplate()
      .setColor(Colors.Purple)
      .setTitle('DXM Dosages')
      .setDescription(`For a ${givenWeight}${weightUnits} individual taking ${taking}`);
    let header = true;
    Object.keys(dosageData).forEach(key => {
      embed.addFields(
        { name: `${header ? 'Plateau' : '\u200B'}`, value: `**${key}**`, inline: true },
        { name: `${header ? 'Minimum' : '\u200B'}`, value: `${dosageData[key as keyof DxmDataType].min} ${units}`, inline: true },
        { name: `${header ? 'Maximum' : '\u200B'}`, value: `${dosageData[key as keyof DxmDataType].max} ${units}`, inline: true },
      );
      header = false;
    });
    await interaction.editReply({ embeds: [embed] });
    log.info(F, `Command finished in ${new Date().getTime() - startTime}ms`);
    return true;
  },
};
