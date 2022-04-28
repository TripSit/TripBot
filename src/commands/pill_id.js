const fs = require('node:fs');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed, MessageButton } = require('discord.js');
const paginationEmbed = require('discordjs-button-pagination');
const PREFIX = require('path').parse(__filename).name;
const logger = require('../utils/logger.js');
if (process.env.NODE_ENV !== 'production') {require('dotenv').config();}
const ts_icon_url = process.env.ts_icon_url;
const disclaimer = process.env.disclaimer;
const ts_flame_url = process.env.ts_flame_url;
const imgur_id = process.env.imgur_id;
const imgur_secret = process.env.imgur_secret;
const axios = require('axios');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;
const { ImgurClient } = require('imgur');

const imgur_client = new ImgurClient({
    clientId: imgur_id,
    clientSecret: imgur_secret,
});

const raw_pill_colors = fs.readFileSync('./src/assets/pill_colors.json');
const pill_colors = JSON.parse(raw_pill_colors);

const raw_pill_shapes = fs.readFileSync('./src/assets/pill_shapes.json');
const pill_shapes = JSON.parse(raw_pill_shapes);

async function upload_to_imgur(imageURL) {
    let imgur_url = 'https://i.imgur.com/mFj3N0D.jpg';
    axios.request({
        method: 'GET',
        url: imageURL,
        responseType: 'stream',
    }).then(async function(response) {
        const img_res = await imgur_client.upload({
            image: response.data,
            type: 'stream',
        });
        imgur_url = img_res.data.link;
        logger.debug(`[${PREFIX}] png_image_url: ${imgur_url}`);
        return imgur_url;
    });
}

/* Idea for this code inspired by PsyBot! https://github.com/v0idp/PsyBot */
module.exports = {
    data: new SlashCommandBuilder()
        .setName('pill_id')
        .setDescription('Search by pill qualities!')
        .addStringOption(option =>
            option.setName('imprint')
                .setDescription('What are the markings on the pill?')
                .setRequired(true),
        )
        .addStringOption(option =>
            option.setName('color')
                .setDescription('What color is the pill?')
                .setRequired(true)
                .setAutocomplete(true),
        )
        .addStringOption(option =>
            option.setName('shape')
                .setDescription('What shape is the pill?')
                .setRequired(true)
                .setAutocomplete(true),
        ),
    async execute(interaction) {
        const input_imprint = interaction.options.getString('imprint');
        const input_color = interaction.options.getString('color');
        const input_shape = interaction.options.getString('shape');

        logger.info(`[${PREFIX}] starting getPill with parameters: Imprint: ${input_imprint} Color: ${input_color} Shape: ${input_shape}`);

        // Loop through pill_colors to find the color
        let pill_color_id = 0;
        for (let i = 0; i < pill_colors.length; i++) {
            if (pill_colors[i].key === input_color) {
                pill_color_id = pill_colors[i].value;
            }
        }

        let pill_shape_id = 0;
        for (let i = 0; i < pill_shapes.length; i++) {
            if (pill_shapes[i].key === input_shape) {
                pill_shape_id = pill_shapes[i].value;
            }
        }

        const url = `https://www.drugs.com/imprints.php?imprint=${input_imprint}&color=${pill_color_id}&shape=${pill_shape_id}`;
        // Get info from drugs.com
        // const url = `https://www.drugs.com/imprints.php`
        logger.debug(`[${PREFIX}] Starting axios base request to: ${url}`);
        axios.request({
            method: 'GET',
            url: url,
        }).then(async function(response) {
            logger.debug(`[${PREFIX}] axios base request worked!`);
            const { document } = (new JSDOM(response.data, { includeNodeLocations: true })).window;

            if (!document.querySelector('.pid-box-1')) {
                logger.debug(`[${PREFIX}] No results found for ${input_imprint} ${input_color} ${input_shape}`);
                return;
            }
            const first_result = document.querySelector('.pid-box-1');

            const strengthregex = /(\<\l\i\>\<b\>Strength\:<\/b\> )(.*)(<\/li\>)/;
            const imprintregex = /(\.html\"\>)(.*)(<\/a\>)/;
            const colorregex = /(\<li\>\<b\>Color\:\<\/b\> )(.*)(\<\/li\>)/;
            const shaperegex = /(\<li\>\<b\>Shape\:\<\/b\> )(.*)(\<\/li\>)/;

            const drug = first_result.getElementsByClassName('imprintdruglink')[0].innerHTML;
            logger.debug(`[${PREFIX}] drug: ${drug}`);
            const details = first_result.getElementsByClassName('ddc-pid-details')[0].innerHTML;
            const strengthmatched = details.match(strengthregex);
            const strength = strengthmatched[2];
            logger.debug(`[${PREFIX}] strength: ${strength}`);

            const imprintmatched = details.match(imprintregex);
            const imprint = imprintmatched[2].toUpperCase();
            logger.debug(`[${PREFIX}] imprint: ${imprint}`);

            const colormatched = details.match(colorregex);
            let color = 'Null';
            if (colormatched) {
                color = colormatched[2];
                color = color.replace('&amp;', '&');
            }
            logger.debug(`[${PREFIX}] color: ${color}`);

            const shapematched = details.match(shaperegex);
            const shape = shapematched[2];
            logger.debug(`[${PREFIX}] shape: ${shape}`);

            const embed = new MessageEmbed()
                .setAuthor({ name: 'Drugs.com', url: 'https://www.drugs.com/', iconURL: 'https://i.imgur.com/YRTrM0c.png' })
                .setColor('RANDOM')
                .setTitle(drug)
                .addFields(
                    { name: 'Imprint', value: imprint, inline: true },
                    { name: 'Color', value: color, inline: true },
                    { name: 'Shape', value: shape, inline: true },
                )
                .setFooter({ text: 'Dose responsibly! Click the drug name to get more information!', iconURL: ts_flame_url });

            const imageURL = first_result.querySelector('.ddc-pid-img').getAttribute('data-image-src');
            // It seems like drugs.com has some weird image handling, so we need to download the image and upload the image to imgur
            // I will eventually cache these images so we don't need to download/upload every time
            let imgur_url = '';
            logger.debug(`[${PREFIX}] Starting axios image request`);
            axios.request({
                // Get the image from drug.com
                method: 'GET',
                url: imageURL,
                responseType: 'stream',
            }).then(function(image_response) {
                // Upload the image to imgur
                logger.debug(`[${PREFIX}] Starting imgur upload`);
                imgur_client.upload({
                    image: image_response.data,
                    type: 'stream',
                }).then(function(imgur_resonse) {
                    // Use the link in the thumbnail
                    imgur_url = imgur_resonse.data.link;
                    logger.debug(`[${PREFIX}] png_image_url: ${imgur_url}`);
                    embed.setThumbnail(imgur_url);

                    const detailsURL = `https://www.drugs.com${first_result.querySelector('.ddc-btn.ddc-btn-sm').getAttribute('href')}`;
                    logger.debug(`[${PREFIX}] detailsURL: ${detailsURL}`);
                    embed.setURL(detailsURL);
                    logger.debug(`[${PREFIX}] Starting axios details request`);
                    axios.request({
                        // Get the image from drug.com
                        method: 'GET',
                        url: detailsURL,
                    }).then(async function(details_response) {
                        const body = details_response.data;
                        const { document } = (new JSDOM(body, { includeNodeLocations: true })).window;

                        if (!document.querySelector('.pid-list')) {
                            logger.debug(`[${PREFIX}] No results found for ${input_imprint} ${input_color} ${input_shape}`);
                            return;
                        }
                        const details = document.querySelector('.pid-list').innerHTML;
                        // logger.debug(`[${PREFIX}] details: ${details}`);

                        const avail_regex = /(\<dt\>Availability\<\/dt\>\n.*\>)(.*)(\<\/dd\>)/;
                        const availmatched = details.match(avail_regex);
                        logger.debug(`[${PREFIX}] availmatched: ${availmatched[2]}`);

                        const class_regex = /(\<dt\>Drug Class\<\/dt\>\s.*\s.*\"\>)(.*)(\<\/a)/;
                        const class_matched = details.match(class_regex);
                        logger.debug(`[${PREFIX}] class_matched: ${class_matched[2]}`);

                        const desc = document.querySelector('meta[name="twitter:description"]').content;
                        // const desc = document.querySelector('meta[property=\'og:description\']');
                        logger.debug(`[${PREFIX}] desc: ${desc}`);
                        embed.setDescription(desc);

                        // logger.debug(`[${PREFIX}] first_result: ${first_result}`);
                        embed.addFields(
                            { name: 'Strength', value: strength, inline: true },
                            { name: 'Availability', value: availmatched[2], inline: true },
                            { name: 'Class', value: class_matched[2], inline: true },
                        );
                        interaction.reply({ embeds: [embed], ephemeral: false });
                        logger.debug(`[${PREFIX}] finished!`);
                    }).catch(function(error) {
                        logger.error(`[${PREFIX}] error4: ${error}`);
                    });
                }).catch(function(error) {
                    logger.error(`[${PREFIX}] error3: ${error}`);
                });
            }).catch(function(error) {
                logger.error(`[${PREFIX}] error2: ${error}`);
            });
        }).catch(function(error) {
            logger.error(`[${PREFIX}] error1: ${error}`);
        });
    },
};
