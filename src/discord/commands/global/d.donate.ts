import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  Colors,
} from 'discord.js';
import { stripIndents } from 'common-tags';
import { SlashCommand } from '../../@types/commandDef';
import { embedTemplate } from '../../utils/embedTemplate';
import { donate } from '../../../global/commands/g.donate';
import commandContext from '../../utils/context';
// import log from '../../../global/utils/log';

const F = f(__filename);

export const dDonate: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('donate')
    .setDescription('Shows different ways to support TripSit!')
    .addBooleanOption(option => option.setName('ephemeral')
      .setDescription('Set to "True" to show the response only to you')),

  async execute(interaction:ChatInputCommandInteraction) {
    log.info(F, await commandContext(interaction));
    await interaction.deferReply({ ephemeral: (interaction.options.getBoolean('ephemeral') === true) });
    const donateInfo = await donate();
    const embed = embedTemplate()
      .setColor(Colors.Purple)
      .setTitle('🚀 **TripSit\'s Donation Info!** 🚀')
      .setURL('https://tripsit.me/donate/')
      .setDescription(stripIndents`
      At TripSit, we're all about harm reduction, and we'll never charge for our services or hide information behind paywalls or annoying ads. Our mission is to help anyone who needs it, no strings attached. 🌟

      But we can't pay for servers with good intentions alone, so your support means the world to us.

      There are two awesome ways to contribute:
      
      1️⃣ **Patreon Subscription**
      For as little as $1 a month, you can become a patron and keep supporting the good cause. 🌈
      
      2️⃣ **Ko-Fi Donation**
      If that isn't your style, you can give a one-time boost to our cause through Ko-Fi. ☕

      🎁 What's in it for you? Well, we've got some fantastic benefits for our supporters:
      
      - 📣 **Announcement**: We'll tell the guild you've made a difference in #vip-lounge.
      - 🪙 **Gold Lounge Access**: Gain entry to our exclusive donor space, #gold-lounge.
      - 🌈 **Special Donor Colors**: Deck out your Discord persona with unique colors.
      - 💎 **Supporter Role (Patreon)**: Be shown at the top of the member list with a unique icon.
      - 🎉 More surprises are in the works! Your suggestions are welcome.
      
      These are **permanent** benefits, excluding the Supporter role, which is only for active Patreons.
      
      No spare change? Boosting our server will also give you donor perks while your boost is active!

      Your donations directly fuel our server costs, ensuring TripSit keeps doing what we do best. 🌐 With enough support, we can even expand and provide new services – who's up for a Minecraft server? 😎

      Thank you for being a part of our journey, and for helping make the world a safer place! 💕
        `);
    // for (const entry of donateInfo) {
    donateInfo.forEach(entry => {
      if (entry.value.length > 0) {
        const hyperlink = `[Website](${entry.value})`;
        embed.addFields(
          {
            name: entry.name,
            value: `${entry.value !== '\u200B' ? hyperlink : entry.value}`,
            inline: true,
          },
        );
      }
    });
    await interaction.editReply({ embeds: [embed] });
    return true;
  },
};

export default dDonate;
