'use strict';

const path = require('path');
const { SlashCommandBuilder } = require('@discordjs/builders');
const axios = require('axios');
const { JSDOM } = require('jsdom');
const { ImgurClient } = require('imgur');
const logger = require('../../utils/logger');
const template = require('../../utils/embed-template');
const pillColors = require('../../assets/pill_colors.json');
const pillShapes = require('../../assets/pill_shapes.json');

const PREFIX = path.parse(__filename).name;

const {
  imgur_id: imgurId,
  imgur_secret: imgurSecret,
} = process.env;

const imgurClient = new ImgurClient({
  clientId: imgurId,
  clientSecret: imgurSecret,
});

/* Idea for this code inspired by PsyBot! https://github.com/v0idp/PsyBot */
module.exports = {
  data: new SlashCommandBuilder()
    .setName('pill_id')
    .setDescription('Search by pill qualities!')
    .addStringOption(option => option.setName('imprint')
      .setDescription('What are the markings on the pill?')
      .setRequired(true))
    .addStringOption(option => option.setName('color')
      .setDescription('What color is the pill?')
      .setRequired(true)
      .setAutocomplete(true))
    .addStringOption(option => option.setName('shape')
      .setDescription('What shape is the pill?')
      .setRequired(true)
      .setAutocomplete(true)),
  async execute(interaction) {
    const inputImprint = interaction.options.getString('imprint');
    const inputColor = interaction.options.getString('color');
    const inputShape = interaction.options.getString('shape');

    logger.info(`[${PREFIX}] starting getPill with parameters: Imprint: ${inputImprint} Color: ${inputColor} Shape: ${inputShape}`);

    // Loop through pill_colors to find the color
    let pillColorId = 0;
    for (let i = 0; i < pillColors.length; i += 1) {
      if (pillColors[i].key === inputColor) {
        pillColorId = pillColors[i].value;
      }
    }

    let pillShapeId = 0;
    for (let i = 0; i < pillShapes.length; i += 1) {
      if (pillShapes[i].key === inputShape) {
        pillShapeId = pillShapes[i].value;
      }
    }

    const url = `https://www.drugs.com/imprints.php?imprint=${inputImprint}&color=${pillColorId}&shape=${pillShapeId}`;
    // Get info from drugs.com
    // const url = `https://www.drugs.com/imprints.php`
    logger.debug(`[${PREFIX}] Starting axios base request to: ${url}`);
    // TODO: Flatten promise chains
    // TODO: Create axios client
    axios.request({
      method: 'GET',
      url,
      // eslint-disable-next-line
      // headers: { 'User-Agent': 'Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2272.96 Mobile Safari/537.36' },
      // headers: { 'User-Agent': 'Axios 0.21.1' },
    }).then(async response => {
      logger.debug(`[${PREFIX}] axios base request worked!`);
      const { document } = (new JSDOM(response.data, { includeNodeLocations: true })).window;

      if (!document.querySelector('.pid-box-1')) {
        logger.debug(`[${PREFIX}] No results found for ${inputImprint} ${inputColor} ${inputShape}`);
        return;
      }
      const firstResult = document.querySelector('.pid-box-1');

      const strengthregex = /(<li><b>Strength:<\/b> )(.*)(<\/li>)/;
      const imprintregex = /(\.html">)(.*)(<\/a>)/;
      const colorregex = /(<li><b>Color:<\/b> )(.*)(<\/li>)/;
      const shaperegex = /(<li><b>Shape:<\/b> )(.*)(<\/li>)/;

      const drug = firstResult.getElementsByClassName('imprintdruglink')[0].innerHTML;
      // logger.debug(`[${PREFIX}] drug: ${drug}`);
      const details = firstResult.getElementsByClassName('ddc-pid-details')[0].innerHTML;
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

      const embed = template.embedTemplate()
        .setAuthor({ name: 'Drugs.com', url: 'https://www.drugs.com/', iconURL: 'https://i.imgur.com/YRTrM0c.png' })
        .setTitle(drug)
        .addFields(
          { name: 'Imprint', value: imprint, inline: true },
          { name: 'Color', value: color, inline: true },
          { name: 'Shape', value: shape, inline: true },
          { name: 'Strength', value: strength, inline: true },
        );

      const imageURL = firstResult.querySelector('.ddc-pid-img').getAttribute('data-image-src');
      const detailsURL = `https://www.drugs.com${firstResult.querySelector('.ddc-btn.ddc-btn-sm').getAttribute('href')}`;
      embed.setURL(detailsURL);
      axios.request({
        // Get the image from drug.com
        method: 'GET',
        url: detailsURL,
      }).then(async detailsResponse => {
        const body = detailsResponse.data;
        const dom = (new JSDOM(body, { includeNodeLocations: true }));
        if (!dom.window.document.querySelector('.pid-list')) {
          logger.debug(`[${PREFIX}] No results found for ${inputImprint} ${inputColor} ${inputShape}`);
          return;
        }
        const details2 = dom.window.document.querySelector('.pid-list').innerHTML;
        // logger.debug(`[${PREFIX}] details2: ${details2}`);

        // TODO: Use DOM API instead of regexp
        const availRegex = /(<dt>Availability<\/dt>\n.*>)(.*)(<\/dd>)/;
        const availmatched = details2.match(availRegex);
        // logger.debug(`[${PREFIX}] availmatched: ${availmatched[2]}`);

        const classRegex = /(<dt>Drug Class<\/dt>\s.*\s.*">)(.*)(<\/a)/;
        const classMatched = details2.match(classRegex);
        // logger.debug(`[${PREFIX}] class_matched: ${class_matched[2]}`);

        const desc = dom.window.document.querySelector('meta[name="twitter:description"]').content;
        // const desc = dom.window.document.querySelector('meta[property=\'og:description\']');
        // logger.debug(`[${PREFIX}] desc: ${desc}`);
        embed.setDescription(desc);

        // logger.debug(`[${PREFIX}] first_result: ${first_result}`);
        embed.addFields(
          { name: 'Availability', value: availmatched[2], inline: true },
          { name: 'Class', value: classMatched[2], inline: true },
        );
        // It seems like drugs.com has some weird image handling, so we need to download
        // the image and upload the image to imgur
        // I will eventually cache these images so we don't need to download/upload every time
        let imgurUrl = '';
        logger.debug(`[${PREFIX}] Starting axios image request`);

        // Get the image from drug.com
        return axios.get(imageURL, { responseType: 'stream' })
          .then(imageResponse => imgurClient.upload({
            image: imageResponse.data,
            type: 'stream',
          }))
          .then(imgurResponse => {
            // Use the link in the thumbnail
            imgurUrl = imgurResponse.data.link;
            // logger.debug(`[${PREFIX}] png_image_url: ${imgur_url}`);
            embed.setThumbnail(imgurUrl);
            // logger.debug(`[${PREFIX}] detailsURL: ${detailsURL}`);
            logger.debug(`[${PREFIX}] Starting axios details2 request`);
            interaction.reply({ embeds: [embed], ephemeral: false });
            logger.debug(`[${PREFIX}] finished!`);
          });
      });
    })
      .catch(ex => {
        logger.error(`[${PREFIX}] error1:`, ex);
      });
  },
};
