const fs = require('node:fs');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const PREFIX = require('path').parse(__filename).name;

const raw_drug_data = fs.readFileSync('./src/assets/allDrugData.json');
const allDrugData = JSON.parse(raw_drug_data);

const raw_combo_data = fs.readFileSync('./src/assets/combo_definitions.json');
const combo_defs = JSON.parse(raw_combo_data);

if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}
const ts_icon_url = process.env.ts_icon_url;
const disclaimer = process.env.disclaimer;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('combo')
        .setDescription('Check combo information')
        .addStringOption(option =>
            option.setName('first_drug')
                .setDescription('Pick the first drug')
                .setRequired(true)
                .setAutocomplete(true),
        )
        .addStringOption(option =>
            option.setName('second_drug')
                .setDescription('Pick the second drug')
                .setRequired(true)
                .setAutocomplete(true),
        ),
    async execute(interaction, logger) {
        const username = `${interaction.member.user.username}#${interaction.member.user.discriminator}`;
        const channel = interaction.channel.name;
        const guild = interaction.guild.name;
        logger.info(`[${PREFIX}] Initialized by ${username} in ${channel} on ${guild}!`);

        const drug_a = interaction.options.getString('first_drug');
        const drug_b = interaction.options.getString('second_drug');
        logger.debug(`[${PREFIX}] drug_a: ${drug_a} | drug_b: ${drug_b}`);

        for (let i = 0; i < Object.keys(allDrugData).length; i++) {
            if (allDrugData[i]) {
                if (allDrugData[i]['name'] == drug_a) {
                    logger.debug(`[${PREFIX}] Found drug_a: ${drug_a}`);
                    const embed = new MessageEmbed()
                        .setAuthor({ name: 'TripSit.Me', iconURL: ts_icon_url, url: 'http://www.tripsit.me' })
                        .setTitle(`${drug_a} and ${drug_b} combined:`)
                        .setFooter({ text: disclaimer, iconURL: ts_icon_url });
                    if (allDrugData[i]['interactions']) {
                        let result = '';
                        for (let j = 0; j < allDrugData[i]['interactions'].length; j++) {
                            if (allDrugData[i]['interactions'][j]['name'] == drug_b) {
                                logger.debug(`[${PREFIX}] Found drug_b: ${drug_b}`);
                                result = allDrugData[i]['interactions'][j]['status'];
                                let definition = 'test';
                                // Loop through combo_defs and find the object where "status" is equal to result
                                for (let k = 0; k < combo_defs.length; k++) {
                                    if (combo_defs[k]['status'] == result) {
                                        logger.debug(`[${PREFIX}] Found combo_defs: ${combo_defs[k]['status']}`);
                                        definition = combo_defs[k]['definition'];
                                        const emoji = combo_defs[k]['emoji'];
                                        const color = combo_defs[k]['color'];
                                        const thumbnail = combo_defs[k]['thumbnail'];
                                        const output = `${emoji} ${result} ${emoji}`;
                                        embed.addFields(
                                            { name: 'Result', value: output },
                                            { name: 'Definition', value: definition },
                                        );
                                        embed.setThumbnail(thumbnail);
                                        embed.setColor(color);
                                        break;
                                    }
                                }
                            }
                        }
                        if (result == '') {
                            embed.addFields(
                                { name: 'Result', value: `Interaction not found between ${drug_a} and ${drug_b}` },
                            );
                            break;
                        }
                    }
                    else {
                        embed.addFields(
                            { name: 'Result', value: `[${PREFIX}] Drug ${drug_a} has no interactions!` },
                        );
                        break;
                    }
                    return interaction.reply({ embeds: [embed] });
                }
            }
        }
    },
};
