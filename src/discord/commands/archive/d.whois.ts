import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
} from 'discord.js';
import { SlashCommand } from '../../@types/commandDef';
import { embedTemplate } from '../../utils/embedTemplate';
import commandContext from '../../utils/context';
// import {whoisIRC} from '../../../global/commands/archive/g.whois';

const F = f(__filename);

export const discordTemplate: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('whois')
    .setDescription('IRC whois')
    .addStringOption(option => option
      .setDescription('User to whois!')
      .setRequired(true)
      .setName('target')),

  async execute(interaction:ChatInputCommandInteraction) {
    log.info(F, await commandContext(interaction));
    // const target = interaction.options.getString('target');

    // let body;

    // try {
    //   body = await whoisIRC(target!);
    // } catch (err) {
    //   const embed = embedTemplate()
    //     .setDescription(err.message)
    //     .setTitle(`Whois for ${target}`)
    //     .setColor(0x00FF00);
    //   await interaction.reply({
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
