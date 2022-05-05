const fs = require('node:fs');
const { SlashCommandBuilder } = require('@discordjs/builders');
const PREFIX = require('path').parse(__filename).name;
const logger = require('../../utils/logger.js');
const template = require('../../utils/embed_template');
const axios = require('axios');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;
const { ImgurClient } = require('imgur');
if (process.env.NODE_ENV !== 'production') {require('dotenv').config();}
const imgur_id = process.env.imgur_id;
const imgur_secret = process.env.imgur_secret;

const imgur_client = new ImgurClient({
    clientId: imgur_id,
    clientSecret: imgur_secret,
});

const raw_pill_colors = fs.readFileSync('./src/assets/pill_colors.json');
const pill_colors = JSON.parse(raw_pill_colors);

const raw_pill_shapes = fs.readFileSync('./src/assets/pill_shapes.json');
const pill_shapes = JSON.parse(raw_pill_shapes);

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
            // headers: { 'User-Agent': 'Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2272.96 Mobile Safari/537.36' },
            // headers: { 'User-Agent': 'Axios 0.21.1' },
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
            // logger.debug(`[${PREFIX}] drug: ${drug}`);
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

            const embed = template.embed_template()
                .setAuthor({ name: 'Drugs.com', url: 'https://www.drugs.com/', iconURL: 'https://i.imgur.com/YRTrM0c.png' })
                .setTitle(drug)
                .addFields(
                    { name: 'Imprint', value: imprint, inline: true },
                    { name: 'Color', value: color, inline: true },
                    { name: 'Shape', value: shape, inline: true },
                    { name: 'Strength', value: strength, inline: true },
                );

            const imageURL = first_result.querySelector('.ddc-pid-img').getAttribute('data-image-src');
            const detailsURL = `https://www.drugs.com${first_result.querySelector('.ddc-btn.ddc-btn-sm').getAttribute('href')}`;
            embed.setURL(detailsURL);
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
                const details2 = document.querySelector('.pid-list').innerHTML;
                // logger.debug(`[${PREFIX}] details2: ${details2}`);

                const avail_regex = /(\<dt\>Availability\<\/dt\>\n.*\>)(.*)(\<\/dd\>)/;
                const availmatched = details2.match(avail_regex);
                // logger.debug(`[${PREFIX}] availmatched: ${availmatched[2]}`);

                const class_regex = /(\<dt\>Drug Class\<\/dt\>\s.*\s.*\"\>)(.*)(\<\/a)/;
                const class_matched = details2.match(class_regex);
                // logger.debug(`[${PREFIX}] class_matched: ${class_matched[2]}`);

                const desc = document.querySelector('meta[name="twitter:description"]').content;
                // const desc = document.querySelector('meta[property=\'og:description\']');
                // logger.debug(`[${PREFIX}] desc: ${desc}`);
                embed.setDescription(desc);

                // logger.debug(`[${PREFIX}] first_result: ${first_result}`);
                embed.addFields(
                    { name: 'Availability', value: availmatched[2], inline: true },
                    { name: 'Class', value: class_matched[2], inline: true },
                );
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
                        // logger.debug(`[${PREFIX}] png_image_url: ${imgur_url}`);
                        embed.setThumbnail(imgur_url);
                        // logger.debug(`[${PREFIX}] detailsURL: ${detailsURL}`);
                        logger.debug(`[${PREFIX}] Starting axios details2 request`);
                        interaction.reply({ embeds: [embed], ephemeral: false });
                        logger.debug(`[${PREFIX}] finished!`);
                    }).catch(function(error) {
                        logger.error(`[${PREFIX}] error4: ${error}`);
                        interaction.reply({ embeds: [embed], ephemeral: false });
                    });
                }).catch(function(error) {
                    logger.error(`[${PREFIX}] error3: ${error}`);
                    interaction.reply({ embeds: [embed], ephemeral: false });
                });
            }).catch(function(error) {
                logger.error(`[${PREFIX}] error2: ${error}`);
                interaction.reply({ embeds: [embed], ephemeral: false });
            });
        }).catch(function(error) {logger.error(`[${PREFIX}] error1: ${error}`);});
    },
};
