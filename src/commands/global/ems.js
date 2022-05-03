const { SlashCommandBuilder } = require('@discordjs/builders');
const logger = require('../../utils/logger.js');
const PREFIX = require('path').parse(__filename).name;
const template = require('../../utils/embed_template');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ems')
        .setDescription('Information that may be helpful in a serious situation.'),
    async execute(interaction) {
        const embed = template.embed_template()
            .setTitle('EMS Information')
            .addFields(
                { name: 'Poison Control (USA)', value: 'Website: https://www.poison.org/\nPhone: (800) 222-1222\nWebhelp: https://triage.webpoisoncontrol.org/', inline: false },
                { name: 'Never Use Alone (USA)', value: 'Website: https://neverusealone.com/\nPhone: (800) 484-3731', inline: false },
                { name: 'NORS (Canada)', value: 'Website: https://www.nors.ca/\nPhone: 1 (888) 688-6677', inline: false },
            );
        if (!interaction.replied) { interaction.reply({ embeds: [embed], ephemeral: false });}
        else {interaction.followUp({ embeds: [embed], ephemeral: false });}
        logger.debug(`[${PREFIX}] finished!`);
        return;
    },
};
