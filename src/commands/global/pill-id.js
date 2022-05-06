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

    // Get info from drugs.com
    // const url = `https://www.drugs.com/imprints.php`
    const document = await axios.get(`https://www.drugs.com/imprints.php?imprint=${inputImprint}&color=${pillColorId}&shape=${pillShapeId}`)
      .then(res => new JSDOM(res.data, { includeNodeLocations: true }))
      .then(dom => dom.window.document);

    if (!document.querySelector('.pid-box-1')) {
      logger.debug(`[${PREFIX}] No results found for ${inputImprint} ${inputColor} ${inputShape}`);
      return;
    }
    const firstResult = document.querySelector('.pid-box-1');

    // TODO: HTML cannot be regularly expressed, should use DOM API via JSDOM
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
      color = colormatched.at(2);
      color = color.replace('&amp;', '&');
    }
    logger.debug(`[${PREFIX}] color: ${color}`);

    const shapematched = details.match(shaperegex);
    const shape = shapematched[2];
    logger.debug(`[${PREFIX}] shape: ${shape}`);

    const embed = template.embedTemplate()
      .setAuthor({
        name: 'Drugs.com',
        url: 'https://www.drugs.com/',
        iconURL: 'https://i.imgur.com/YRTrM0c.png',
      })
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
    const doc = await axios.get(detailsURL)
      .then(res => new JSDOM(res.data))
      .then(dom => dom.window.document);

    if (!doc.querySelector('.pid-list')) {
      logger.debug(`[${PREFIX}] No results found for ${inputImprint} ${inputColor} ${inputShape}`);
      return;
    }
    const details2 = doc.querySelector('.pid-list').innerHTML;
    // logger.debug(`[${PREFIX}] details2: ${details2}`);

    const availmatched = details2.match(/(<dt>Availability<\/dt>\n.*>)(.*)(<\/dd>)/);
    // logger.debug(`[${PREFIX}] availmatched: ${availmatched[2]}`);

    const classMatched = details2.match(/(<dt>Drug Class<\/dt>\s.*\s.*">)(.*)(<\/a)/);
    // logger.debug(`[${PREFIX}] class_matched: ${class_matched[2]}`);

    const desc = doc.querySelector('meta[name="twitter:description"]').content;
    // const desc = document.querySelector('meta[property=\'og:description\']');
    // logger.debug(`[${PREFIX}] desc: ${desc}`);
    embed.setDescription(desc);

    // logger.debug(`[${PREFIX}] first_result: ${first_result}`);
    embed.addFields(
      { name: 'Availability', value: availmatched[2], inline: true },
      { name: 'Class', value: classMatched[2], inline: true },
    );
    // eslint-disable-next-line
    // It seems like drugs.com has some weird image handling, so we need to download the image and upload the image to imgur
    // I will eventually cache these images so we don't need to download/upload every time
    logger.debug(`[${PREFIX}] Starting axios image request`);

    const imgurUrl = await axios.get(imageURL, {
      responseType: 'stream',
    })
      .then(res => imgurClient.upload({
        type: 'stream',
        image: res.data,
      }))
      .then(imgurRes => imgurRes.data.link)
      .catch(ex => {
        logger.error(`[${PREFIX}]`, ex);
        interaction.reply({
          embeds: [embed],
          ephemeral: false,
        });
        return Promise.reject(ex);
      });

    embed.setThumbnail(imgurUrl);
    interaction.reply({
      embeds: [embed],
      ephemeral: false,
    });
  },
};
