import { MessageFlags, SlashCommandBuilder } from 'discord.js';

import type { SlashCommand } from '../../@types/commandDef';

import commandContext from '../../utils/context';
import { embedTemplate } from '../../utils/embedTemplate';
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
    .setDescription('Fun toys to play with!')
    .setIntegrationTypes([0])
    .addStringOption((option) =>
      option.setName('toy').setDescription('Which toy?').addChoices(
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
      ),
    )
    .addBooleanOption((option) =>
      option.setName('ephemeral').setDescription('Set to "True" to show the response only to you'),
    ) as SlashCommandBuilder,
  async execute(interaction) {
    log.info(F, await commandContext(interaction));
    const ephemeral = interaction.options.getBoolean('ephemeral')
      ? MessageFlags.Ephemeral
      : undefined;
    await interaction.deferReply({ flags: ephemeral });
    const toyName = interaction.options.getString('toy') || '25';
    const toyId = Number.parseInt(toyName, 10);
    // log.debug(F, `toy_name: ${toyName}`);

    const toys = {
      1: { inline: true, name: weavesilk, value: '[Generate art](http://weavesilk.com/)' },
      2: {
        inline: true,
        name: arkadia,
        value: '[Never ending psychedelic forest](https://arkadia.xyz/)',
      },
      3: {
        inline: true,
        name: chromoscope,
        value: '[Explore the night sky](http://www.chromoscope.net/)',
      },
      4: {
        inline: true,
        name: plink,
        value: '[Multiplayer music maker](http://dinahmoelabs.com/_plink/)',
      },
      5: {
        inline: true,
        name: puddle,
        value: '[Interact with paint-like soundwaves](http://iridescentpuddle.com/)',
      },
      6: {
        inline: true,
        name: helloenjoy,
        value: '[Colorful game with music](https://helloenjoy.itch.io/hellorun)',
      },
      7: {
        inline: true,
        name: softmurmur,
        value: '[Create your own mix of background noise](https://asoftmurmur.com/)',
      },
      8: {
        inline: true,
        name: patterns,
        value: '[Check out different patterns!](https://csh.bz/)',
      },
      9: {
        inline: true,
        name: waytogo,
        value:
          '[Draw lines and walk through a forest while creating music](http://a-way-to-go.com/)',
      },
      10: {
        inline: true,
        name: waterphysics,
        value: '[Create music by clicking dots on the roster](https://madebyevan.com/webgl-water/)',
      },
      11: { inline: true, name: patterns, value: "[Chris Shier's animations](https://csh.bz/)" },
      12: {
        inline: true,
        name: strobe,
        value:
          '[Stare at the middle for 30 seconds for to experience an optical illusion](https://strobe.cool/)',
      },
      13: {
        inline: true,
        name: lights,
        value:
          "[Musical experience to the tunes of Ellie Goulding's Lights](https://helloenjoy.itch.io/lights)",
      },
      14: {
        inline: true,
        name: patapap,
        value:
          '[Press random keys on your keyboard for a musical and visual experience](https://www.patatap.com/)',
      },
      15: {
        inline: true,
        name: triangle,
        value:
          '[Click your mouse for flashy triangles (warning:loud music)](https://lhbzr.com/experiments/triangles/)',
      },
      16: {
        inline: true,
        name: neonflames,
        value:
          '[Draw nebula like art (many options in top right corner)](https://29a.ch/sandbox/2011/neonflames/#)',
      },
      17: {
        inline: true,
        name: fluids,
        value:
          '[Colorful physics demonstration of fluid](https://haxiomic.github.io/GPU-Fluid-Experiments/html5/?q=High)',
      },
      18: {
        inline: true,
        name: particledream,
        value:
          '[Move at changeable speed through colorful fractals that never end](http://www.iamnop.com/particles/)',
      },
      19: {
        inline: true,
        name: cosmicsymbolism,
        value:
          '[Never ending cosmic zooming experience (click and drag for speed)](https://www.cosmic-symbolism.com/)',
      },
      20: {
        inline: true,
        name: hopalong,
        value:
          '[A never ending orbits visualizer. Use keys and mouse to increase speed and angle](http://iacopoapps.appspot.com/hopalongwebgl/)',
      },
      21: {
        inline: true,
        name: mynoise,
        value:
          '[Ambient noise generator with a variety of themes from rain to black holes to busy cafe to kitten purrs.](https://mynoise.net/)',
      },
      22: {
        inline: true,
        name: mrdoobharmony,
        value:
          '[Make art by sketching with different materials and colors (many more triptoys at the top of the page)](https://mrdoob.com/#/120/harmony)',
      },
      23: {
        inline: true,
        name: ballsdemo,
        value:
          '[Colorful balls that follow your mouse (Enable fullscreen for best effect)](https://testdrive-archive.azurewebsites.net/Graphics/TouchEffects/Default.html)',
      },
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
      embed.setTitle('Triptoys!');
      embed.addFields(
        { inline: true, name: weavesilk, value: '[Generate art](http://weavesilk.com/)' },
        {
          inline: true,
          name: arkadia,
          value: '[Never ending psychedelic forest](https://arkadia.xyz/)',
        },
        {
          inline: true,
          name: chromoscope,
          value: '[Explore the night sky](http://www.chromoscope.net/)',
        },
        {
          inline: true,
          name: plink,
          value: '[Multiplayer music maker](http://dinahmoelabs.com/_plink/)',
        },
        {
          inline: true,
          name: puddle,
          value: '[Interact with paint-like soundwaves](http://iridescentpuddle.com/)',
        },
        {
          inline: true,
          name: helloenjoy,
          value: '[Colorful game with music](https://helloenjoy.itch.io/hellorun)',
        },
        {
          inline: true,
          name: softmurmur,
          value: '[Create your own mix of background noise](https://asoftmurmur.com/)',
        },
        { inline: true, name: patterns, value: '[Check out different patterns!](https://csh.bz/)' },
        {
          inline: true,
          name: waytogo,
          value:
            '[Draw lines and walk through a forest while creating music](http://a-way-to-go.com/)',
        },
        {
          inline: true,
          name: waterphysics,
          value:
            '[Create music by clicking dots on the roster](https://madebyevan.com/webgl-water/)',
        },
        {
          inline: true,
          name: strobe,
          value:
            '[Stare at the middle for 30 seconds for to experience an optical illusion](https://strobe.cool/)',
        },
        {
          inline: true,
          name: lights,
          value:
            "[Musical experience to the tunes of Ellie Goulding's Lights](https://helloenjoy.itch.io/lights)",
        },
        {
          inline: true,
          name: patapap,
          value:
            '[Press random keys on your keyboard for a musical and visual experience](https://www.patatap.com/)',
        },
        {
          inline: true,
          name: triangle,
          value:
            '[Click your mouse for flashy triangles (warning:loud music)](https://lhbzr.com/experiments/triangles/)',
        },
        {
          inline: true,
          name: neonflames,
          value:
            '[Draw nebula like art (many options in top right corner)](https://29a.ch/sandbox/2011/neonflames/#)',
        },
        {
          inline: true,
          name: fluids,
          value:
            '[Colorful physics demonstration of fluid](https://haxiomic.github.io/GPU-Fluid-Experiments/html5/?q=High)',
        },
        {
          inline: true,
          name: particledream,
          value:
            '[Move at changeable speed through colorful fractals that never end](http://www.iamnop.com/particles/)',
        },
        {
          inline: true,
          name: cosmicsymbolism,
          value:
            '[Never ending cosmic zooming experience (click and drag for speed)](https://www.cosmic-symbolism.com/)',
        },
        {
          inline: true,
          name: hopalong,
          value:
            '[A never ending orbits visualizer. Use keys and mouse to increase speed and angle](http://iacopoapps.appspot.com/hopalongwebgl/)',
        },
        {
          inline: true,
          name: mynoise,
          value:
            '[Ambient noise generator with a variety of themes from rain to black holes to busy cafe to kitten purrs.](https://mynoise.net/)',
        },
        {
          inline: true,
          name: mrdoobharmony,
          value:
            '[Make art by sketching with different materials and colors (many more triptoys at the top of the page)](https://mrdoob.com/#/120/harmony)',
        },
        {
          inline: true,
          name: ballsdemo,
          value:
            '[Colorful balls that follow your mouse (Enable fullscreen for best effect)](https://testdrive-archive.azurewebsites.net/Graphics/TouchEffects/Default.html)',
        },
      );
    }

    await interaction.editReply({ embeds: [embed] });
    return true;
  },
};

export default dTriptoys;
