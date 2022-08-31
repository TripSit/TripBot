import {
  SlashCommandBuilder,
} from 'discord.js';
import {SlashCommand} from '../../utils/commandDef';
import {embedTemplate} from '../../utils/embedTemplate';
import env from '../../../global/utils/env.config';
import axios from 'axios';
import logger from '../../../global/utils/logger';
const PREFIX = require('path').parse(__filename).name;

export const discordTemplate: SlashCommand = {
  data: new SlashCommandBuilder()
      .setName('urban_define')
      .setDescription('Define a word on Urban Dictionary')
      .addStringOption((option) => option
          .setName('define')
          .setDescription('What do you want to define?')
          .setRequired(true)),

  async execute(interaction) {
    const term = interaction.options.getString('define')!;
    logger.debug(`[${PREFIX}] UrbanDefine looking for ${term}`);
    const {data} = await axios.get(
        'https://mashape-community-urban-dictionary.p.rapidapi.com/define',
        {
          params: {term},
          headers: {
            'X-RapidAPI-Host': 'mashape-community-urban-dictionary.p.rapidapi.com',
            'X-RapidAPI-Key': env.RAPID_TOKEN,
            'useQueryString': true,
          },
        },
    );

    logger.debug(`[${PREFIX}] UrbanDefine found ${data.list.length} results`);

    // Sort data by the thumbs_up value
    data.list.sort((a:any, b:any) => b.thumbs_up - a.thumbs_up);
    // logger.debug(`[${PREFIX}] data: ${JSON.stringify(data, null, 2)}`);
    const embed = embedTemplate()
        .setTitle(`Definition for: ${term}`)
        .addFields(
            {
              name: `Definition A (+${data.list[0].thumbs_up}/-${data.list[0].thumbs_down})`,
              value: `${data.list[0].definition.length > 1024 ?
                `${data.list[0].definition.slice(0, 1020)}...` :
                data.list[0].definition}`,
              inline: false,
            },
            {
              name: 'Example A',
              value: data.list[0].example,
              inline: false,
            },
        );
    if (data.list[1]) {
      embed.addFields(
          {
            name: `Definition B (+${data.list[1].thumbs_up}/-${data.list[1].thumbs_down})`,
            value: `${data.list[1].definition.length > 1024 ?
              `${data.list[1].definition.slice(0, 1020)}...` :
              data.list[1].definition}`,
            inline: false},
          {
            name: 'Example B',
            value: data.list[1].example,
            inline: false,
          },
      );
    }
    if (data.list[2]) {
      embed.addFields(
          {
            name: `Definition C (+${data.list[2].thumbs_up}/-${data.list[2].thumbs_down})`,
            value: `${data.list[2].definition.length > 1024 ?
              `${data.list[2].definition.slice(0, 1020)}...` : data.list[2].definition}`,
            inline: false,
          },
          {
            name: 'Example C',
            value: data.list[2].example,
            inline: false,
          },
      );
    }
    if (interaction.replied) {
      interaction.followUp({embeds: [embed], ephemeral: false});
    } else {
      interaction.reply({embeds: [embed], ephemeral: false});
    }
    logger.debug(`[${PREFIX}] finished!`);
  },
};
