const { SlashCommandBuilder } = require('@discordjs/builders');
const logger = require('../utils/logger.js');
const PREFIX = require('path').parse(__filename).name;
const template = require('../utils/embed_template');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('triptoys')
        .setDescription('Fun toys to play with!')
        .addStringOption(option =>
            option.setName('toy')
                .setDescription('Which toy?')
                .addChoice('All', '25')
                .addChoice('Random', '24')
                .addChoice('Weavesilk', '1')
                .addChoice('Arkadia', '2')
                .addChoice('Chromoscope', '3')
                .addChoice('Plink', '4')
                .addChoice('Puddle', '5')
                .addChoice('Hello Enjoy', '6')
                .addChoice('Soft Murmur', '7')
                .addChoice('Draw A 3D Mandala', '8')
                .addChoice('A Way To Go', '9')
                .addChoice('Water physics', '10')
                .addChoice('Plasma Pong', '11')
                .addChoice('Strobe', '12')
                .addChoice('Lights', '13')
                .addChoice('Patapap', '14')
                .addChoice('Triangle', '15')
                .addChoice('Neon Flames', '16')
                .addChoice('Fluids', '17')
                .addChoice('Particle Dream', '18')
                .addChoice('Cosmic Symbolism', '19')
                .addChoice('Hop Along', '20')
                .addChoice('MyNoise.net', '21')
                .addChoice('Mr Doob Harmony', '22')
                .addChoice('Balls demo', '23'),
        ),
    async execute(interaction) {
        let toy_name = interaction.options.getString('toy');
        if (!toy_name) {
            toy_name = '25';
        }
        const toy_id = parseInt(toy_name);
        logger.debug(`[${PREFIX}] toy_name: ${toy_name}`);

        const toys_dict = {
            1: { name: 'Weavesilk', value: '[Generate art](http://weavesilk.com/)', inline: true },
            2: { name: 'Arkadia', value: '[Never ending psychedelic forest](https://arkadia.xyz/)', inline: true },
            3: { name: 'Chromoscope', value: '[Explore the night sky](http://www.chromoscope.net/)', inline: true },
            4: { name: 'Plink', value: '[Multiplayer music maker](http://dinahmoelabs.com/_plink/)', inline: true },
            5: { name: 'Puddle', value: '[Interact with paint-like soundwaves](http://iridescentpuddle.com/)', inline: true },
            6: { name: 'Hello Enjoy', value: '[Colorful game with music](https://helloenjoy.itch.io/hellorun)', inline: true },
            7: { name: 'Soft Murmur', value: '[Create your own mix of background noise](https://asoftmurmur.com/)', inline: true },
            8: { name: 'Draw A 3D Mandala', value: '[Draw a mandala with different colors in 3d](https://askalice.me/mandala)', inline: true },
            9: { name: 'A Way To Go', value: '[Draw lines and walk through a forest while creating music](http://a-way-to-go.com/)', inline: true },
            10: { name: 'Water physics', value: '[Create music by clicking dots on the roster](https://madebyevan.com/webgl-water/)', inline: true },
            11: { name: 'Plasma Pong', value: '[Windows version of Pong with fluid dynamics](https://plasma-pong.en.softonic.com/)', inline: true },
            12: { name: 'Strobe', value: '[Stare at the middle for 30 seconds for to experience an optical illusion](https://strobe.cool/)', inline: true },
            13: { name: 'Lights', value: '[Musical experience to the tunes of Ellie Goulding\'s Lights](https://helloenjoy.itch.io/lights)', inline: true },
            14: { name: 'Patapap', value: '[Press random keys on your keyboard for a musical and visual experience](https://www.patatap.com/)', inline: true },
            15: { name: 'Triangle', value: '[Click your mouse for flashy triangles (warning:loud music)](https://lhbzr.com/experiments/triangles/)', inline: true },
            16: { name: 'Neon Flames', value: '[Draw nebula like art (many options in top right corner)](https://29a.ch/sandbox/2011/neonflames/#)', inline: true },
            17: { name: 'Fluids', value: '[Colorful physics demonstration of fluid](https://haxiomic.github.io/GPU-Fluid-Experiments/html5/?q=High)', inline: true },
            18: { name: 'Particle Dream', value: '[Move at changeable speed through colorful fractals that never end](http://www.iamnop.com/particles/)', inline: true },
            19: { name: 'Cosmic Symbolism', value: '[Never ending cosmic zooming experience (click and drag for speed)](https://www.cosmic-symbolism.com/)', inline: true },
            20: { name: 'Hop Along', value: '[A never ending orbits visualizer. Use keys and mouse to increase speed and angle](http://iacopoapps.appspot.com/hopalongwebgl/)', inline: true },
            21: { name: 'MyNoise.net', value: '[Ambient noise generator with a variety of themes from rain to black holes to busy cafe to kitten purrs.](https://mynoise.net/)', inline: true },
            22: { name: 'Mr Doob Harmony', value: '[Make art by sketching with different materials and colors (many more triptoys at the top of the page)](https://mrdoob.com/#/120/harmony)', inline: true },
            23: { name: 'Balls demo', value: '[Colorful balls that follow your mouse (Enable fullscreen for best effect)](https://testdrive-archive.azurewebsites.net/Graphics/TouchEffects/Default.html)', inline: true },
        };

        const embed = template.embed_template();

        if (toy_id < 24) {
            embed.setTitle(`${toys_dict[toy_id].name}`);
            embed.addFields(toys_dict[toy_id]);
        }

        if (toy_id == 24) {
            // Get a random toy from the toy_dict dictionary
            const random_toy = toys_dict[Object.keys(toys_dict)[Math.floor(Math.random() * Object.keys(toys_dict).length)]];
            logger.debug(`[${PREFIX}] random_toy: ${JSON.stringify(random_toy, null, 2)}`);
            embed.addFields(random_toy);
        }

        if (toy_id == 25) {
            embed.setTitle('Triptoys!');
            embed.addFields(
                { name: 'Weavesilk', value: '[Generate art](http://weavesilk.com/)', inline: true },
                { name: 'Arkadia', value: '[Never ending psychedelic forest](https://arkadia.xyz/)', inline: true },
                { name: 'Chromoscope', value: '[Explore the night sky](http://www.chromoscope.net/)', inline: true },
                { name: 'Plink', value: '[Multiplayer music maker](http://dinahmoelabs.com/_plink/)', inline: true },
                { name: 'Puddle', value: '[Interact with paint-like soundwaves](http://iridescentpuddle.com/)', inline: true },
                { name: 'Hello Enjoy', value: '[Colorful game with music](https://helloenjoy.itch.io/hellorun)', inline: true },
                { name: 'Soft Murmur', value: '[Create your own mix of background noise](https://asoftmurmur.com/)', inline: true },
                { name: 'Draw A 3D Mandala', value: '[Draw a mandala with different colors in 3d](https://askalice.me/mandala)', inline: true },
                { name: 'A Way To Go', value: '[Draw lines and walk through a forest while creating music](http://a-way-to-go.com/)', inline: true },
                { name: 'Water physics', value: '[Create music by clicking dots on the roster](https://madebyevan.com/webgl-water/)', inline: true },
                { name: 'Plasma Pong', value: '[Windows version of Pong with fluid dynamics](https://plasma-pong.en.softonic.com/)', inline: true },
                { name: 'Strobe', value: '[Stare at the middle for 30 seconds for to experience an optical illusion](https://strobe.cool/)', inline: true },
                { name: 'Lights', value: '[Musical experience to the tunes of Ellie Goulding\'s Lights](https://helloenjoy.itch.io/lights)', inline: true },
                { name: 'Patapap', value: '[Press random keys on your keyboard for a musical and visual experience](https://www.patatap.com/)', inline: true },
                { name: 'Triangle', value: '[Click your mouse for flashy triangles (warning:loud music)](https://lhbzr.com/experiments/triangles/)', inline: true },
                { name: 'Neon Flames', value: '[Draw nebula like art (many options in top right corner)](https://29a.ch/sandbox/2011/neonflames/#)', inline: true },
                { name: 'Fluids', value: '[Colorful physics demonstration of fluid](https://haxiomic.github.io/GPU-Fluid-Experiments/html5/?q=High)', inline: true },
                { name: 'Particle Dream', value: '[Move at changeable speed through colorful fractals that never end](http://www.iamnop.com/particles/)', inline: true },
                { name: 'Cosmic Symbolism', value: '[Never ending cosmic zooming experience (click and drag for speed)](https://www.cosmic-symbolism.com/)', inline: true },
                { name: 'Hop Along', value: '[A never ending orbits visualizer. Use keys and mouse to increase speed and angle](http://iacopoapps.appspot.com/hopalongwebgl/)', inline: true },
                { name: 'MyNoise.net', value: '[Ambient noise generator with a variety of themes from rain to black holes to busy cafe to kitten purrs.](https://mynoise.net/)', inline: true },
                { name: 'Mr Doob Harmony', value: '[Make art by sketching with different materials and colors (many more triptoys at the top of the page)](https://mrdoob.com/#/120/harmony)', inline: true },
                { name: 'Balls demo', value: '[Colorful balls that follow your mouse (Enable fullscreen for best effect)](https://testdrive-archive.azurewebsites.net/Graphics/TouchEffects/Default.html)', inline: true },
            );
        }
        if (!interaction.replied) { interaction.reply({ embeds: [embed], ephemeral: false });}
        else {interaction.followUp({ embeds: [embed], ephemeral: false });}
        logger.debug(`[${PREFIX}] finished!`);
        return;
    },
};
