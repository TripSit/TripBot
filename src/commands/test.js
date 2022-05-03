const { SlashCommandBuilder } = require('@discordjs/builders');
const logger = require('../utils/logger.js');
const PREFIX = require('path').parse(__filename).name;
const template = require('../utils/embed_template');

function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('test')
        .setDescription('This will test the bot and show all functionality!'),
    async execute(interaction) {
        await interaction.deferReply();
        const channel = interaction.channel;
        const embed = template.embed_template()
            .setTitle('Testing in progress...');
        interaction.editReply({ embeds: [embed], ephemeral: false });
        // await sleep(1000);

        // const guild_command_names = [
        //     'botmod',
        //     'button',
        //     'invite',
        //     'issue',
        //     'karma',
        //     'mod',
        //     'report',
        //     'tripsit',
        //     'pill_id',
        // ];

        // Set up global commands
        const globl_command_names = [
            'about',
            'breathe',
            'bug',
            'calc_benzo',
            'calc_dxm',
            'calc_ketamine',
            'calc_psychedelics',
            'combo',
            'combochart',
            'contact',
            'ems',
            'help',
            'hydrate',
            'idose',
            'info',
            'joke',
            'kipp',
            'motivate',
            'reagents',
            'recovery',
            'time',
            'topic',
            'triptoys',
            'wolfram',
            'urban_define',
        ];

        for (let i = 0; i < globl_command_names.length; i++) {
            await sleep(1000);
            const name = globl_command_names[i];
            const test_embed = template.embed_template()
                .setTitle(`Testing ${name}...`);
            await channel.send({ embeds: [test_embed], ephemeral: false });
            await sleep(100);

            const skip_embed = template.embed_template()
                .setTitle(`Skipping ${name}...`);

            const command = await interaction.client.commands.get(name);
            if (command) {
                if (name == 'bug') {
                    await command.execute(interaction, 'This is a bug report!');
                    continue;
                }
                if (name == 'calc_benzo') {
                    await command.execute(interaction, ['10', 'alprazolam', 'ativan']);
                    continue;
                }
                if (name == 'calc_dxm') {
                    await command.execute(interaction, ['200', 'lbs', 'RoboTablets (30 mg tablets)']);
                    continue;
                }
                if (name == 'calc_ketamine') {
                    await command.execute(interaction, ['200', 'lbs']);
                    continue;
                }
                if (name == 'calc_psychedelics') {
                    await command.execute(interaction, ['2', '4', '4', 'mushrooms']);
                    await sleep(1000);
                    await command.execute(interaction, ['2', '', '4', 'mushrooms']);
                    await sleep(1000);
                    await command.execute(interaction, ['200', '400', '4', 'lsd']);
                    await sleep(1000);
                    await command.execute(interaction, ['200', '', '4', 'lsd']);
                    continue;
                }
                if (name == 'combo') {
                    await command.execute(interaction, ['DXM', 'MDMA']);
                    continue;
                }
                if (name == 'idose') {
                    await command.execute(interaction, ['DXM', '10', 'g (grams)']);
                    continue;
                }
                if (name == 'info') {
                    await command.execute(interaction, ['DMT', 'Summary']);
                    await sleep(1000);
                    await command.execute(interaction, ['DMT', 'Dosage']);
                    await sleep(1000);
                    await command.execute(interaction, ['DMT', 'Combos']);
                    continue;
                }
                if (name == 'urban_define') {
                    await command.execute(interaction, 'tripsit');
                    continue;
                }
                if (name == 'breathe') {
                    await command.execute(interaction, '1');
                    await sleep(1000);
                    await command.execute(interaction, '2');
                    await sleep(1000);
                    await command.execute(interaction, '3');
                    await sleep(1000);
                    await command.execute(interaction, '4');
                    continue;
                }
                if (name == 'wolfram') {
                    logger.debug(`[${PREFIX}] wolfram not build, ignoring}`);
                    await interaction.followUp({ embeds: [skip_embed], ephemeral: false });
                    continue;
                }
                await command.execute(interaction);
                continue;
            }
            else {
                const error_embed = template.embed_template()
                    .setTitle('Error!')
                    .setDescription(`Command ${name} not found!`);
                channel.send({ embeds: [error_embed], ephemeral: false });
            }
        }
        logger.debug(`[${PREFIX}] finished!`);
        return;
    },
};
