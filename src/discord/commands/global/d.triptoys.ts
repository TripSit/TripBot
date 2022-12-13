/* eslint-disable max-len */
import {
  SlashCommandBuilder,
} from 'discord.js';
import { SlashCommand } from '../../@types/commandDef';
import { startLog } from '../../utils/startLog';
import { embedTemplate } from '../../utils/embedTemplate';
// import log from '../../../global/utils/log';
const F = f(__filename);

export default dTriptoys;

const weavesilk = 'Weavesilk';
const arkadia = 'Arkadia';
const chromoscope = 'Chromoscope';
const plink = 'Plink';
const puddle = 'Puddle';
const helloenjoy = 'Hello Enjoy';
const softmurmur = 'Soft Murmur';
const mandala = 'Draw A 3D Mandala';
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
    .addStringOption(option => option.setName('toy')
      .setDescription('Which toy?')
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
        { name: mandala, value: '8' },
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
      )),
  async execute(interaction) {
    startLog(F, interaction);
    const toyName = interaction.options.getString('toy') || '25';
    const toyId = parseInt(toyName, 10);
    // log.debug(F, `toy_name: ${toyName}`);

    const toys = {
      1: { name: weavesilk, value: '[Generate art](http://weavesilk.com/)', inline: true },
      2: { name: arkadia, value: '[Never ending psychedelic forest](https://arkadia.xyz/)', inline: true },
      3: { name: chromoscope, value: '[Explore the night sky](http://www.chromoscope.net/)', inline: true },
      4: { name: plink, value: '[Multiplayer music maker](http://dinahmoelabs.com/_plink/)', inline: true },
      5: { name: puddle, value: '[Interact with paint-like soundwaves](http://iridescentpuddle.com/)', inline: true },
      6: { name: helloenjoy, value: '[Colorful game with music](https://helloenjoy.itch.io/hellorun)', inline: true },
      7: { name: softmurmur, value: '[Create your own mix of background noise](https://asoftmurmur.com/)', inline: true },
      8: { name: mandala, value: '[Draw a mandala with different colors in 3d](https://askalice.me/mandala)', inline: true },
      9: { name: waytogo, value: '[Draw lines and walk through a forest while creating music](http://a-way-to-go.com/)', inline: true },
      10: { name: waterphysics, value: '[Create music by clicking dots on the roster](https://madebyevan.com/webgl-water/)', inline: true },
      11: { name: patterns, value: '[Chris Shier\'s animations](https://csh.bz/)', inline: true },
      12: { name: strobe, value: '[Stare at the middle for 30 seconds for to experience an optical illusion](https://strobe.cool/)', inline: true },
      13: { name: lights, value: '[Musical experience to the tunes of Ellie Goulding\'s Lights](https://helloenjoy.itch.io/lights)', inline: true },
      14: { name: patapap, value: '[Press random keys on your keyboard for a musical and visual experience](https://www.patatap.com/)', inline: true },
      15: { name: triangle, value: '[Click your mouse for flashy triangles (warning:loud music)](https://lhbzr.com/experiments/triangles/)', inline: true },
      16: { name: neonflames, value: '[Draw nebula like art (many options in top right corner)](https://29a.ch/sandbox/2011/neonflames/#)', inline: true },
      17: { name: fluids, value: '[Colorful physics demonstration of fluid](https://haxiomic.github.io/GPU-Fluid-Experiments/html5/?q=High)', inline: true },
      18: { name: particledream, value: '[Move at changeable speed through colorful fractals that never end](http://www.iamnop.com/particles/)', inline: true },
      19: { name: cosmicsymbolism, value: '[Never ending cosmic zooming experience (click and drag for speed)](https://www.cosmic-symbolism.com/)', inline: true },
      20: { name: hopalong, value: '[A never ending orbits visualizer. Use keys and mouse to increase speed and angle](http://iacopoapps.appspot.com/hopalongwebgl/)', inline: true },
      21: { name: mynoise, value: '[Ambient noise generator with a variety of themes from rain to black holes to busy cafe to kitten purrs.](https://mynoise.net/)', inline: true },
      22: { name: mrdoobharmony, value: '[Make art by sketching with different materials and colors (many more triptoys at the top of the page)](https://mrdoob.com/#/120/harmony)', inline: true },
      23: { name: ballsdemo, value: '[Colorful balls that follow your mouse (Enable fullscreen for best effect)](https://testdrive-archive.azurewebsites.net/Graphics/TouchEffects/Default.html)', inline: true },
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
        { name: weavesilk, value: '[Generate art](http://weavesilk.com/)', inline: true },
        { name: arkadia, value: '[Never ending psychedelic forest](https://arkadia.xyz/)', inline: true },
        { name: chromoscope, value: '[Explore the night sky](http://www.chromoscope.net/)', inline: true },
        { name: plink, value: '[Multiplayer music maker](http://dinahmoelabs.com/_plink/)', inline: true },
        { name: puddle, value: '[Interact with paint-like soundwaves](http://iridescentpuddle.com/)', inline: true },
        { name: helloenjoy, value: '[Colorful game with music](https://helloenjoy.itch.io/hellorun)', inline: true },
        { name: softmurmur, value: '[Create your own mix of background noise](https://asoftmurmur.com/)', inline: true },
        { name: mandala, value: '[Draw a mandala with different colors in 3d](https://askalice.me/mandala)', inline: true },
        { name: waytogo, value: '[Draw lines and walk through a forest while creating music](http://a-way-to-go.com/)', inline: true },
        { name: waterphysics, value: '[Create music by clicking dots on the roster](https://madebyevan.com/webgl-water/)', inline: true },
        { name: 'Plasma Pong', value: '[Windows version of Pong with fluid dynamics](https://plasma-pong.en.softonic.com/)', inline: true },
        { name: strobe, value: '[Stare at the middle for 30 seconds for to experience an optical illusion](https://strobe.cool/)', inline: true },
        { name: lights, value: '[Musical experience to the tunes of Ellie Goulding\'s Lights](https://helloenjoy.itch.io/lights)', inline: true },
        { name: patapap, value: '[Press random keys on your keyboard for a musical and visual experience](https://www.patatap.com/)', inline: true },
        { name: triangle, value: '[Click your mouse for flashy triangles (warning:loud music)](https://lhbzr.com/experiments/triangles/)', inline: true },
        { name: neonflames, value: '[Draw nebula like art (many options in top right corner)](https://29a.ch/sandbox/2011/neonflames/#)', inline: true },
        { name: fluids, value: '[Colorful physics demonstration of fluid](https://haxiomic.github.io/GPU-Fluid-Experiments/html5/?q=High)', inline: true },
        { name: particledream, value: '[Move at changeable speed through colorful fractals that never end](http://www.iamnop.com/particles/)', inline: true },
        { name: cosmicsymbolism, value: '[Never ending cosmic zooming experience (click and drag for speed)](https://www.cosmic-symbolism.com/)', inline: true },
        { name: hopalong, value: '[A never ending orbits visualizer. Use keys and mouse to increase speed and angle](http://iacopoapps.appspot.com/hopalongwebgl/)', inline: true },
        { name: mynoise, value: '[Ambient noise generator with a variety of themes from rain to black holes to busy cafe to kitten purrs.](https://mynoise.net/)', inline: true },
        { name: mrdoobharmony, value: '[Make art by sketching with different materials and colors (many more triptoys at the top of the page)](https://mrdoob.com/#/120/harmony)', inline: true },
        { name: ballsdemo, value: '[Colorful balls that follow your mouse (Enable fullscreen for best effect)](https://testdrive-archive.azurewebsites.net/Graphics/TouchEffects/Default.html)', inline: true },
      );
    }

    interaction.reply({ embeds: [embed] });
    return true;
  },
};
