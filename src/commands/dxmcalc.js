const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const logger = require('../utils/logger.js');
const PREFIX = require('path').parse(__filename).name;

if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}
const ts_icon_url = process.env.ts_icon_url;
const disclaimer = process.env.disclaimer;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('dxmcalc')
        .setDescription('Check combo information')
        .addIntegerOption(option =>
            option.setName('weight')
                .setDescription('How much do you weigh?')
                .setRequired(true),
        )
        .addStringOption(option =>
            option.setName('units')
                .setDescription('In what unit?')
                .setRequired(true)
                .addChoice('kg', 'kg')
                .addChoice('lbs', 'lbs'),
        )
        .addStringOption(option =>
            option.setName('taking')
                .setDescription('What are you taking? All products listed here contain DXM hBr as the sole active ingredient.')
                .setRequired(true)
                .addChoice('RoboCough (ml)', 'RoboCough (ml)')
                .addChoice('Robitussin DX (oz)', 'Robitussin DX (oz)')
                .addChoice('Robitussin DX (ml)', 'Robitussin DX (ml)')
                .addChoice('Robitussin Gelcaps (15 mg caps)', 'Robitussin Gelcaps (15 mg caps)')
                .addChoice('Pure (mg)', 'Pure (mg)')
                .addChoice('30mg Gelcaps (30 mg caps)', '30mg Gelcaps (30 mg caps)'),
        ),
    async execute(interaction) {
        // Calculate each plat min/max value
        const addInfo = (weight, unit) => {
            const embed = new MessageEmbed()
                .setAuthor({ name: 'TripSit.Me ', url: 'http://www.tripsit.me', iconURL: ts_icon_url })
                .setColor('RANDOM')
                .setTitle('DXM Calculator')
                .setDescription('\
Please note, these tools were developed and tested to the best possible ability by the TripSit team, and the greatest effort has been made not to produce incorrect or misleading results, though for unforeseen reasons these may occur. Always check your maths, and be careful.\n\n\
You should always start low and work your way up untill you find the doses that are right for you.\n\n\
DXM-containing products may also contain several potentially dangerous adulterants; you must make sure that your product contains only DXM as its active ingredient. For more information about DXM adulterants, see: https://wiki.tripsit.me/wiki/DXM#Adulteration\n\n\
For a description of the plateau model, and the effects you can expect at each level, click: https://wiki.tripsit.me/wiki/DXM#Plateaus')
                .setFooter({ text: disclaimer, iconURL: ts_icon_url });

            const dxm_data = {
                'First': { 'min': 1.5, 'max': 2.5 },
                'Second': { 'min': 2.5, 'max': 7.5 },
                'Third': { 'min': 7.5, 'max': 15 },
                'Fourth': { 'min': 15, 'max': 20 },
            };

            // Loop through the keys in dxm_data and calculate the min/max values
            for (const key in dxm_data) {
                const min = Math.round((dxm_data[key].min * weight) * 100) / 100;
                const max = Math.round((dxm_data[key].max * weight) * 100) / 100;
                embed.addFields(
                    { name: 'Plateau', value: `${key}`, inline: true },
                    { name: 'Minimum', value: `${min} ${unit}`, inline: true },
                    { name: 'Maximum', value: `${max} ${unit}`, inline: true },
                );
            }
            interaction.reply({ embeds: [embed], ephemeral: false });
            logger.debug(`${PREFIX} finished!`);
            return;
        };

        let calc_weight = 0;
        const given_weight = interaction.options.getInteger('weight');
        logger.debug(`[${PREFIX}] weight: ${given_weight}`);

        const weight_units = interaction.options.getString('units');
        logger.debug(`[${PREFIX}] weight_units: ${weight_units}`);
        if (weight_units == 'lbs') {
            calc_weight = given_weight * 0.453592;
        }
        else {
            calc_weight = given_weight;
        }
        logger.debug(`[${PREFIX}] calc_weight: ${calc_weight}`);

        const taking = interaction.options.getString('taking');
        logger.debug(`[${PREFIX}] taking: ${taking}`);
        let roa_value = 0;
        let units = '';
        if (taking == 'RoboCough (ml)') {
            roa_value = 10;
            units = '(ml)';

        }
        else if (taking == 'Robitussin DX (oz)') {
            roa_value = 88.5;
            units = '(oz)';
        }
        else if (taking == 'Robitussin DX (ml)') {
            roa_value = 3;
            units = '(ml)';
        }
        else if (taking == 'Robitussin Gelcaps (15 mg caps)') {
            roa_value = 15;
            units = '(15 mg caps)';
        }
        else if (taking == 'Pure (mg)') {
            roa_value = 1;
            units = '(mg)';
        }
        else if (taking == '30mg Gelcaps (30 mg caps)') {
            roa_value = 30;
            units = '(30 mg caps)';
        }
        logger.debug(`[${PREFIX}] roa_value: ${roa_value}`);
        logger.debug(`[${PREFIX}] units: ${units}`);

        calc_weight = calc_weight / roa_value;
        logger.debug(`[${PREFIX}] calc_weight: ${calc_weight}`);

        addInfo(calc_weight, units);
    },
};
