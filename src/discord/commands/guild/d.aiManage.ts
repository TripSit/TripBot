/* eslint-disable sonarjs/no-duplicate-string */
import {
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  Colors,
  SlashCommandBuilder,
  ModalSubmitInteraction,
  ChatInputCommandInteraction,
  TextChannel,
  ThreadChannel,
  time,
} from 'discord.js';
import {
  TextInputStyle,
} from 'discord-api-types/v10';
import { stripIndents } from 'common-tags';
import {
  PrismaClient,
  ai_model,
  ai_personas,
} from '@prisma/client';
import { paginationEmbed } from '../../utils/pagination';
import { SlashCommand } from '../../@types/commandDef';
import { embedTemplate } from '../../utils/embedTemplate';
import commandContext from '../../utils/context';

const db = new PrismaClient({ log: ['error'] });

const F = f(__filename);

const ephemeralExplanation = 'Set to "True" to show the response only to you';
const confirmationCodes = new Map<string, string>();

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
} as {
  [key in ai_model]: {
    input: number,
    output: number,
  }
};

async function manageHelp(
  interaction: ChatInputCommandInteraction,
):Promise<void> {
  const visible = interaction.options.getBoolean('ephemeral') !== false;
  await interaction.deferReply({ ephemeral: !visible });

  const aboutEmbed = embedTemplate()
    .setTitle('AI Manage Help')
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
    > What are tokens? <https://platform.openai.com/tokenizer>
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
      let updatedValues = '';

      // Get values
      let temperature = existingPersona ? existingPersona.temperature : null;
      if (interaction.options.getNumber('temperature')) {
        temperature = interaction.options.getNumber('temperature', true);
        if (existingPersona?.temperature) {
          updatedValues += `Temperature: ${existingPersona.temperature} -> ${temperature}\n`;
        }
      }

      let topP = existingPersona ? existingPersona.top_p : null;
      if (interaction.options.getNumber('top_p')) {
        topP = interaction.options.getNumber('top_p', true);
        if (existingPersona?.top_p) {
          updatedValues += `Top P: ${existingPersona.top_p} -> ${topP}\n`;
        }
      }

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

      let presencePenalty = existingPersona ? existingPersona.presence_penalty : 0;
      if (interaction.options.getNumber('presence_penalty')) {
        presencePenalty = interaction.options.getNumber('presence_penalty', true);
        if (existingPersona?.presence_penalty) {
          updatedValues += `Presence Penalty: ${existingPersona.presence_penalty} -> ${presencePenalty}\n`;
        }
      }

      let frequencyPenalty = existingPersona ? existingPersona.frequency_penalty : 0;
      if (interaction.options.getNumber('frequency_penalty')) {
        frequencyPenalty = interaction.options.getNumber('frequency_penalty', true);
        if (existingPersona?.frequency_penalty) {
          updatedValues += `Frequency Penalty: ${existingPersona.frequency_penalty} -> ${frequencyPenalty}\n`;
        }
      }

      let maxTokens = existingPersona ? existingPersona.max_tokens : 500;
      if (interaction.options.getNumber('tokens')) {
        maxTokens = interaction.options.getNumber('tokens', true);
        if (existingPersona?.max_tokens) {
          updatedValues += `Max Tokens: ${existingPersona.max_tokens} -> ${maxTokens}\n`;
        }
      }

      let model = existingPersona ? existingPersona.ai_model : 'GPT_3_5_TURBO';
      if (interaction.options.getString('model')) {
        model = interaction.options.getString('model', true) as ai_model;
        if (existingPersona?.ai_model) {
          updatedValues += `Model: ${existingPersona.ai_model} -> ${model}\n`;
        }
      }

      let prompt = existingPersona ? existingPersona.prompt : '';
      if (i.fields.getTextInputValue('prompt')) {
        prompt = i.fields.getTextInputValue('prompt');
        if (existingPersona?.prompt !== prompt) {
          updatedValues += `Prompt: ${existingPersona?.prompt} -> ${prompt}\n`;
        }
      }

      const userData = await db.users.upsert({
        where: { discord_id: interaction.user.id },
        create: { discord_id: interaction.user.id },
        update: { discord_id: interaction.user.id },
      });

      const aiPersona = {
        name: personaName,
        ai_model: model,
        prompt,
        temperature,
        top_p: topP,
        presence_penalty: presencePenalty,
        frequency_penalty: frequencyPenalty,
        max_tokens: maxTokens,
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
          .setDescription(`Success! ${personaName} has been ${action}!
          
          ${updatedValues}`)],
      });

      const channelAiLog = await interaction.guild?.channels.fetch(env.CHANNEL_AILOG) as TextChannel;
      await channelAiLog.send({
        content: `Hey <@${env.DISCORD_OWNER_ID}>, ${interaction.user.username} ${action} the ${personaName} AI Persona!`,
        embeds: [embedTemplate()
          .setTitle('AI Persona')
          .setColor(Colors.Blurple)
          .setDescription(stripIndents`
              ${updatedValues}
            `)],
      });
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

export const aiCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('ai_manage')
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

    const command = interaction.options.getSubcommand().toUpperCase() as 'HELP' | 'UPSERT' | 'GET' | 'DEL' | 'MOD';
    switch (command) {
      case 'HELP':
        await manageHelp(interaction);
        break;
      case 'GET':
        await get(interaction);
        break;
      case 'UPSERT':
        await upsert(interaction);
        break;
      case 'DEL':
        await del(interaction);
        break;
      case 'MOD':
        await mod(interaction);
        break;
      default:
        manageHelp(interaction);
        break;
    }

    return true;
  },
};

export default aiCommand;
