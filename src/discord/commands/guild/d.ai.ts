/* eslint-disable sonarjs/no-duplicate-string */
import {
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  Colors,
  SlashCommandBuilder,
  ModalSubmitInteraction,
  ChatInputCommandInteraction,
  GuildMember,
  time,
  Message,
  TextChannel,
  ThreadChannel,
  TextBasedChannel,
  CategoryChannel,
  ForumChannel,
  ButtonBuilder,
  ButtonStyle,
  ButtonInteraction,
  APIEmbedField,
  EmbedBuilder,
  APIButtonComponent,
  APIActionRowComponent,
  APIMessageComponentEmoji,
} from 'discord.js';
import {
  APIInteractionDataResolvedChannel,
  ChannelType,
  TextInputStyle,
} from 'discord-api-types/v10';
import { stripIndents } from 'common-tags';
import {
  PrismaClient,
  ai_channels,
  ai_model,
  ai_moderation,
  ai_personas,
} from '@prisma/client';
import OpenAI from 'openai';
import { paginationEmbed } from '../../utils/pagination';
import { SlashCommand } from '../../@types/commandDef';
import { embedTemplate } from '../../utils/embedTemplate';
import commandContext from '../../utils/context';
import { moderate } from '../../../global/commands/g.moderate';
import { sleep } from './d.bottest';
import aiChat, { aiModerate } from '../../../global/commands/g.ai';
import { UserActionType } from '../../../global/@types/database';
import { parseDuration } from '../../../global/utils/parseDuration';

const db = new PrismaClient({ log: ['error'] });

const F = f(__filename);

const maxHistoryLength = 5;

const ephemeralExplanation = 'Set to "True" to show the response only to you';
const personaDoesntExist = 'This persona does not exist. Please create it first.';
const confirmationCodes = new Map<string, string>();
const tripbotUAT = '@TripBot UAT (Moonbear)';

// Costs per 1k tokens
const aiCosts = {
  GPT_3_5_TURBO: {
    input: 0.0015,
    output: 0.002,
  },
  GPT_3_5_TURBO_1106: {
    input: 0.001,
    output: 0.002,
  },
  GPT_4: {
    input: 0.03,
    output: 0.06,
  },
  GPT_4_1106_PREVIEW: {
    input: 0.01,
    output: 0.03,
  },
  GPT_4_1106_VISION_PREVIEW: {
    input: 0.01,
    output: 0.03,
  },
  DALL_E_2: {
    input: 0.00,
    output: 0.04,
  },
  DALL_E_3: {
    input: 0.00,
    output: 0.02,
  },
} as AiCosts;

// define an object as series of keys (AiModel) and value that looks like {input: number, output: number}
type AiCosts = {
  [key in ai_model]: {
    input: number,
    output: number,
  }
};

type AiAction = 'HELP' | 'UPSERT' | 'GET' | 'DEL' | 'LINK' | 'MOD';

async function help(
  interaction: ChatInputCommandInteraction,
):Promise<void> {
  const visible = interaction.options.getBoolean('ephemeral') !== false;
  await interaction.deferReply({ ephemeral: !visible });

  const aboutEmbed = embedTemplate()
    .setTitle('AI Help')
    .setDescription(stripIndents`
      Welcome to TripBot's AI module!

      This is not a real AI, this is a Language Learning Model (LLM).
      It does not provide any kind of "intelligence", it just knows how to make a sentence that sounds good.
      As such, this feature will likely not be introduced to the trip sitting rooms, as it is not 100% trustworthy.
      But we can still have some fun and play with it in the social rooms!
      Here's how you can do that:

      **/ai set**
      This command is used to set the parameters of an AI persona, or create a new persona.
      A persona is how the bot will respond to queries. We can have multiple personas, each with their own parameters.
      The parameters are explained on the next page.
      EG: We can have a "helpful" persona, and a "funny" persona, and a "serious" persona, etc.
      **Anyone is welcome to create their own persona in the dev guild!**

      **/ai get**
      This command is used to get the parameters of an AI persona.
      You can either get the specific name of the persona
      Or you can enter a channel name to get which persona is linked to that channel.

      **/ai del**
      To delete a persona. You must provide a confirmation code to delete a persona.

      **/ai link**
      You can link threads, channels, and even entire categories to a persona.
      This allows the bot to respond to messages in those channels with the persona you set.
      You can also disable the link, so the bot will not respond in that channel.
      `);

  const parametersEmbed = embedTemplate()
    .setTitle('AI Help')
  /* eslint-disable max-len */
    .setDescription(stripIndents`
    This command is used to set the parameters of an AI persona, or create a new persona.
    The parameters are:
    **Name**
    > The name of the persona. This is used to identify the persona in the AI Get command.
    **Model**
    > The model to use for the persona. This is a dropdown list of available models.
    **Prompt**
    > The prompt to use for the persona. This is the text that the AI will use to generate responses.
    **Max Tokens**
    > The maximum number of tokens to use for the AI response.
    > What are tokens? https://platform.openai.com/tokenizer
    **Temperature**
    > Adjusts the randomness of the AI's answers.
    > Lower values make the AI more predictable and focused, while higher values make it more random and varied.
    > *Use this OR Top P, not both.*
    **Top P**
    > Limits the word choices the AI considers.
    > Using a high value means the AI picks from the most likely words, while a lower value allows for more variety but might include less common words.
    > *Use this OR Temperature, not both.*
    **Presence Penalty**
    > This adjusts the probability of words that are not initially very likely to appear, by making them more likely.
    > A higher value can make a response more creative or diverse, as it promotes the presence of words or phrases that the model might not normally prioritize.
    > For example, if you're looking for creative or unconventional answers, increasing the presence penalty can make the model consider a wider range of vocabularies.
    **Frequency Penalty**
    > This penalizes words or phrases that appear repeatedly in the output.
    > A positive value reduces the likelihood of repetition, which can be useful if you're noticing that the model is repeating certain phrases or words too often.
    > Conversely, a negative value would increase the chance of repetition, which might be useful if you want the model to emphasize a certain point.
    **Logit Bias**
    > How often to bias certain tokens. This is a JSON list.
    > *You can likely ignore this unless you really wanna tweak the AI.*
  `);

  paginationEmbed(interaction, [aboutEmbed, parametersEmbed]);
}

async function makePersonaEmbed(
  persona: ai_personas,
) {
  const createdBy = await db.users.findUniqueOrThrow({ where: { id: persona.created_by } });
  const guild = await discordClient.guilds.fetch(env.DISCORD_GUILD_ID);
  const createdByMember = await guild.members.fetch(createdBy.discord_id as string);

  const totalCost = (persona.total_tokens / 1000) * aiCosts[persona.ai_model].output;

  return embedTemplate()
    .setTitle(`Interaction with '${persona.name}' persona:`)
    .setColor(Colors.Blurple)
    .setFields([
      {
        name: 'Prompt',
        value: persona.prompt,
        inline: false,
      },
      {
        name: 'Model',
        value: persona.ai_model,
        inline: true,
      },
      {
        name: 'Max Tokens',
        value: persona.max_tokens.toString(),
        inline: true,
      },
      {
        name: 'Temperature',
        value: persona.temperature ? persona.temperature.toString() : 'N/A',
        inline: true,
      },
      {
        name: 'Presence Penalty',
        value: persona.presence_penalty.toString(),
        inline: true,
      },
      {
        name: 'Frequency Penalty',
        value: persona.frequency_penalty.toString(),
        inline: true,
      },
      {
        name: 'Top P',
        value: persona.top_p ? persona.top_p.toString() : 'N/A',
        inline: true,
      },
      {
        name: 'Logit Bias',
        value: `${persona.logit_bias}`,
        inline: false,
      },
      {
        name: 'Created At',
        value: time(persona.created_at, 'R'),
        inline: true,
      },
      {
        name: 'Created By',
        value: `<@${createdByMember.id}>`,
        inline: true,
      },
      {
        name: 'Total Tokens',
        value: `$${(totalCost).toFixed(6)}\n(${persona.total_tokens} tokens)`,
        inline: true,
      },
    ]);
}

async function upsert(
  interaction: ChatInputCommandInteraction,
):Promise<void> {
  const personaName = interaction.options.getString('name') ?? interaction.user.username;

  // Validations on the given information
  // Name must be < 50 characters
  if (personaName.length > 50) {
    embedTemplate()
      .setTitle('Modal')
      .setColor(Colors.Red)
      .setDescription('The name of the AI persona must be less than 50 characters.');
    return;
  }

  const existingPersona = await db.ai_personas.findFirst({
    where: {
      name: personaName,
    },
  });

  const modal = new ModalBuilder()
    .setCustomId(`aiPromptModal~${interaction.id}`)
    .setTitle('Modal')
    .addComponents(new ActionRowBuilder<TextInputBuilder>()
      .addComponents(new TextInputBuilder()
        .setCustomId('prompt')
        .setPlaceholder(stripIndents`
          You are a harm reduction assistant and should only give helpful, non-judgemental advice.
        `)
        .setValue(existingPersona?.prompt ?? '')
        .setLabel('Prompt (Personality)')
        .setStyle(TextInputStyle.Paragraph)));

  await interaction.showModal(modal);

  const filter = (i:ModalSubmitInteraction) => i.customId.includes('aiPromptModal');
  interaction.awaitModalSubmit({ filter, time: 0 })
    .then(async i => {
      if (i.customId.split('~')[1] !== interaction.id) return;
      await i.deferReply({ ephemeral: (interaction.options.getBoolean('ephemeral') === true) });

      // Get values
      let temperature = interaction.options.getNumber('temperature');
      const topP = interaction.options.getNumber('top_p');
      // log.debug(F, `temperature: ${temperature}, top_p: ${topP}`);

      // If both temperature and top_p are set, throw an error
      if (temperature && topP) {
        // log.debug(F, 'Both temperature and top_p are set');
        embedTemplate()
          .setTitle('Modal')
          .setColor(Colors.Red)
          .setDescription('You can only set one of temperature or top_p.');
        return;
      }

      // If both temperature and top_p are NOT set, set temperature to 1
      if (!temperature && !topP) {
        // log.debug(F, 'Neither temperature nor top_p are set');
        temperature = 1;
      }

      const userData = await db.users.upsert({
        where: { discord_id: interaction.user.id },
        create: { discord_id: interaction.user.id },
        update: { discord_id: interaction.user.id },
      });

      const aiPersona = {
        name: personaName,
        ai_model: interaction.options.getString('model') as ai_model ?? 'GPT_3_5_TURBO',
        prompt: i.fields.getTextInputValue('prompt'),
        temperature,
        top_p: topP,
        presence_penalty: interaction.options.getNumber('presence_penalty') ?? 0,
        frequency_penalty: interaction.options.getNumber('frequency_penalty') ?? 0,
        max_tokens: interaction.options.getNumber('tokens') ?? 500,
        created_by: existingPersona ? existingPersona.created_by : userData.id,
        created_at: existingPersona ? existingPersona.created_at : new Date(),
      } as ai_personas;

      const alreadyExists = await db.ai_personas.findFirst({
        where: {
          name: aiPersona.name,
        },
      });
      const action = alreadyExists ? 'updated' : 'created';

      await db.ai_personas.upsert({
        where: {
          name: aiPersona.name,
        },
        create: aiPersona,
        update: aiPersona,
      });

      await i.editReply({
        embeds: [embedTemplate()
          .setTitle('Modal')
          .setColor(Colors.Red)
          .setDescription(`Success! This persona has been ${action}!`)],
      });
    });
}

async function get(
  interaction: ChatInputCommandInteraction,
):Promise<void> {
  const visible = interaction.options.getBoolean('ephemeral') !== false;
  await interaction.deferReply({ ephemeral: !visible });
  const modelName = interaction.options.getString('name');
  const channel = interaction.options.getChannel('channel') ?? interaction.channel;

  let aiPersona:ai_personas | null = null;
  let description = '' as string;
  if (modelName) {
    aiPersona = await db.ai_personas.findUnique({
      where: {
        name: modelName,
      },
    });
  } else if (channel) {
    // Check if the channel is linked to a persona
    let aiLinkData = await db.ai_channels.findFirst({
      where: {
        channel_id: channel.id,
      },
    });
    if (aiLinkData) {
      log.debug(F, `Found aiLinkData on first go: ${JSON.stringify(aiLinkData, null, 2)}`);
      aiPersona = await db.ai_personas.findUnique({
        where: {
          id: aiLinkData.persona_id,
        },
      });
      if (aiPersona) {
        // eslint-disable-next-line max-len
        description = `Channel ${(channel as TextChannel).name} is linked with the **"${aiPersona.name ?? aiPersona}"** persona:`;
      }
    }

    if (!aiLinkData && (channel as ThreadChannel).parent) {
      log.debug(F, 'Channel is a Thread');
      // If the channel isn't listed in the database, check the parent
      aiLinkData = await db.ai_channels.findFirst({
        where: {
          channel_id: (channel as ThreadChannel).parent?.id,
        },
      });
      if (aiLinkData) {
        aiPersona = await db.ai_personas.findUnique({
          where: {
            id: aiLinkData.persona_id,
          },
        });
        if (aiPersona) {
        // eslint-disable-next-line max-len
          description = `Parent category/channel ${(channel as ThreadChannel).parent} is linked with the **"${aiPersona.name}"** persona:`;
        }
      }
    }

    if (!aiLinkData && (channel as ThreadChannel).parent && (channel as ThreadChannel).parent?.parent) {
      log.debug(F, 'Channel is a Thread, and no channel was set');
      // Threads have a parent channel, which has a parent category
      aiLinkData = await db.ai_channels.findFirst({
        where: {
          channel_id: (channel as ThreadChannel).parent?.parent?.id,
        },
      });
      if (aiLinkData) {
        aiPersona = await db.ai_personas.findUnique({
          where: {
            id: aiLinkData.persona_id,
          },
        });
        if (aiPersona) {
        // eslint-disable-next-line max-len
          description = `Parent category ${(channel as ThreadChannel).parent?.parent} is linked with the **"${aiPersona.name}"** persona:`;
        }
      }
    }
  }

  // log.debug(F, `aiPersona: ${JSON.stringify(aiPersona, null, 2)}`);

  if (!aiPersona) {
    await interaction.editReply({
      embeds: [embedTemplate()
        .setTitle('Modal')
        .setColor(Colors.Red)
        .setDescription(`
          There was an error retrieving the AI persona.
          It likely does not exist?
        `)],

    });
    return;
  }

  const personaEmbed = await makePersonaEmbed(aiPersona);
  if (description) personaEmbed.setDescription(description);
  await interaction.editReply({
    embeds: [personaEmbed],
  });
}

async function del(
  interaction: ChatInputCommandInteraction,
):Promise<void> {
  const visible = interaction.options.getBoolean('ephemeral') !== false;
  await interaction.deferReply({ ephemeral: !visible });
  const confirmation = interaction.options.getString('confirmation');
  const personaName = interaction.options.getString('name') ?? interaction.user.username;

  if (!confirmation) {
    const aiPersona = await db.ai_personas.findUnique({
      where: {
        name: personaName,
      },
    });

    if (!aiPersona) {
      await interaction.editReply({
        embeds: [embedTemplate()
          .setTitle('AI Del')
          .setDescription(stripIndents`
            The **"${personaName}"** persona does not exist! 
            
            Make sure you /ai set it first!         
          `)],
      });
      return;
    }

    // If the user did not provide a confirmation code, generate a new code and assign it to the user
    const code = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    confirmationCodes.set(`${interaction.user.id}${interaction.user.username}`, code);
    await interaction.editReply({
      embeds: [embedTemplate()
        .setTitle('AI Del')
        .setDescription(`
        Are you sure you want to delete the "${personaName}" AI persona?

        This action is irreversible, don't regret it later!

        If you're sure, please run the command again with the confirmation code: 
        
        **${code}**
        
        `)],
    });
    return;
  }

  // If the user did provide a confirmation code, check if it matches the one in confirmationCodes
  if (confirmationCodes.get(`${interaction.user.id}${interaction.user.username}`) !== confirmation) {
    await interaction.editReply({
      embeds: [embedTemplate()
        .setTitle('AI Del')
        .setDescription(stripIndents`The confirmation code you provided was incorrect.
      If you want to delete this AI persona, please run the command again and provide the correct code.`)],
    });
    return;
  }

  await db.ai_personas.delete({
    where: {
      name: personaName,
    },
  });

  confirmationCodes.delete(`${interaction.user.id}${interaction.user.username}`);
  await interaction.editReply({
    embeds: [embedTemplate()
      .setTitle('Modal')
      .setColor(Colors.Blurple)
      .setDescription('Success: Persona was deleted!')],
  });
}

async function getLinkedChannel(
  channel: CategoryChannel | ForumChannel | APIInteractionDataResolvedChannel | TextBasedChannel,
):Promise<ai_channels | null> {
  // With the way AI personas work, they can be assigned to a category, channel, or thread
  // This function will check if the given channel is linked to an AI persona
  // If it is not, it will check the channel's parent; either the Category or Channel (in case of Thread)
  // If the parent isn't linked, it'll check the parent's parent; this is only for Thread channels.
  // Once a link is fount, it will return that link data
  // If no link is found, it'll return null

  // Check if the channel is linked to a persona
  let aiLinkData = await db.ai_channels.findFirst({ where: { channel_id: channel.id } });

  // If the channel isn't listed in the database, check the parent
  if (!aiLinkData && 'parent' in channel && channel.parent) {
    aiLinkData = await db.ai_channels.findFirst({ where: { channel_id: channel.parent.id } });
    // If /that/ channel doesn't exist, check the parent of the parent, this is for threads
    if (!aiLinkData && channel.parent.parent) {
      aiLinkData = await db.ai_channels.findFirst({ where: { channel_id: channel.parent.parent.id } });
    }
  }

  return aiLinkData;
}

async function link(
  interaction: ChatInputCommandInteraction,
):Promise<void> {
  const visible = interaction.options.getBoolean('ephemeral') !== false;
  await interaction.deferReply({ ephemeral: !visible });

  const personaName = interaction.options.getString('name') ?? interaction.user.username;
  const toggle = (interaction.options.getString('toggle') ?? 'enable') as 'enable' | 'disable';
  const textChannel = interaction.options.getChannel('channel') ?? interaction.channel;

  const response = '' as string;
  if (toggle === 'enable') {
    if (!textChannel) {
      await interaction.editReply({
        embeds: [embedTemplate()
          .setTitle('Modal')
          .setColor(Colors.Red)
          .setDescription('You must provide a text channel to link to.')],

      });
      return;
    }
    // response = await aiLink(personaName, textChannel.id, toggle);

    const personaData = await db.ai_personas.findUnique({
      where: {
        name: personaName,
      },
    });

    if (!personaData) {
      await interaction.editReply({
        embeds: [embedTemplate()
          .setTitle('Modal')
          .setColor(Colors.Red)
          .setDescription(personaDoesntExist)],

      });
      return;
    }

    const aiLinkData = await db.ai_channels.findFirst({
      where: {
        channel_id: textChannel.id,
      },
    });

    if (aiLinkData) {
      await db.ai_channels.update({
        where: {
          id: aiLinkData.id,
        },
        data: {
          channel_id: textChannel.id,
          persona_id: personaData.id,
        },
      });
      await interaction.editReply({
        embeds: [embedTemplate()
          .setTitle('Modal')
          .setColor(Colors.Red)
          .setDescription(`Success: The link between ${personaName} and <#${textChannel.id}> was updated!`)],

      });
      return;
    }

    await db.ai_channels.create({
      data: {
        channel_id: textChannel.id,
        persona_id: personaData.id,
      },
    });
    await interaction.editReply({
      embeds: [embedTemplate()
        .setTitle('Modal')
        .setColor(Colors.Red)
        .setDescription(`Success: The link between ${personaName} and <#${textChannel.id}> was created!`)],

    });
    return;
  }

  if (textChannel) {
    // response = await aiLink(personaName, textChannel.id, toggle);
    const existingPersona = await db.ai_personas.findUnique({
      where: {
        name: personaName,
      },
    });

    if (!existingPersona) {
      await interaction.editReply({
        embeds: [embedTemplate()
          .setTitle('Modal')
          .setColor(Colors.Red)
          .setDescription(personaDoesntExist)],

      });
      return;
    }

    let existingLink = await db.ai_channels.findFirst({
      where: {
        channel_id: textChannel.id,
        persona_id: existingPersona.id,
      },
    });

    if (!existingLink) {
      existingLink = await db.ai_channels.findFirst({
        where: {
          channel_id: textChannel.id,
        },
      });

      if (!existingLink) {
        await interaction.editReply({
          embeds: [embedTemplate()
            .setTitle('Modal')
            .setColor(Colors.Red)
            .setDescription(`Error: No link to <#${textChannel.id}> found!`)],

        });
        return;
      }
      const personaData = await db.ai_personas.findUnique({
        where: {
          id: existingLink.persona_id,
        },
      });
      if (!personaData) {
        await interaction.editReply({
          embeds: [embedTemplate()
            .setTitle('Modal')
            .setColor(Colors.Red)
            .setDescription('Error: No persona found for this link!')],

        });
        return;
      }
      await db.ai_channels.delete({
        where: {
          id: existingLink.id,
        },
      });
    }
  } else if (interaction.channel) {
    const aiLinkData = await getLinkedChannel(interaction.channel);
    if (aiLinkData) {
      // response = await aiLink(personaName, aiLinkData?.channel_id, toggle);

      const existingPersona = await db.ai_personas.findUnique({
        where: {
          name: personaName,
        },
      });

      if (!existingPersona) {
        await interaction.editReply({
          embeds: [embedTemplate()
            .setTitle('Modal')
            .setColor(Colors.Red)
            .setDescription(personaDoesntExist)],

        });
        return;
      }

      let existingLink = await db.ai_channels.findFirst({
        where: {
          channel_id: aiLinkData.channel_id,
          persona_id: existingPersona.id,
        },
      });

      if (!existingLink) {
        existingLink = await db.ai_channels.findFirst({
          where: {
            channel_id: aiLinkData.channel_id,
          },
        });

        if (!existingLink) {
          await interaction.editReply({
            embeds: [embedTemplate()
              .setTitle('Modal')
              .setColor(Colors.Red)
              .setDescription(`Error: No link to <#${aiLinkData.channel_id}> found!`)],

          });
          return;
        }
        const personaData = await db.ai_personas.findUnique({
          where: {
            id: existingLink.persona_id,
          },
        });
        if (!personaData) {
          await interaction.editReply({
            embeds: [embedTemplate()
              .setTitle('Modal')
              .setColor(Colors.Red)
              .setDescription('Error: No persona found for this link!')],

          });
          return;
        }
        await db.ai_channels.delete({
          where: {
            id: existingLink.id,
          },
        });
      }
    } else {
      await interaction.editReply({
        embeds: [embedTemplate()
          .setTitle('Modal')
          .setColor(Colors.Red)
          .setDescription('This channel is not linked to an AI persona.')],

      });
      return;
    }
  } else {
    await interaction.editReply({
      embeds: [embedTemplate()
        .setTitle('Modal')
        .setColor(Colors.Red)
        .setDescription('You must provide a text channel to link to.')],

    });
    return;
  }

  log.debug(F, `response: ${response}`);

  if (!response.startsWith('Success')) {
    await interaction.editReply({
      embeds: [embedTemplate()
        .setTitle('Modal')
        .setColor(Colors.Red)
        .setDescription(response)],

    });
    return;
  }

  confirmationCodes.delete(`${interaction.user.id}${interaction.user.username}`);
  await interaction.editReply({
    embeds: [embedTemplate()
      .setTitle('Modal')
      .setColor(Colors.Blurple)
      .setDescription(response)],
  });
}

async function mod(
  interaction: ChatInputCommandInteraction,
):Promise<void> {
  if (!interaction.guild) return;
  await interaction.deferReply({ ephemeral: true });

  const moderationData = await db.ai_moderation.upsert({
    where: {
      guild_id: interaction.guild.id,
    },
    create: {
      guild_id: interaction.guild.id,
    },
    update: {},
  });

  await db.ai_moderation.update({
    where: {
      guild_id: interaction.guild.id,
    },
    data: {
      harassment: interaction.options.getNumber('harassment') ?? moderationData.harassment,
      harassment_threatening: interaction.options.getNumber('harassment_threatening') ?? moderationData.harassment_threatening,
      hate: interaction.options.getNumber('hate') ?? moderationData.hate,
      hate_threatening: interaction.options.getNumber('hate_threatening') ?? moderationData.hate_threatening,
      self_harm: interaction.options.getNumber('self_harm') ?? moderationData.self_harm,
      self_harm_instructions: interaction.options.getNumber('self_harm_instructions') ?? moderationData.self_harm_instructions,
      self_harm_intent: interaction.options.getNumber('self_harm_intent') ?? moderationData.self_harm_intent,
      sexual: interaction.options.getNumber('sexual') ?? moderationData.sexual,
      sexual_minors: interaction.options.getNumber('sexual_minors') ?? moderationData.sexual_minors,
      violence: interaction.options.getNumber('violence') ?? moderationData.violence,
      violence_graphic: interaction.options.getNumber('violence_graphic') ?? moderationData.violence_graphic,
    },
  });
}

async function saveThreshold(
  interaction: ButtonInteraction,
):Promise<void> {
  log.debug(F, 'saveThreshold started');
  const buttonID = interaction.customId;
  log.debug(F, `buttonID: ${buttonID}`);
  if (!interaction.guild) return;

  const [,, category, amount] = interaction.customId.split('~');
  const amountFloat = parseFloat(amount);

  const buttonRows = interaction.message.components.map(row => row.toJSON() as APIActionRowComponent<APIButtonComponent>);
  // log.debug(F, `buttonRows: ${JSON.stringify(buttonRows, null, 2)}`);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const categoryRow = buttonRows.find(row => row.components.find(button => (button as any).custom_id?.includes(category))) as APIActionRowComponent<APIButtonComponent>;
  // log.debug(F, `categoryRow: ${JSON.stringify(categoryRow, null, 2)}`);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const saveButton = categoryRow?.components.find(button => (button as any).custom_id?.includes('save'));

  const labelBreakdown = saveButton?.label?.split(' ') as string[];
  labelBreakdown.splice(0, 1, 'Saved');
  const newLabel = labelBreakdown.join(' ');

  // Replace the save button with the new value
  categoryRow.components?.splice(4, 1, {
    custom_id: `aiMod~save~${category}~${amountFloat}`,
    label: newLabel,
    emoji: '💾' as APIMessageComponentEmoji,
    style: ButtonStyle.Success,
    type: 2,
  } as APIButtonComponent);

  // Replace the category row with the new buttons
  buttonRows.splice(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    buttonRows.findIndex(row => row.components.find(button => (button as any).custom_id?.includes(category))),
    1,
    categoryRow,
  );

  const moderationData = await db.ai_moderation.upsert({
    where: {
      guild_id: interaction.guild.id,
    },
    create: {
      guild_id: interaction.guild.id,
    },
    update: {},
  });

  const oldValue = moderationData[category as keyof typeof moderationData];

  await db.ai_moderation.update({
    where: {
      guild_id: interaction.guild.id,
    },
    data: {
      [category]: amountFloat,
    },
  });

  // Get the channel to send the message to
  const channelAiModLog = await discordClient.channels.fetch(env.CHANNEL_AIMOD_LOG) as TextChannel;
  await channelAiModLog.send({
    content: `${interaction.member} adjusted the ${category} limit from ${oldValue} to ${amountFloat}`,
  });

  await interaction.update({
    components: buttonRows,
  });
}

async function adjustThreshold(
  interaction: ButtonInteraction,
):Promise<void> {
  log.debug(F, 'adjustThreshold started');
  // const buttonID = interaction.customId;
  // log.debug(F, `buttonID: ${buttonID}`);

  const [,, category, amount] = interaction.customId.split('~');
  const amountFloat = parseFloat(amount);

  // Go through the components on the message and find the button that has a customID that includes 'save'
  const buttonRows = interaction.message.components.map(row => row.toJSON() as APIActionRowComponent<APIButtonComponent>);
  // log.debug(F, `buttonRows: ${JSON.stringify(buttonRows, null, 2)}`);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const categoryRow = buttonRows.find(row => row.components.find(button => (button as any).custom_id?.includes(category))) as APIActionRowComponent<APIButtonComponent>;
  // log.debug(F, `categoryRow: ${JSON.stringify(categoryRow, null, 2)}`);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const saveButton = categoryRow?.components.find(button => (button as any).custom_id?.includes('save'));
  log.debug(F, `saveButton: ${JSON.stringify(saveButton, null, 2)}`);

  const saveValue = parseFloat(saveButton?.label?.split(' ')[3] as string);
  log.debug(F, `saveValue: ${JSON.stringify(saveValue, null, 2)}`);

  const newValue = saveValue + amountFloat;
  log.debug(F, `newValue: ${JSON.stringify(newValue.toFixed(2), null, 2)}`);

  const labelBreakdown = saveButton?.label?.split(' ') as string[];
  labelBreakdown.splice(3, 1, newValue.toFixed(2));
  const newLabel = labelBreakdown.join(' ');

  // Replace the save button with the new value
  categoryRow.components?.splice(4, 1, {
    custom_id: `aiMod~save~${category}~${newValue}`,
    label: newLabel,
    emoji: '💾' as APIMessageComponentEmoji,
    style: ButtonStyle.Primary,
    type: 2,
  } as APIButtonComponent);

  // Replace the category row with the new buttons
  buttonRows.splice(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    buttonRows.findIndex(row => row.components.find(button => (button as any).custom_id?.includes(category))),
    1,
    categoryRow,
  );

  // const newComponentList = newRows.map(row => ActionRowBuilder.from(row));

  await interaction.update({
    components: buttonRows,
  });
}

async function noteUser(
  interaction: ButtonInteraction,
):Promise<void> {
  log.debug(F, 'noteUser started');
  const buttonID = interaction.customId;
  log.debug(F, `buttonID: ${buttonID}`);

  const embed = interaction.message.embeds[0].toJSON();

  const flagsField = embed.fields?.find(field => field.name === 'Flags') as APIEmbedField;

  await interaction.showModal(new ModalBuilder()
    .setCustomId(`noteModal~${interaction.id}`)
    .setTitle('Tripbot Note')
    .addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder()
      .setLabel('What are you noting about this person?')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('Tell the team why you are noting this user.')
      .setValue(`This user's message was flagged by the AI for ${flagsField.value}`)
      .setMaxLength(1000)
      .setRequired(true)
      .setCustomId('internalNote'))));
  const filter = (i:ModalSubmitInteraction) => i.customId.includes('noteModal');

  interaction.awaitModalSubmit({ filter, time: 0 })
    .then(async i => {
      if (i.customId.split('~')[1] !== interaction.id) return;
      await i.deferReply({ ephemeral: true });

      const messageField = embed.fields?.find(field => field.name === 'Message') as APIEmbedField;
      const memberField = embed.fields?.find(field => field.name === 'Member') as APIEmbedField;
      const urlField = embed.fields?.find(field => field.name === 'Channel') as APIEmbedField;

      await moderate(
        interaction.member as GuildMember,
        'NOTE' as UserActionType,
        memberField.value.slice(2, -1),
        stripIndents`
        ${i.fields.getTextInputValue('internalNote')}
    
        **The offending message**
        > ${messageField.value}
        ${urlField.value}
      `,
        null,
        null,
      );

      const buttonRows = interaction.message.components.map(row => ActionRowBuilder.from(row.toJSON()));

      const actionField = embed.fields?.find(field => field.name === 'Actions');

      if (actionField) {
        // Add the action to the list of actions
        const newActionFiled = actionField?.value.concat(`
        
        ${interaction.user.toString()} noted this user:
        > ${i.fields.getTextInputValue('internalNote')}
        
        Message sent to user:
        > **No message sent to user on notes**
        `);
        // log.debug(F, `newActionFiled: ${newActionFiled}`);

        // Replace the action field with the new one
        embed.fields?.splice(embed.fields?.findIndex(field => field.name === 'Actions'), 1, {
          name: 'Actions',
          value: newActionFiled,
          inline: true,
        });
      } else {
        embed.fields?.push(
          {
            name: 'Actions',
            value: stripIndents`${interaction.user.toString()} noted this user:
            > ${i.fields.getTextInputValue('internalNote')}
        
            Message sent to user:
            > ${i.fields.getTextInputValue('description')}`,
            inline: true,
          },
        );
      }
      embed.color = Colors.Green;

      await i.editReply('User was noted');

      await interaction.message.edit({
        embeds: [embed],
        components: buttonRows as ActionRowBuilder<ButtonBuilder>[],
      });
    });
}

async function muteUser(
  interaction: ButtonInteraction,
):Promise<void> {
  log.debug(F, 'muteUser started');
  const buttonID = interaction.customId;
  log.debug(F, `buttonID: ${buttonID}`);

  const embed = interaction.message.embeds[0].toJSON();

  const flagsField = embed.fields?.find(field => field.name === 'Flags') as APIEmbedField;
  const messageField = embed.fields?.find(field => field.name === 'Message') as APIEmbedField;
  const urlField = embed.fields?.find(field => field.name === 'Channel') as APIEmbedField;

  await interaction.showModal(new ModalBuilder()
    .setCustomId(`timeoutModal~${interaction.id}`)
    .setTitle('Tripbot Timeout')
    .addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder()
        .setLabel('Why are you muting this person?')
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder('Tell the team why you are muting this user.')
        .setValue(`This user breaks TripSit's policies regarding ${flagsField.value} topics.`)
        .setMaxLength(1000)
        .setRequired(true)
        .setCustomId('internalNote')),
      new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder()
        .setLabel('What should we tell the user?')
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder('This will be sent to the user!')
        .setValue(stripIndents`
        Your recent messages have broken TripSit's policies regarding ${flagsField.value} topics.
        
        The offending message
        > ${messageField.value}
        ${urlField.value}`)
        .setMaxLength(1000)
        .setRequired(false)
        .setCustomId('description')),
      new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder()
        .setLabel('Timeout for how long? (Max/default 7 days)')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('4 days 3hrs 2 mins 30 seconds')
        .setRequired(false)
        .setCustomId('timeoutDuration')),
    ));
  const filter = (i:ModalSubmitInteraction) => i.customId.includes('timeoutModal');

  interaction.awaitModalSubmit({ filter, time: 0 })
    .then(async i => {
      if (i.customId.split('~')[1] !== interaction.id) return;
      await i.deferReply({ ephemeral: true });

      const duration = i.fields.getTextInputValue('timeoutDuration')
        ? await parseDuration(i.fields.getTextInputValue('timeoutDuration'))
        : 604800000;

      if (duration > 604800000) {
        await i.editReply('Cannot remove messages older than 7 days.');
        return;
      }

      const memberField = embed.fields?.find(field => field.name === 'Member') as APIEmbedField;

      await moderate(
        interaction.member as GuildMember,
        'TIMEOUT' as UserActionType,
        memberField.value.slice(2, -1),
        stripIndents`
        ${i.fields.getTextInputValue('internalNote')}
    
        **The offending message**
        > ${messageField.value}
        ${urlField.value}
      `,
        i.fields.getTextInputValue('description'),
        duration,
      );

      const buttonRows = interaction.message.components.map(row => ActionRowBuilder.from(row.toJSON()));

      const actionField = embed.fields?.find(field => field.name === 'Actions');

      if (actionField) {
        // Add the action to the list of actions
        const newActionFiled = actionField?.value.concat(`
        
        ${interaction.user.toString()} muted this user:
        > ${i.fields.getTextInputValue('internalNote')}
        
        Message sent to user:
        > ${i.fields.getTextInputValue('description')}`);
        // log.debug(F, `newActionFiled: ${newActionFiled}`);

        // Replace the action field with the new one
        embed.fields?.splice(embed.fields?.findIndex(field => field.name === 'Actions'), 1, {
          name: 'Actions',
          value: newActionFiled,
          inline: true,
        });
      } else {
        embed.fields?.push(
          {
            name: 'Actions',
            value: stripIndents`${interaction.user.toString()} muted this user:
            > ${i.fields.getTextInputValue('internalNote')}
        
            Message sent to user:
            > ${i.fields.getTextInputValue('description')}`,
            inline: true,
          },
        );
      }
      embed.color = Colors.Green;

      await i.editReply('User was muted');

      await interaction.message.edit({
        embeds: [embed],
        components: buttonRows as ActionRowBuilder<ButtonBuilder>[],
      });
    });
}

async function warnUser(
  interaction: ButtonInteraction,
):Promise<void> {
  log.debug(F, 'warnUser started');
  const buttonID = interaction.customId;
  log.debug(F, `buttonID: ${buttonID}`);

  const embed = interaction.message.embeds[0].toJSON();

  const flagsField = embed.fields?.find(field => field.name === 'Flags') as APIEmbedField;
  const urlField = embed.fields?.find(field => field.name === 'Channel') as APIEmbedField;
  const messageField = embed.fields?.find(field => field.name === 'Message') as APIEmbedField;

  await interaction.showModal(new ModalBuilder()
    .setCustomId(`warnModal~${interaction.id}`)
    .setTitle('Tripbot Warn')
    .addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder()
        .setLabel('Why are you warning this person?')
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder('Tell the team why you are warning this user.')
        .setValue(`This user breaks TripSit's policies regarding ${flagsField.value} topics.`)
        .setMaxLength(1000)
        .setRequired(true)
        .setCustomId('internalNote')),
      new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder()
        .setLabel('What should we tell the user?')
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder('This will be sent to the user!')
        .setValue(stripIndents`Your recent messages have broken TripSit's policies regarding ${flagsField.value} topics.
        
        The offending message
        > ${messageField.value}
        ${urlField.value}`)
        .setMaxLength(1000)
        .setRequired(true)
        .setCustomId('description')),
    ));
  const filter = (i:ModalSubmitInteraction) => i.customId.includes('warnModal');

  interaction.awaitModalSubmit({ filter, time: 0 })
    .then(async i => {
      if (i.customId.split('~')[1] !== interaction.id) return;
      await i.deferReply({ ephemeral: true });

      const memberField = embed.fields?.find(field => field.name === 'Member') as APIEmbedField;

      await moderate(
        interaction.member as GuildMember,
        'WARNING' as UserActionType,
        memberField.value.slice(2, -1),
        stripIndents`
        ${i.fields.getTextInputValue('internalNote')}
    
        **The offending message**
        > ${messageField.value}
        ${urlField.value}
      `,
        i.fields.getTextInputValue('description'),
        null,
      );

      const buttonRows = interaction.message.components.map(row => ActionRowBuilder.from(row.toJSON()));

      const actionField = embed.fields?.find(field => field.name === 'Actions');

      if (actionField) {
        // Add the action to the list of actions
        const newActionFiled = actionField?.value.concat(`
        
        ${interaction.user.toString()} warned this user:
        > ${i.fields.getTextInputValue('internalNote')}
        
        Message sent to user:
        > ${i.fields.getTextInputValue('description')}`);
        // log.debug(F, `newActionFiled: ${newActionFiled}`);

        // Replace the action field with the new one
        embed.fields?.splice(embed.fields?.findIndex(field => field.name === 'Actions'), 1, {
          name: 'Actions',
          value: newActionFiled,
          inline: true,
        });
      } else {
        embed.fields?.push(
          {
            name: 'Actions',
            value: stripIndents`${interaction.user.toString()} warned this user:
            > ${i.fields.getTextInputValue('internalNote')}
        
            Message sent to user:
            > ${i.fields.getTextInputValue('description')}`,
            inline: true,
          },
        );
      }
      embed.color = Colors.Green;

      await i.editReply('User was warned');

      await interaction.message.edit({
        embeds: [embed],
        components: buttonRows as ActionRowBuilder<ButtonBuilder>[],
      });
    });
}

async function banUser(
  interaction: ButtonInteraction,
):Promise<void> {
  log.debug(F, 'banUser started');
  const buttonID = interaction.customId;
  log.debug(F, `buttonID: ${buttonID}`);

  const embed = interaction.message.embeds[0].toJSON();

  const flagsField = embed.fields?.find(field => field.name === 'Flags') as APIEmbedField;
  const urlField = embed.fields?.find(field => field.name === 'Channel') as APIEmbedField;
  const messageField = embed.fields?.find(field => field.name === 'Message') as APIEmbedField;

  await interaction.showModal(new ModalBuilder()
    .setCustomId(`banModal~${interaction.id}`)
    .setTitle('Tripbot Ban')
    .addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder()
        .setLabel('Why are you banning this user?')
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder('Tell the team why you are banning this user.')
        .setValue(`This user breaks TripSit's policies regarding ${flagsField.value} topics.`)
        .setMaxLength(1000)
        .setRequired(true)
        .setCustomId('internalNote')),
      new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder()
        .setLabel('What should we tell the user?')
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder('This will be sent to the user!')
        .setValue(stripIndents`Your recent messages have broken TripSit's policies regarding ${flagsField.value} topics.
        
        The offending message
        > ${messageField.value}
        ${urlField.value}`)
        .setMaxLength(1000)
        .setRequired(false)
        .setCustomId('description')),
      new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder()
        .setLabel('How many days of msg to remove?')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('Between 0 and 7 days (Default 0)')
        .setRequired(false)
        .setCustomId('duration')),
    ));
  const filter = (i:ModalSubmitInteraction) => i.customId.includes('banModal');

  interaction.awaitModalSubmit({ filter, time: 0 })
    .then(async i => {
      if (i.customId.split('~')[1] !== interaction.id) return;
      await i.deferReply({ ephemeral: true });

      const duration = i.fields.getTextInputValue('duration')
        ? await parseDuration(i.fields.getTextInputValue('duration'))
        : 0;

      if (duration > 604800000) {
        await i.editReply('Cannot remove messages older than 7 days.');
        return;
      }

      const memberField = embed.fields?.find(field => field.name === 'Member') as APIEmbedField;

      await moderate(
        interaction.member as GuildMember,
        'FULL_BAN' as UserActionType,
        memberField.value.slice(2, -1),
        stripIndents`
        ${i.fields.getTextInputValue('internalNote')}
    
        **The offending message**
        > ${messageField.value}
        ${urlField.value}
      `,
        i.fields.getTextInputValue('description'),
        duration,
      );

      const buttonRows = interaction.message.components.map(row => ActionRowBuilder.from(row.toJSON()));

      const actionField = embed.fields?.find(field => field.name === 'Actions');

      if (actionField) {
        // Add the action to the list of actions
        const newActionFiled = actionField?.value.concat(`
        
        ${interaction.user.toString()} banned this user:
        > ${i.fields.getTextInputValue('internalNote')}
        
        Message sent to user:
        > ${i.fields.getTextInputValue('description')}`);
        // log.debug(F, `newActionFiled: ${newActionFiled}`);

        // Replace the action field with the new one
        embed.fields?.splice(embed.fields?.findIndex(field => field.name === 'Actions'), 1, {
          name: 'Actions',
          value: newActionFiled,
          inline: true,
        });
      } else {
        embed.fields?.push(
          {
            name: 'Actions',
            value: stripIndents`${interaction.user.toString()} noted this user:
            > ${i.fields.getTextInputValue('internalNote')}
        
            Message sent to user:
            > ${i.fields.getTextInputValue('description')}`,
            inline: true,
          },
        );
      }
      embed.color = Colors.Green;

      await i.editReply('User was banned');

      await interaction.message.edit({
        embeds: [embed],
        components: buttonRows as ActionRowBuilder<ButtonBuilder>[],
      });
    });
}

// export async function aiModResults(

// ) {
//   const moderation = await aiModResults(message);

//   if (moderation.length === 0) return;
// };

export async function aiAudit(
  aiPersona: ai_personas | null,
  messages: Message[],
  chatResponse: string,
  promptTokens: number,
  completionTokens: number,
) {
  // This function takes what was sent and returned from the API and sends it to a discord channel
  // for review. This is to ensure that the AI is not being used to break the rules.

  // Get the channel to send the message to
  const channelAiLog = await discordClient.channels.fetch(env.CHANNEL_AILOG) as TextChannel;

  // Check if this is a chat completion response, else, it's a moderation response
  if (!aiPersona) return;
  // Get fresh persona data after tokens

  const cleanPersona = await db.ai_personas.findUniqueOrThrow({
    where: {
      id: aiPersona.id,
    },
  });

  // const embed = await makePersonaEmbed(cleanPersona);
  const embed = embedTemplate();

  // Construct the message
  embed.setFooter({ text: 'What are tokens? https://platform.openai.com/tokenizer' });

  const messageOutput = messages
    .map(message => `${message.url} ${message.member?.displayName}: ${message.cleanContent}`)
    .join('\n')
    .slice(0, 1024);

  // log.debug(F, `messageOutput: ${messageOutput}`);

  const responseOutput = chatResponse.slice(0, 1023);
  // log.debug(F, `responseOutput: ${responseOutput}`);

  embed.spliceFields(
    0,
    0,
    {
      name: 'Model',
      value: stripIndents`${aiPersona.ai_model}`,
      inline: false,
    },
    {
      name: 'Messages',
      value: stripIndents`${messageOutput}`,
      inline: false,
    },
    {
      name: 'Result',
      value: stripIndents`${responseOutput}`,
      inline: false,
    },
  );

  const promptCost = (promptTokens / 1000) * aiCosts[cleanPersona.ai_model].input;
  const completionCost = (completionTokens / 1000) * aiCosts[cleanPersona.ai_model].output;
  // log.debug(F, `promptCost: ${promptCost}, completionCost: ${completionCost}`);

  embed.spliceFields(
    2,
    0,
    {
      name: 'Prompt Cost',
      value: `$${promptCost.toFixed(6)}\n(${promptTokens} tokens)`,
      inline: true,
    },
    {
      name: 'Completion Cost',
      value: `$${completionCost.toFixed(6)}\n(${completionTokens} tokens)`,
      inline: true,
    },
    {
      name: 'Total Cost',
      value: `$${(promptCost + completionCost).toFixed(6)}\n(${promptTokens + completionTokens} tokens)`,
      inline: true,
    },
  );

  // Send the message
  await channelAiLog.send({ embeds: [embed] });
}

export async function discordAiModerate(
  messageData:Message,
):Promise<void> {
  if (messageData.author.bot) return;
  if (messageData.cleanContent.length < 1) return;
  if (messageData.channel.type === ChannelType.DM) return;
  if (!messageData.guild) return;

  const modResults = await aiModerate(
    messageData.cleanContent.replace(tripbotUAT, '').replace('tripbot', ''),
    messageData.guild.id,
  );

  if (modResults.length === 0) return;

  const activeFlags = modResults.map(modResult => modResult.category);

  const targetMember = messageData.member as GuildMember;
  // const userData = await db.users.upsert({
  //   where: { discord_id: guildMember.id },
  //   create: { discord_id: guildMember.id },
  //   update: {},
  // });

  // const aiEmbed = await userInfoEmbed(guildMember, userData, 'FLAGGED');
  const aiEmbed = new EmbedBuilder()
    .setThumbnail(targetMember.user.displayAvatarURL())
    .setColor(Colors.Yellow)
    .addFields(
      {
        name: 'Member',
        value: stripIndents`<@${targetMember.id}>`,
        inline: true,
      },
      {
        name: 'Flags',
        value: stripIndents`${activeFlags.join(', ')}`,
        inline: true,
      },
      {
        name: 'Channel',
        value: stripIndents`${messageData.url}`,
        inline: true,
      },
      {
        name: 'Message',
        value: stripIndents`${messageData.cleanContent}`,
        inline: false,
      },
    );

  const modAiModifyButtons = [] as ActionRowBuilder<ButtonBuilder>[];
  let pingMessage = '';
  // For each of the sortedCategoryScores, add a field
  modResults.forEach(result => {
    const safeCategoryName = result.category
      .replace('/', '_')
      .replace('-', '_') as keyof ai_moderation;
    if (result.value > 0.90) {
      pingMessage = `Please review <@${env.DISCORD_OWNER_ID}>`;
    }
    aiEmbed.addFields(
      {
        name: result.category,
        value: '\u200B',
        inline: true,
      },
      {
        name: 'AI Value',
        value: `${result.value.toFixed(2)}`,
        inline: true,
      },
      {
        name: 'Threshold Value',
        value: `${result.limit}`,
        inline: true,
      },
    );
    modAiModifyButtons.push(new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`aiMod~adjust~${safeCategoryName}~-0.10`)
        .setLabel('-0.10')
        .setEmoji('⏪')
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId(`aiMod~adjust~${safeCategoryName}~-0.01`)
        .setLabel('-0.01')
        .setEmoji('◀️')
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId(`aiMod~adjust~${safeCategoryName}~+0.01`)
        .setLabel('+0.01')
        .setEmoji('▶️')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`aiMod~adjust~${safeCategoryName}~+0.10`)
        .setLabel('+0.10')
        .setEmoji('⏩')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`aiMod~save~${safeCategoryName}~${result.limit}`)
        .setLabel(`Save ${result.category} at ${result.limit.toFixed(2)}`)
        .setEmoji('💾')
        .setStyle(ButtonStyle.Primary),
    ));
  });

  const userActions = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`aiMod~note~${messageData.author.id}`)
      .setLabel('Note')
      .setEmoji('🗒️')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(`aiMod~warn~${messageData.author.id}`)
      .setLabel('Warn')
      .setEmoji('⚠️')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId(`aiMod~timeout~${messageData.author.id}`)
      .setLabel('Mute')
      .setEmoji('⏳')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`aiMod~ban~${messageData.author.id}`)
      .setLabel('Ban')
      .setEmoji('🔨')
      .setStyle(ButtonStyle.Danger),
  );

  // Get the channel to send the message to
  const channelAiModLog = await discordClient.channels.fetch(env.CHANNEL_AIMOD_LOG) as TextChannel;
  // Send the message
  await channelAiModLog.send({
    content: `${targetMember} was flagged by AI for ${activeFlags.join(', ')} in ${messageData.url} ${pingMessage}`,
    embeds: [aiEmbed],
    components: [userActions, ...modAiModifyButtons],
  });
}

export async function discordAiChat(
  messageData: Message<boolean>,
):Promise<void> {
  // log.debug(F, `discordAiChat - messageData: ${JSON.stringify(messageData.cleanContent, null, 2)}`);
  const channelMessages = await messageData.channel.messages.fetch({ limit: 10 });
  // log.debug(F, `channelMessages: ${JSON.stringify(channelMessages.map(message => message.cleanContent), null, 2)}`);

  const messages = [...channelMessages.values()];

  if (!messages[0].member?.roles.cache.has(env.ROLE_VERIFIED)) return;
  if (messages[0].author.bot) return;
  if (messages[0].cleanContent.length < 1) return;
  if (messages[0].channel.type === ChannelType.DM) return;

  // Check if the channel is linked to a persona
  const aiLinkData = await getLinkedChannel(messages[0].channel);
  // log.debug(F, `aiLinkData: ${JSON.stringify(aiLinkData, null, 2)}`);
  if (!aiLinkData) return;
  // log.debug(F, `aiLinkData: ${JSON.stringify(aiLinkData, null, 2)}`);

  // Get persona details for this channel, throw an error if the persona was deleted
  const aiPersona = await db.ai_personas.findUniqueOrThrow({
    where: {
      id: aiLinkData.persona_id,
    },
  });
  // log.debug(F, `aiPersona: ${aiPersona.name}`);

  // Get the last 3 messages that are not empty or from other bots
  const messageList = messages
    .filter(message => message.cleanContent.length > 0 && !message.author.bot)
    .map(message => ({
      role: 'user',
      content: message.cleanContent
        .replace(tripbotUAT, '')
        .replace('tripbot', '')
        .trim(),
    }))
    .reverse()
    .slice(0, maxHistoryLength) as OpenAI.Chat.ChatCompletionMessageParam[];

  const cleanMessageList = messages
    .filter(message => message.cleanContent.length > 0 && !message.author.bot)
    .reverse()
    .slice(0, maxHistoryLength);

  const result = await aiChat(aiPersona, messageList);

  await aiAudit(
    aiPersona,
    cleanMessageList,
    result.response,
    result.promptTokens,
    result.completionTokens,
  );

  await messages[0].channel.sendTyping();

  // Sleep for a bit to simulate typing in production
  if (env.NODE_ENV === 'production') {
    // const wordCount = result.response.split(' ').length;
    // const sleepTime = Math.ceil(wordCount / 10);
    await sleep(10 * 1000);
  }
  await messages[0].reply(result.response.slice(0, 2000));
}

export async function aiModButton(
  interaction: ButtonInteraction,
) {
  const buttonID = interaction.customId;
  log.debug(F, `buttonID: ${buttonID}`);
  const [,buttonAction] = buttonID.split('~');

  switch (buttonAction) {
    case 'adjust':
      await adjustThreshold(interaction);
      break;
    case 'save':
      await saveThreshold(interaction);
      break;
    case 'note':
      await noteUser(interaction);
      break;
    case 'warn':
      await warnUser(interaction);
      break;
    case 'timeout':
      await muteUser(interaction);
      break;
    case 'ban':
      await banUser(interaction);
      break;
    default:
      break;
  }
}

export const aiCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('ai')
    .setDescription('Information and commands for TripBot\'s AI personas.')
    .addSubcommand(subcommand => subcommand
      .setDescription('Information on the AI persona.')
      .setName('help'))
    .addSubcommand(subcommand => subcommand
      .setDescription('Set a create or update an AI persona')
      .addStringOption(option => option.setName('name')
        .setAutocomplete(true)
        .setDescription('Name of the AI persona to modify/create.'))
      .addStringOption(option => option.setName('model')
        .setAutocomplete(true)
        .setDescription('Which model to use.'))
      .addNumberOption(option => option.setName('tokens')
        .setDescription('Maximum tokens to use for this request (Default: 500).')
        .setMaxValue(1000)
        .setMinValue(100))
      .addNumberOption(option => option.setName('temperature')
        .setDescription('Temperature value for the model.')
        .setMaxValue(2)
        .setMinValue(0))
      .addNumberOption(option => option.setName('top_p')
        .setDescription('Top % value for the model. Use this OR temp.')
        .setMaxValue(2)
        .setMinValue(0))
      .addNumberOption(option => option.setName('presence_penalty')
        .setDescription('Presence penalty value for the model.')
        .setMaxValue(2)
        .setMinValue(-2))
      .addNumberOption(option => option.setName('frequency_penalty')
        .setDescription('Frequency penalty value for the model.')
        .setMaxValue(2)
        .setMinValue(-2))
      .addBooleanOption(option => option.setName('ephemeral')
        .setDescription(ephemeralExplanation))
      .setName('upsert'))
    .addSubcommand(subcommand => subcommand
      .setDescription('Get information on the AI')
      .addStringOption(option => option.setName('name')
        .setAutocomplete(true)
        .setDescription('Which AI persona to get information on.'))
      .addChannelOption(option => option.setName('channel')
        .setDescription('Which channel to get info on.'))
      .addBooleanOption(option => option.setName('ephemeral')
        .setDescription(ephemeralExplanation))
      .setName('get'))
    .addSubcommand(subcommand => subcommand
      .setDescription('Remove an AI model.')
      .addStringOption(option => option.setName('name')
        .setDescription('Name of the AI persona to delete.')
        .setAutocomplete(true))
      .addStringOption(option => option.setName('confirmation')
        .setDescription('Code to confirm you want to delete'))
      .addBooleanOption(option => option.setName('ephemeral')
        .setDescription(ephemeralExplanation))
      .setName('del'))
    .addSubcommand(subcommand => subcommand
      .setDescription('Link an AI model to a channel.')
      .addStringOption(option => option.setName('name')
        .setDescription('Name of the AI persona to link.')
        .setAutocomplete(true))
      .addChannelOption(option => option.setName('channel')
        .setDescription('ID or channel mention of the channel to link.'))
      .addStringOption(option => option.setName('toggle')
        .setDescription('Should we enable to disable this link?')
        .setChoices(
          { name: 'Enable', value: 'enable' },
          { name: 'Disable', value: 'disable' },
        ))
      .addBooleanOption(option => option.setName('ephemeral')
        .setDescription(ephemeralExplanation))
      .setName('link'))
    .addSubcommand(subcommand => subcommand
      .setDescription('Change moderation parameters.')
      .addNumberOption(option => option.setName('harassment')
        .setDescription('Set harassment limit.'))
      .addNumberOption(option => option.setName('harassment_threatening')
        .setDescription('Set harassment_threatening limit.'))
      .addNumberOption(option => option.setName('hate')
        .setDescription('Set hate limit.'))
      .addNumberOption(option => option.setName('hate_threatening')
        .setDescription('Set hate_threatening limit.'))
      .addNumberOption(option => option.setName('self_harm')
        .setDescription('Set self_harm limit.'))
      .addNumberOption(option => option.setName('self_harm_instructions')
        .setDescription('Set self_harm_instructions limit.'))
      .addNumberOption(option => option.setName('self_harm_intent')
        .setDescription('Set self_harm_intent limit.'))
      .addNumberOption(option => option.setName('sexual')
        .setDescription('Set sexual limit.'))
      .addNumberOption(option => option.setName('sexual_minors')
        .setDescription('Set sexual_minors limit.'))
      .addNumberOption(option => option.setName('violence')
        .setDescription('Set violence limit.'))
      .addNumberOption(option => option.setName('violence_graphic')
        .setDescription('Set violence_graphic limit.'))
      .setName('mod')),

  async execute(interaction) {
    log.info(F, await commandContext(interaction));

    const command = interaction.options.getSubcommand().toUpperCase() as AiAction;
    switch (command) {
      case 'HELP':
        await help(interaction);
        break;
      case 'GET':
        await get(interaction);
        break;
      case 'UPSERT':
        await upsert(interaction);
        break;
      case 'LINK':
        await link(interaction);
        break;
      case 'DEL':
        await del(interaction);
        break;
      case 'MOD':
        await mod(interaction);
        break;
      default:
        help(interaction);
        break;
    }

    return true;
  },
};

export default aiCommand;
