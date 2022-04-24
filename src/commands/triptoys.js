const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const logger = require('../utils/logger.js');
const PREFIX = require('path').parse(__filename).name;
if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}
const ts_icon_url = process.env.ts_icon_url;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('triptoys')
        .setDescription('Information bout TripBot Commands'),
    async execute(interaction) {
        const username = `${interaction.member.user.username}#${interaction.member.user.discriminator}`;
        const channel = interaction.channel.name;
        const guild = interaction.guild.name;
        logger.info(`[${PREFIX}] Initialized by ${username} in ${channel} on ${guild}!`);

        const embed = new MessageEmbed()
            .setAuthor({ name: 'TripSit.Me ', url: 'http://www.tripsit.me', iconURL: ts_icon_url })
            .setColor('RANDOM')
            .setTitle('TripBot Help')
            .addFields(
                { name: 'Weavesilk', value: '[ Generate art ](http://weavesilk.com/)', inline: true },
                { name: 'Arkadia', value: '[Never ending psychedelic forest](https://arkadia.xyz/)', inline: true },
                { name: 'Chromoscope', value: '[ Explore the night sky](http://www.chromoscope.net/)', inline: true },
                { name: 'Plink', value: '[ Multiplayer music maker ](http://dinahmoelabs.com/_plink/)', inline: true },
                { name: 'Puddle', value: '[Interact with paint-like soundwaves](http://iridescentpuddle.com/)', inline: true },
                { name: 'Hello Enjoy', value: '[Colorful game with music](https://helloenjoy.itch.io/hellorun)', inline: true },
                { name: 'Soft Murmur', value: '[ Create your own mix of background noise](https://asoftmurmur.com/)', inline: true },
                { name: 'Draw A 3D Mandala', value: '[ Draw a mandala with different colors in 3d ](https://askalice.me/mandala)', inline: true },
                { name: 'A Way To Go', value: '[ Draw lines and walk through a forest while creating music](http://a-way-to-go.com/)', inline: true },
                { name: 'Water physics', value: '[ Create music by clicking dots on the roster](https://madebyevan.com/webgl-water/)', inline: true },
                { name: 'Plasma Pong', value: '[ Windows version of Pong with fluid dynamics ](https://plasma-pong.en.softonic.com/)', inline: true },
                { name: 'Strobe', value: '[ Stare at the middle for 30 seconds for to experience an optical illusion ](https://strobe.cool/)', inline: true },
                { name: 'Lights', value: '[ Musical experience to the tunes of Ellie Goulding\'s Lights](https://helloenjoy.itch.io/lights)', inline: true },
                { name: 'Patapap', value: '[ Press random keys on your keyboard for a musical and visual experience ](https://www.patatap.com/)', inline: true },
                { name: 'Triangle', value: '[ Click your mouse for flashy triangles (warning:loud music)](https://lhbzr.com/experiments/triangles/)', inline: true },
                { name: 'Neon Flames', value: '[ Draw nebula like art (many options in top right corner) ](https://29a.ch/sandbox/2011/neonflames/#)', inline: true },
                { name: 'Fluids', value: '[ Colorful physics demonstration of fluid ](https://haxiomic.github.io/GPU-Fluid-Experiments/html5/?q=High)', inline: true },
                { name: 'Particle Dream', value: '[ Move at changeable speed through colorful fractals that never end](http://www.iamnop.com/particles/)', inline: true },
                { name: 'Cosmic Symbolism', value: '[ Never ending cosmic zooming experience (click and drag for speed) ](https://www.cosmic-symbolism.com/)', inline: true },
                { name: 'Hop Along', value: '[ A never ending orbits visualizer. Use keys and mouse to increase speed and angle ](http://iacopoapps.appspot.com/hopalongwebgl/)', inline: true },
                { name: 'MyNoise.net', value: '[ Ambient noise generator with a variety of themes from rain to black holes to busy cafe to kitten purrs. ](https://mynoise.net/)', inline: true },
                { name: 'Mr Doob Harmony', value: '[ Make art by sketching with different materials and colors (many more triptoys at the top of the page)](https://mrdoob.com/#/120/harmony)', inline: true },
                { name: 'Balls demo', value: '[ Colorful balls that follow your mouse (Enable fullscreen for best effect)](https://testdrive-archive.azurewebsites.net/Graphics/TouchEffects/Default.html)', inline: true },
            );
        return interaction.reply({ embeds: [embed], ephemeral: true });
    },
};
