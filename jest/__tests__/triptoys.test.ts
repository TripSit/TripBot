/* eslint-disable max-len */
import {
  Colors,
} from 'discord.js';
import { stripIndents } from 'common-tags';
import { dTriptoys } from '../../src/discord/commands/global/d.triptoys';
import { executeCommandAndSpyEditReply, embedContaining, getParsedCommand } from '../utils/testutils';

const slashCommand = dTriptoys;

const authorInfo = {
  iconURL: 'https://i.gyazo.com/b48b08a853fefaafb6393837eec1a501.png',
  name: 'TripSit.Me',
  url: 'http://www.tripsit.me',
};
const footerInfo = {
  iconURL: 'https://i.gyazo.com/19276c297cca0761dc9689ac7c320b8e.png',
  text: 'Dose responsibly!',
};

describe(slashCommand.data.name, () => {
  it(slashCommand.data.description, async () => {
    expect(await executeCommandAndSpyEditReply(
      slashCommand,
      getParsedCommand(
        `/${slashCommand.data.name}`,
        slashCommand.data,
        'tripsit',
      ),
    )).toHaveBeenCalledWith({
      embeds: embedContaining({
        author: authorInfo,
        footer: footerInfo,
        color: Colors.Purple,
        title: 'Triptoys!',
        fields: [
          {
            name: 'Weavesilk',
            value: stripIndents`[Generate art](http://weavesilk.com/)`,
            inline: true,
          },
          {
            name: 'Arkadia',
            value: stripIndents`[Never ending psychedelic forest](https://arkadia.xyz/)`,
            inline: true,
          },
          {
            name: 'Chromoscope',
            value: stripIndents`[Explore the night sky](http://www.chromoscope.net/)`,
            inline: true,
          },
          {
            name: 'Plink',
            value: stripIndents`[Multiplayer music maker](http://dinahmoelabs.com/_plink/)`,
            inline: true,
          },
          {
            name: 'Puddle',
            value: stripIndents`[Interact with paint-like soundwaves](http://iridescentpuddle.com/)`,
            inline: true,
          },
          {
            name: 'Hello Enjoy',
            value: stripIndents`[Colorful game with music](https://helloenjoy.itch.io/hellorun)`,
            inline: true,
          },
          {
            name: 'Soft Murmur',
            value: stripIndents`[Create your own mix of background noise](https://asoftmurmur.com/)`,
            inline: true,
          },
          {
            name: 'Patterns',
            value: stripIndents`[Check out different patterns!](https://csh.bz/)`,
            inline: true,
          },
          {
            name: 'A Way To Go',
            value: stripIndents`[Draw lines and walk through a forest while creating music](http://a-way-to-go.com/)`,
            inline: true,
          },
          {
            name: 'Water physics',
            value: stripIndents`[Create music by clicking dots on the roster](https://madebyevan.com/webgl-water/)`,
            inline: true,
          },
          // {
          //   name: 'Plasma Pong',
          //   value: stripIndents`[Windows version of Pong with fluid dynamics](https://plasma-pong.en.softonic.com/)`,
          //   inline: true,
          // },
          {
            name: 'Strobe',
            value: stripIndents`[Stare at the middle for 30 seconds for to experience an optical illusion](https://strobe.cool/)`,
            inline: true,
          },
          {
            name: 'Lights',
            value: stripIndents`[Musical experience to the tunes of Ellie Goulding's Lights](https://helloenjoy.itch.io/lights)`,
            inline: true,
          },
          {
            name: 'Patapap',
            value: stripIndents`[Press random keys on your keyboard for a musical and visual experience](https://www.patatap.com/)`,
            inline: true,
          },
          {
            name: 'Triangle',
            value: stripIndents`[Click your mouse for flashy triangles (warning:loud music)](https://lhbzr.com/experiments/triangles/)`,
            inline: true,
          },
          {
            name: 'Neon Flames',
            value: stripIndents`[Draw nebula like art (many options in top right corner)](https://29a.ch/sandbox/2011/neonflames/#)`,
            inline: true,
          },
          {
            name: 'Fluids',
            value: stripIndents`[Colorful physics demonstration of fluid](https://haxiomic.github.io/GPU-Fluid-Experiments/html5/?q=High)`,
            inline: true,
          },
          {
            name: 'Particle Dream',
            value: stripIndents`[Move at changeable speed through colorful fractals that never end](http://www.iamnop.com/particles/)`,
            inline: true,
          },
          {
            name: 'Cosmic Symbolism',
            value: stripIndents`[Never ending cosmic zooming experience (click and drag for speed)](https://www.cosmic-symbolism.com/)`,
            inline: true,
          },
          {
            name: 'Hop Along',
            value: stripIndents`[A never ending orbits visualizer. Use keys and mouse to increase speed and angle](http://iacopoapps.appspot.com/hopalongwebgl/)`,
            inline: true,
          },
          {
            name: 'MyNoise.net',
            value: stripIndents`[Ambient noise generator with a variety of themes from rain to black holes to busy cafe to kitten purrs.](https://mynoise.net/)`,
            inline: true,
          },
          {
            name: 'Mr Doob Harmony',
            value: stripIndents`[Make art by sketching with different materials and colors (many more triptoys at the top of the page)](https://mrdoob.com/#/120/harmony)`,
            inline: true,
          },
          {
            name: 'Balls demo',
            value: stripIndents`[Colorful balls that follow your mouse (Enable fullscreen for best effect)](https://testdrive-archive.azurewebsites.net/Graphics/TouchEffects/Default.html)`,
            inline: true,
          },
        ],
      }),
    });
  });
});
