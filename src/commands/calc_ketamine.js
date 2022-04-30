const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const logger = require('../utils/logger.js');
const PREFIX = require('path').parse(__filename).name;

if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}
const ts_icon_url = process.env.ts_icon_url;
const disclaimer = process.env.disclaimer;
const ts_flame_url = process.env.ts_flame_url;

// Calculate insufflated dosages
function generateInsufflatedDosages(weightInLbs) {
    const dosageArray = [];

    dosageArray.push(`**Threshold**: ${Math.round(weightInLbs * 0.1)}mg`);
    dosageArray.push(`**Light**: ${Math.round(weightInLbs * 0.15)}mg`);
    dosageArray.push(`**Common**: ${Math.round(weightInLbs * 0.3)}mg`);
    dosageArray.push(`**Strong**: ${Math.round(weightInLbs * 0.5)}-${Math.round(weightInLbs * 0.75)}mg`);
    dosageArray.push(`**K-hole**: ${weightInLbs}mg`);

    return dosageArray.join('\n');
}

// Calculate rectal dosages
function generateRectalDosages(weightInLbs) {
    const dosageArray = [];

    dosageArray.push(`**Threshold**: ${Math.round(weightInLbs * 0.3)}mg`);
    dosageArray.push(`**Light**: ${Math.round(weightInLbs * 0.6)}mg`);
    dosageArray.push(`**Common**: ${Math.round(weightInLbs * 0.75)}-${Math.round(weightInLbs * 2)}mg`);
    dosageArray.push(`**Strong**: ${Math.round(weightInLbs * 2)}-${Math.round(weightInLbs * 2.5)}mg`);
    dosageArray.push(`**K-hole**: ${Math.round(weightInLbs * 3)}-${Math.round(weightInLbs * 4)}mg`);

    return dosageArray.join('\n');
}


module.exports = {
    data: new SlashCommandBuilder()
        .setName('calc_ketamine')
        .setDescription('Get ketamine dosage information')
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
        ),
    async execute(interaction) {
        let calc_weight = 0;
        const given_weight = interaction.options.getInteger('weight');
        logger.debug(`[${PREFIX}] weight: ${given_weight}`);

        const weight_units = interaction.options.getString('units');
        logger.debug(`[${PREFIX}] weight_units: ${weight_units}`);
        if (weight_units == 'kg') {calc_weight = given_weight * 2.20462;}
        else {calc_weight = given_weight;}
        logger.debug(`[${PREFIX}] calc_weight: ${calc_weight}`);

        const embed = new MessageEmbed()
            .setAuthor({ name: 'TripSit.Me ', url: 'http://www.tripsit.me', iconURL: ts_icon_url })
            .setColor('RANDOM')
            .setFooter({ text: disclaimer, iconURL: ts_flame_url });

        if (weight_units === 'kg' && given_weight > 179) {
            embed.setTitle('Please enter a valid weight less than 179 kg.');
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        if (weight_units === 'lbs' && given_weight > 398) {
            embed.setTitle('Please enter a valid weight less than 398 lbs.');
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        const insufflatedosearray = generateInsufflatedDosages(calc_weight);
        const boofdosearray = generateRectalDosages(calc_weight);

        embed.addFields(
            { name: 'Insufflated Dosages', value: insufflatedosearray, inline: true },
            { name: 'Rectal Dosages', value: boofdosearray, inline: true },
        );
        return interaction.reply({ embeds: [embed] });

    },
};
