const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const logger = require('../utils/logger.js');
const PREFIX = require('path').parse(__filename).name;
if (process.env.NODE_ENV !== 'production') {require('dotenv').config();}
const ts_icon_url = process.env.ts_icon_url;
const ts_flame_url = process.env.ts_flame_url;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ems')
        .setDescription('Information that may be helpful in a serious situation.'),
    async execute(interaction) {
        const embed = new MessageEmbed()
            .setAuthor({ name: 'TripSit.Me ', url: 'http://www.tripsit.me', iconURL: ts_icon_url })
            .setColor('RANDOM')
            .setTitle('TripBot Help')
            .addFields(
                { name: 'Poison Control (USA)', value: 'Website: https://www.poison.org/\nPhone: (800) 222-1222\nWebhelp: https://triage.webpoisoncontrol.org/', inline: false },
                { name: 'Never Use Alone (USA)', value: 'Website: https://neverusealone.com/\nPhone: (800) 484-3731', inline: false },
                { name: 'NORS (Canada)', value: 'Website: https://www.nors.ca/\nPhone: 1 (888) 688-6677', inline: false },
            )
            .setFooter({ text: 'Dose responsibly!', iconURL: ts_flame_url });
        interaction.reply({ embeds: [embed], ephemeral: false });
        logger.debug(`[${PREFIX}] finished!`);
        return;
    },
};
