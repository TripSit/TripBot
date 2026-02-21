import {
  Colors, AttachmentBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle,
} from 'discord.js';
import { embedTemplate } from './embedTemplate';
import getAsset from './getAsset';

export async function mushroomPageEmbed(page: number) {
  // eslint-disable-next-line max-len
  const source = 'https://www.oaklandhyphae510.com/post/preliminary-tryptamine-potency-analysis-from-dried-homogenized-fruit-bodies-of-psilocybe-mushrooms';
  // eslint-disable-next-line max-len
  const disclaimer = 'The following data is based on preliminary research and development methods, does not represent final data and requires further peer review before being taken more seriously than \'interesting\'. However, this does represent meaningful, comparable data to the cultivators, to the consumers, and to the public.';
  const article = 'https://tripsitter.com/magic-mushrooms/average-potency/';
  if (page === 1) {
    return {
      embeds: [embedTemplate()
        .setTitle('Mushroom Potency Info')
        .setColor(Colors.Green)
        .setDescription(`${disclaimer}
      
          For more information check out [the source](${source}) and [this article](${article}).`)
        .setImage('attachment://mushroomInfoA.png')],
      files: [new AttachmentBuilder(await getAsset('mushroomInfoA'))],

      components: [new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId('mushroomPageTwo')
          .setLabel('Show Visual')
          .setStyle(ButtonStyle.Primary),
      )],
    };
  }
  return {
    embeds: [embedTemplate()
      .setTitle('Mushroom Potency Info')
      .setColor(Colors.Green)
      .setDescription(`${disclaimer}
    
        For more information check out [the source](${source}) and [this article](${article}).`)
      .setImage('attachment://mushroomInfoB.png')],
    files: [new AttachmentBuilder(await getAsset('mushroomInfoB'))],

    components: [new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId('mushroomPageOne')
        .setLabel('Back to Data')
        .setStyle(ButtonStyle.Danger),
    )],
  };
}

export default mushroomPageEmbed;
