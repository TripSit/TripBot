import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
} from 'discord.js';
import { parse } from 'path';
import { SlashCommand } from '../../@types/commandDef';
import { embedTemplate } from '../../utils/embedTemplate';
import { startLog } from '../../utils/startLog';
// import {whoisIRC} from '../../../global/commands/archive/g.whois';
import log from '../../../global/utils/log';

const PREFIX = parse(__filename).name;

export const discordTemplate: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('whois')
    .setDescription('IRC whois')
    .addStringOption(option => option
      .setDescription('User to whois!')
      .setRequired(true)
      .setName('target')),

  async execute(interaction:ChatInputCommandInteraction) {
    startLog(PREFIX, interaction);
    // const target = interaction.options.getString('target');

    // let body;

    // try {
    //   body = await whoisIRC(target!);
    // } catch (err) {
    //   const embed = embedTemplate()
    //     .setDescription(err.message)
    //     .setTitle(`Whois for ${target}`)
    //     .setColor(0x00FF00);
    //   interaction.reply({
    //     embeds: [embed],
    //     ephemeral: true,
    //   });
    //   return;
    // }

    // const embed = embedTemplate()
    //   .setDescription(body)
    //   .setTitle(`Whois for ${target}`)
    //   .setColor(0x00FF00);
    // interaction.reply({
    //   embeds: [embed],
    //   ephemeral: true,
    // });

    return true;
  },
};
