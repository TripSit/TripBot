import type { ChatInputCommandInteraction, GuildMember, TextChannel } from 'discord.js';
import type { ImagesResponse } from 'openai/resources';

import { stripIndents } from 'common-tags';
import { Colors, EmbedBuilder, MessageFlags, SlashCommandBuilder, time } from 'discord.js';
import { DateTime } from 'luxon';

import type { SlashCommand } from '../../@types/commandDef';

import { aiModerateReport, createImage } from '../../../global/commands/g.ai';
import commandContext from '../../utils/context';
import { embedTemplate } from '../../utils/embedTemplate';

const F = f(__filename);

const ephemeralExplanation = 'Set to "True" to show the response only to you';
const imageLimits = {
  [env.ROLE_PATRON]: 20,
  [env.ROLE_PATRON_TIER_1]: 20,
  [env.ROLE_PATRON_TIER_2]: 40,
  [env.ROLE_PATRON_TIER_3]: 60,
  [env.ROLE_PATRON_TIER_4]: 80,
  [env.ROLE_PATRON_TIER_5]: 100,
  [env.ROLE_TEAMTRIPSIT]: 20,
};

async function generate(interaction: ChatInputCommandInteraction): Promise<void> {
  const ephemeral = interaction.options.getBoolean('ephemeral')
    ? MessageFlags.Ephemeral
    : undefined;
  await interaction.deferReply({ flags: ephemeral });

  const description = interaction.options.getString('description', true);

  if (!interaction.member) {
    return;
  }

  const guildMember = interaction.member as GuildMember;

  // Find if the user has any of the roles mentioned in imageLimits keys
  const imageLimit = Object.entries(imageLimits).find((limit) =>
    guildMember.roles.cache.has(limit[0]),
  );

  if (!imageLimit) {
    await interaction.editReply(
      'This command is exclusive to active TripSit [Patreon](<https://www.patreon.com/tripsit>) subscribers.',
    );
    return;
  }

  const moduleReport = await aiModerateReport(description);

  log.debug(F, `modReport: ${JSON.stringify(moduleReport, null, 2)}`);

  const flagged = moduleReport.results.find((result) => result.flagged);

  if (flagged) {
    // Go through the flagged.categories and find the ones where the category value is true
    const flaggedCategories = Object.entries(flagged.categories).filter(
      (category) => category[1] === true,
    );
    await interaction.editReply(
      `Hold on there there bucko, this request violates OpenAI's usage policies regarding \
      ${flaggedCategories.map((category) => category[0]).join(', ')}`,
    );

    return;
  }

  const userData = await db.users.upsert({
    create: { discord_id: guildMember.id },
    update: {},
    where: { discord_id: guildMember.id },
  });

  const aiImageData = await db.ai_images.findMany({
    where: {
      user_id: userData.id,
    },
  });

  // The aiUsageData is a list of dates when images were generated
  // We create a list of images that were generated this month.
  const imagesThisMonth = aiImageData.filter((image) => {
    // log.debug(F, `imageDate: ${imageDate}`);
    const givenDate = DateTime.fromJSDate(image.created_at);
    const oneMonthAgo = DateTime.now().minus({ months: 1 });
    return givenDate > oneMonthAgo;
  }).length;

  if (imagesThisMonth > imageLimit[1] && guildMember.id !== env.DISCORD_OWNER_ID) {
    await interaction.editReply(stripIndents`Sorry, you have already generated ${imagesThisMonth} images this month. 
    Check out your /image library to see them all.`);
    return;
  }

  const channelAiImageLog = (await discordClient.channels.fetch(
    env.CHANNEL_AIIMAGELOG,
  )) as TextChannel;
  const embed = new EmbedBuilder()
    .setTitle('🖼️ AI Image Request')
    .setDescription(
      `**User:** ${guildMember.displayName}\n**Prompt:** '${description}'\n**Server:** ${interaction.guild?.name ?? 'Unknown'}`,
    )
    .setColor(Colors.Green)
    .setTimestamp();

  await channelAiImageLog.send({
    allowedMentions: {
      parse: [], // Prevents all pings
    },
    embeds: [embed],
  });

  let imageData = {} as ImagesResponse;

  try {
    imageData = await createImage(description, guildMember.id);
  } catch (error) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((error as any).error.code === 'content_policy_violation') {
      await interaction.editReply(`Hold on there there bucko, this request violates OpenAI's usage policies. 
      Try again with something more wholesome.`);
      await channelAiImageLog.send(
        `${guildMember.displayName}'s request violated OpenAI's usage policies.`,
      );
      return;
    }
    await channelAiImageLog.send(
      `Error generating ${guildMember.displayName}'s image: ${JSON.stringify(error, null, 2)}`,
    );
  }

  log.debug(F, `openAi responded response: ${JSON.stringify(imageData, null, 2)}`);
  const { data } = imageData;
  if (!data) {
    await interaction.editReply('No images were generated. Please try again.');
    return;
  }
  const [image] = data;
  await db.ai_images.create({
    data: {
      image_url: image.url!,
      model: 'DALL_E_3',
      prompt: description,
      revised_prompt: image.revised_prompt ?? '',
      user_id: userData.id,
    },
  });

  const newAaiUsageData = await db.ai_images.findMany({
    where: {
      user_id: userData.id,
    },
  });

  const imagesGenerated = newAaiUsageData.length;

  const allUsageData = await db.ai_images.findMany();
  const totalImagesGenerated = allUsageData.length;

  await channelAiImageLog.send({
    embeds: [
      embedTemplate()
        .setAuthor({
          iconURL: guildMember.displayAvatarURL(),
          name: guildMember.user.username,
        })
        .setColor(Colors.Yellow)
        .addFields(
          {
            inline: false,
            name: 'Prompt',
            value: stripIndents`${description}`,
          },
          {
            inline: false,
            name: 'Revised Prompt',
            value: stripIndents`${image.revised_prompt}`,
          },
          {
            inline: true,
            name: 'Model',
            value: 'DALL_E_3',
          },
          {
            inline: true,
            name: 'User Images Generated',
            value: `${imagesGenerated} ($${imagesGenerated * 0.04})`,
          },
          {
            inline: true,
            name: 'Total Images Generated',
            value: `${totalImagesGenerated} ($${totalImagesGenerated * 0.04})`,
          },
        )
        .setImage(image.url!),
    ],
  });

  await interaction.editReply({
    embeds: [
      embedTemplate()
        .setAuthor(null)
        .setColor(null)
        .setImage(image.url!)
        .setFooter({
          text: stripIndents`Beta feature only available to active TripSit Patreon subscribers \
           (${imageLimit[1] - imagesThisMonth} images left).`,
        }),
    ],
  });
}

async function help(interaction: ChatInputCommandInteraction): Promise<void> {
  const ephemeral = interaction.options.getBoolean('ephemeral')
    ? MessageFlags.Ephemeral
    : undefined;
  await interaction.deferReply({ flags: ephemeral });
  await interaction.editReply({
    embeds: [
      embedTemplate().setTitle('Image Generation Help').setDescription(stripIndents`
      🌟 Welcome to TripBot's Advanced Image Generation! 🌟

      🎨 Harnessing the power of Dall-E 3, we transform your descriptions into stunning visuals. \
      Imagine the possibilities!
      
      🔒 Exclusive Access for Our Supporters: This feature is a special thank you to our active TripSit Patreon \
      subscribers. Your support helps us cover the higher costs of this advanced technology (just 4 cents per image!).

      🔄 Fair Usage Policy: As a Patreon subscriber, you're entitled to X images per rolling month. \
      Think of it as a 'credit' system: each image you generate counts against your monthly quota, \
      and you regain that 'credit' 30 days after each generation. This ensures fair access for everyone – \
      it's not a monthly reset, but a continuous cycle of creativity!
      
      🧠 Enhanced for Creativity: To ensure the best results, we fine-tune your requests for optimal AI compatibility. \
      Expect more vivid and accurate interpretations of your ideas!
      
      📜 Play by the Rules: All requests must comply with OpenAI's terms and conditions. Let's keep creativity \
      responsible!
      
      🔍 Respect and Responsibility: We log all requests for accountability. Misuse of this amazing tool will lead \
      to a ban from the bot. Let's maintain a respectful and imaginative community!

      🛠️ Control for Server Owners: Discord server owners have the power to enable or disable this command through the \
      app menu. We believe in giving you the control to tailor the experience to your community's needs.
      
      Happy imagining! 🚀
        `),
    ],
  });
}

async function library(interaction: ChatInputCommandInteraction): Promise<void> {
  const ephemeral = interaction.options.getBoolean('ephemeral')
    ? MessageFlags.Ephemeral
    : undefined;
  await interaction.deferReply({ flags: ephemeral });
  if (!interaction.member) {
    return;
  }

  const guildMember = interaction.member as GuildMember;

  const userData = await db.users.upsert({
    create: { discord_id: guildMember.id },
    update: {},
    where: { discord_id: guildMember.id },
  });

  const aiImageData = await db.ai_images.findMany({
    where: {
      user_id: userData.id,
    },
  });

  const imagesGenerated = aiImageData.length;

  // Create a string that tells the user the details on each image they have generated

  const imageDetails = aiImageData.map((image) => {
    const createdDate = DateTime.fromJSDate(image.created_at).toUnixInteger();
    return `${time(createdDate, 'R')} - [${image.prompt}](<${image.image_url}>)`;
  });

  if (imageDetails.length === 0) {
    await interaction.editReply({
      embeds: [
        embedTemplate()
          .setAuthor({
            iconURL: guildMember.displayAvatarURL(),
            name: guildMember.user.username,
          })
          .setColor(Colors.Yellow)
          .setDescription('You have not generated any images yet.')
          .addFields({
            inline: true,
            name: 'Images Generated',
            value: `${imagesGenerated} ($${imagesGenerated * 0.04})`,
          }),
      ],
    });
    return;
  }

  await interaction.editReply({
    embeds: [
      embedTemplate()
        .setAuthor({
          iconURL: guildMember.displayAvatarURL(),
          name: guildMember.user.username,
        })
        .setColor(Colors.Yellow)
        .setDescription(imageDetails.join('\n'))
        .addFields({
          inline: true,
          name: 'Images Generated',
          value: `${imagesGenerated} ($${imagesGenerated * 0.04})`,
        }),
    ],
  });
}

export const image: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('image')
    .setDescription("TripBot's Image Generator")
    .setIntegrationTypes([0])
    .addSubcommand((subcommand) =>
      subcommand.setDescription('Information on the imagen function.').setName('help'),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setDescription('Generate an image')
        .addStringOption((option) =>
          option.setName('description').setDescription('Describe your image.').setRequired(true),
        )
        .addBooleanOption((option) =>
          option.setName('ephemeral').setDescription(ephemeralExplanation),
        )
        .setName('generate'),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setDescription('Returns all images you have generated')
        .addBooleanOption((option) =>
          option.setName('ephemeral').setDescription(ephemeralExplanation),
        )
        .setName('library'),
    ),

  async execute(interaction) {
    log.info(F, await commandContext(interaction));

    const command = interaction.options.getSubcommand().toUpperCase() as
      | 'GENERATE'
      | 'HELP'
      | 'LIBRARY';
    switch (command) {
      case 'GENERATE': {
        await generate(interaction);
        break;
      }
      case 'HELP': {
        await help(interaction);
        break;
      }
      case 'LIBRARY': {
        await library(interaction);
        break;
      }
      default: {
        help(interaction);
        break;
      }
    }

    return true;
  },
};

export default image;
