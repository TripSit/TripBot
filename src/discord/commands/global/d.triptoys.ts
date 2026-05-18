/* eslint-disable max-len */
import {
  MessageFlags,
  SlashCommandBuilder,
} from 'discord.js';
import { SlashCommand } from '../../@types/commandDef';
import commandContext from '../../utils/context';
import { embedTemplate } from '../../utils/embedTemplate';
import { t, getLocale, getCommandLocalizations } from '../../../i18n/index';
// import log from '../../../global/utils/log';
const F = f(__filename);

const weavesilk = 'Weavesilk';
const arkadia = 'Arkadia';
const chromoscope = 'Chromoscope';
const plink = 'Plink';
const puddle = 'Puddle';
const helloenjoy = 'Hello Enjoy';
const softmurmur = 'Soft Murmur';
// const mandala = 'Draw A 3D Mandala';
const waytogo = 'A Way To Go';
const waterphysics = 'Water physics';
const patterns = 'Patterns';
const strobe = 'Strobe';
const lights = 'Lights';
const patapap = 'Patapap';
const triangle = 'Triangle';
const neonflames = 'Neon Flames';
const fluids = 'Fluids';
const particledream = 'Particle Dream';
const cosmicsymbolism = 'Cosmic Symbolism';
const hopalong = 'Hop Along';
const mynoise = 'MyNoise.net';
const mrdoobharmony = 'Mr Doob Harmony';
const ballsdemo = 'Balls demo';

export const dTriptoys: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('triptoys')
    .setNameLocalizations(getCommandLocalizations('triptoys', 'commandName'))
    .setDescription('Fun toys to play with!')
    .setDescriptionLocalizations(getCommandLocalizations('triptoys', 'commandDescription'))
    .setIntegrationTypes([0])
    .addStringOption(option => option.setName('toy')
      .setDescription(t('en', 'triptoys', 'toyOption'))
      .setDescriptionLocalizations(getCommandLocalizations('triptoys', 'toyOption'))
      .addChoices(
        { name: 'All', value: '25' },
        { name: 'Random', value: '24' },
        { name: weavesilk, value: '1' },
        { name: arkadia, value: '2' },
        { name: chromoscope, value: '3' },
        { name: plink, value: '4' },
        { name: puddle, value: '5' },
        { name: helloenjoy, value: '6' },
        { name: softmurmur, value: '7' },
        // { name: mandala, value: '8' },
        { name: waytogo, value: '9' },
        { name: waterphysics, value: '10' },
        { name: patterns, value: '11' },
        { name: strobe, value: '12' },
        { name: lights, value: '13' },
        { name: patapap, value: '14' },
        { name: triangle, value: '15' },
        { name: neonflames, value: '16' },
        { name: fluids, value: '17' },
        { name: particledream, value: '18' },
        { name: cosmicsymbolism, value: '19' },
        { name: hopalong, value: '20' },
        { name: mynoise, value: '21' },
        { name: mrdoobharmony, value: '22' },
        { name: ballsdemo, value: '23' },
      ))
    .addBooleanOption(option => option.setName('ephemeral')
      .setDescription(t('en', 'triptoys', 'ephemeralOption'))
      .setDescriptionLocalizations(getCommandLocalizations('triptoys', 'ephemeralOption'))) as SlashCommandBuilder,
  async execute(interaction) {
    log.info(F, await commandContext(interaction));
    const locale = await getLocale(interaction, 'triptoys');
    const ephemeral = interaction.options.getBoolean('ephemeral') ? MessageFlags.Ephemeral : undefined;
    await interaction.deferReply({ flags: ephemeral });
    const toyName = interaction.options.getString('toy') || '25';
    const toyId = parseInt(toyName, 10);
    // log.debug(F, `toy_name: ${toyName}`);

    const toys = {
      1: { name: t(locale, 'triptoys', 'weavesilk'), value: t(locale, 'triptoys', 'weavesilkDesc'), inline: true },
      2: { name: t(locale, 'triptoys', 'arkadia'), value: t(locale, 'triptoys', 'arkadiaDesc'), inline: true },
      3: { name: t(locale, 'triptoys', 'chromoscope'), value: t(locale, 'triptoys', 'chromoscopeDesc'), inline: true },
      4: { name: t(locale, 'triptoys', 'plink'), value: t(locale, 'triptoys', 'plinkDesc'), inline: true },
      5: { name: t(locale, 'triptoys', 'puddle'), value: t(locale, 'triptoys', 'puddleDesc'), inline: true },
      6: { name: t(locale, 'triptoys', 'helloenjoy'), value: t(locale, 'triptoys', 'helloenjoyDesc'), inline: true },
      7: { name: t(locale, 'triptoys', 'softmurmur'), value: t(locale, 'triptoys', 'softmurmurDesc'), inline: true },
      8: { name: t(locale, 'triptoys', 'patterns'), value: t(locale, 'triptoys', 'patternDesc'), inline: true },
      9: { name: t(locale, 'triptoys', 'waytogo'), value: t(locale, 'triptoys', 'waytogoDesc'), inline: true },
      10: { name: t(locale, 'triptoys', 'waterphysics'), value: t(locale, 'triptoys', 'waterphysicsDesc'), inline: true },
      11: { name: t(locale, 'triptoys', 'patterns'), value: t(locale, 'triptoys', 'patternDesc'), inline: true },
      12: { name: t(locale, 'triptoys', 'strobe'), value: t(locale, 'triptoys', 'strobeDesc'), inline: true },
      13: { name: t(locale, 'triptoys', 'lights'), value: t(locale, 'triptoys', 'lightsDesc'), inline: true },
      14: { name: t(locale, 'triptoys', 'patapap'), value: t(locale, 'triptoys', 'patapapDesc'), inline: true },
      15: { name: t(locale, 'triptoys', 'triangle'), value: t(locale, 'triptoys', 'triangleDesc'), inline: true },
      16: { name: t(locale, 'triptoys', 'neonflames'), value: t(locale, 'triptoys', 'neonflamesDesc'), inline: true },
      17: { name: t(locale, 'triptoys', 'fluids'), value: t(locale, 'triptoys', 'fluidsDesc'), inline: true },
      18: { name: t(locale, 'triptoys', 'particledream'), value: t(locale, 'triptoys', 'particledreamDesc'), inline: true },
      19: { name: t(locale, 'triptoys', 'cosmicsymbolism'), value: t(locale, 'triptoys', 'cosmicsymbolismDesc'), inline: true },
      20: { name: t(locale, 'triptoys', 'hopalong'), value: t(locale, 'triptoys', 'hopalongDesc'), inline: true },
      21: { name: t(locale, 'triptoys', 'mynoise'), value: t(locale, 'triptoys', 'mynoiseDesc'), inline: true },
      22: { name: t(locale, 'triptoys', 'mrdoobharmony'), value: t(locale, 'triptoys', 'mrdoobharmonyDesc'), inline: true },
      23: { name: t(locale, 'triptoys', 'ballsdemo'), value: t(locale, 'triptoys', 'ballsdemoDesc'), inline: true },
    };

    const embed = embedTemplate();

    if (toyId < 24) {
      embed.addFields(toys[toyId as keyof typeof toys]);
    }

    if (toyId === 24) {
      // Get a random toy from the toy_dict dictionary
      const randomIndex = Math.floor(Math.random() * Object.keys(toys).length);
      // Get a random toy
      const randomToy = toys[randomIndex as keyof typeof toys];
      // log.debug(F, `random_toy: ${JSON.stringify(randomToy, null, 2)}`);
      embed.addFields(randomToy);
    }

    if (toyId === 25) {
      embed.setTitle(t(locale, 'triptoys', 'allToysTitle'));
      embed.addFields(
        { name: t(locale, 'triptoys', 'weavesilk'), value: t(locale, 'triptoys', 'weavesilkDesc'), inline: true },
        { name: t(locale, 'triptoys', 'arkadia'), value: t(locale, 'triptoys', 'arkadiaDesc'), inline: true },
        { name: t(locale, 'triptoys', 'chromoscope'), value: t(locale, 'triptoys', 'chromoscopeDesc'), inline: true },
        { name: t(locale, 'triptoys', 'plink'), value: t(locale, 'triptoys', 'plinkDesc'), inline: true },
        { name: t(locale, 'triptoys', 'puddle'), value: t(locale, 'triptoys', 'puddleDesc'), inline: true },
        { name: t(locale, 'triptoys', 'helloenjoy'), value: t(locale, 'triptoys', 'helloenjoyDesc'), inline: true },
        { name: t(locale, 'triptoys', 'softmurmur'), value: t(locale, 'triptoys', 'softmurmurDesc'), inline: true },
        { name: t(locale, 'triptoys', 'patterns'), value: t(locale, 'triptoys', 'patternDesc'), inline: true },
        { name: t(locale, 'triptoys', 'waytogo'), value: t(locale, 'triptoys', 'waytogoDesc'), inline: true },
        { name: t(locale, 'triptoys', 'waterphysics'), value: t(locale, 'triptoys', 'waterphysicsDesc'), inline: true },
        { name: t(locale, 'triptoys', 'strobe'), value: t(locale, 'triptoys', 'strobeDesc'), inline: true },
        { name: t(locale, 'triptoys', 'lights'), value: t(locale, 'triptoys', 'lightsDesc'), inline: true },
        { name: t(locale, 'triptoys', 'patapap'), value: t(locale, 'triptoys', 'patapapDesc'), inline: true },
        { name: t(locale, 'triptoys', 'triangle'), value: t(locale, 'triptoys', 'triangleDesc'), inline: true },
        { name: t(locale, 'triptoys', 'neonflames'), value: t(locale, 'triptoys', 'neonflamesDesc'), inline: true },
        { name: t(locale, 'triptoys', 'fluids'), value: t(locale, 'triptoys', 'fluidsDesc'), inline: true },
        { name: t(locale, 'triptoys', 'particledream'), value: t(locale, 'triptoys', 'particledreamDesc'), inline: true },
        { name: t(locale, 'triptoys', 'cosmicsymbolism'), value: t(locale, 'triptoys', 'cosmicsymbolismDesc'), inline: true },
        { name: t(locale, 'triptoys', 'hopalong'), value: t(locale, 'triptoys', 'hopalongDesc'), inline: true },
        { name: t(locale, 'triptoys', 'mynoise'), value: t(locale, 'triptoys', 'mynoiseDesc'), inline: true },
        { name: t(locale, 'triptoys', 'mrdoobharmony'), value: t(locale, 'triptoys', 'mrdoobharmonyDesc'), inline: true },
        { name: t(locale, 'triptoys', 'ballsdemo'), value: t(locale, 'triptoys', 'ballsdemoDesc'), inline: true },
      );
    }

    await interaction.editReply({ embeds: [embed] });
    return true;
  },
};

export default dTriptoys;
