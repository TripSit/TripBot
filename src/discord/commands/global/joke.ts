import {
  SlashCommandBuilder,
} from 'discord.js';
import {SlashCommand} from '../../utils/commandDef';
import {embedTemplate} from '../../utils/embedTemplate';
import axios from 'axios';
import env from '../../../global/utils/env.config';
import logger from '../../../global/utils/logger';
const PREFIX = require('path').parse(__filename).name;

export const discordTemplate: SlashCommand = {
  data: new SlashCommandBuilder()
      .setName('joke')
      .setDescription('Random jokes'),

  async execute(interaction) {
    const {data} = await axios.get('https://jokeapi-v2.p.rapidapi.com/joke/Misc,Pun', {
      params: {
        'format': 'json',
        'blacklistFlags': 'nsfw,religious,political,racist,sexist,explicit',
        'safe-mode': 'true',
      },
      headers: {
        'X-RapidAPI-Host': 'jokeapi-v2.p.rapidapi.com',
        'X-RapidAPI-Key': env.RAPID_TOKEN,
      },
    });

    const embed = embedTemplate();
    if (data.type === 'twopart') embed.setTitle(data.setup).setDescription(data.delivery);
    else embed.setTitle(data.joke);

    if (!interaction.replied) {
      interaction.reply({
        embeds: [embed],
        ephemeral: false,
      });
    } else {
      interaction.followUp({
        embeds: [embed],
        ephemeral: false,
      });
    }

    logger.debug(`[${PREFIX}] finished!`);
  },
};
