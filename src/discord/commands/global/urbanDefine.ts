import {
  SlashCommandBuilder,
} from 'discord.js';
import {SlashCommand} from '../../@types/commandDef';
import {embedTemplate} from '../../utils/embedTemplate';
import env from '../../../global/utils/env.config';
import axios from 'axios';
import logger from '../../../global/utils/logger';
import * as path from 'path';
const PREFIX = path.parse(__filename).name;

export const durbandefine: SlashCommand = {
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

    type urbanDefinition = {
      definition: string,
      permalink: string,
      thumbs_up: number,
      sound_urls: string[],
      author: string,
      word: string,
      defid: number,
      current_vote: string,
      written_on: string,
      example: string,
      thumbs_down: number
    }

    logger.debug(`[${PREFIX}] UrbanDefine found ${data.list.length} results`);

    // Sort data by the thumbs_up value
    (data.list as urbanDefinition[]).sort((a, b) => b.thumbs_up - a.thumbs_up);
    // logger.debug(`[${PREFIX}] data: ${JSON.stringify(data, null, 2)}`);
    const definition = `${data.list[0].definition.length > 1024 ?
      `${data.list[0].definition.slice(0, 1020)}...` :
      data.list[0].definition}`.replace(/\[|\]/g, '');

    const example = `${data.list[0].example}`.replace(/\[|\]/g, '');

    const upvotes = `${data.list[0].thumbs_up}`;
    const downvotes = `${data.list[0].thumbs_down}`;

    const embed = embedTemplate()
        .setDescription(`**Definition for *${term}* ** (+${upvotes}/-${downvotes})
        ${definition}
        Example: ${example}`);
    if (interaction.replied) {
      interaction.followUp({embeds: [embed], ephemeral: false});
    } else {
      interaction.reply({embeds: [embed], ephemeral: false});
    }
    logger.debug(`[${PREFIX}] finished!`);
  },
};
