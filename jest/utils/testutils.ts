import {
  ChatInputCommandInteraction,
  // CommandInteraction,
  User,
  EmbedBuilder,
  Message,
  SlashCommandBuilder,
  ToAPIApplicationCommandOptions,
  SlashCommandSubcommandsOnlyBuilder,
  EmbedData,
  Client,
  // ApplicationCommandOptionBase,
  // ApplicationCommandOption,
  // APIApplicationCommandOption,
  // APIChatInputApplicationCommandInteractionData,
  // APIApplicationCommandInteractionData,
} from 'discord.js';
import { SlashCommand } from '../../src/discord/@types/commandDef';
import MockDiscord from './mockDiscord';

const F = f(__filename); // eslint-disable-line

export const defaultConfig = {
  id: '11',
  lang: 'en',
  prefix: '.',
  almanaxChannel: 'almanax',
  partyChannel: 'listagem-de-grupos',
  buildPreview: 'enabled',
};

type Options = {
  [key:number]: typeof String | typeof Number | typeof Boolean,
};

export const optionType = {
  // 0: null,
  // 1: subCommand,
  // 2: subCommandGroup,
  3: String,
  4: Number,
  5: Boolean,
  // 6: user,
  // 7: channel,
  // 8: role,
  // 9: mentionable,
  10: Number,
} as Options;

function getNestedOptions(
  options:ToAPIApplicationCommandOptions[],
):ToAPIApplicationCommandOptions[] {
  // log.debug(F, `options: ${JSON.stringify(options, null, 2)}`);
  // This gets a flat array of options, including nested options
  return options.reduce((
    allOptions:ToAPIApplicationCommandOptions[],
    option:ToAPIApplicationCommandOptions,
  ) => { // @ts-ignore
    // log.debug(F, `allOptions: ${JSON.stringify(allOptions, null, 2)}`);
    // log.debug(F, `option: ${JSON.stringify(option, null, 2)}`); // @ts-ignore
    if (option.options) return [...allOptions, option, ...option.options]; // @ts-ignore
    if (!option.toJSON().options) return [...allOptions, option]; // @ts-ignore
    // log.debug(F, 'option.toJSON().options passed'); // @ts-ignore
    const nestedOptions = getNestedOptions(option.toJSON().options); // @ts-ignore
    // log.debug(F, `nestedOptions: ${JSON.stringify(nestedOptions, null, 2)}`); // @ts-ignore
    return [...allOptions, option, ...nestedOptions]; // @ts-ignore
  }, []);
}

function castToType(value: string, typeId: number) {
  function userConstructor(): User {
    return Reflect.construct(User, [
      new Client({ intents: [] }),
      {
        // id: BigInt(123456789),
        id: '123456789',
        username: 'USERNAME',
        discriminator: 'user#0000',
        avatar: 'user avatar url',
        bot: false,
      },
    ]);
  }

  if (typeId === 6) {
    return userConstructor();
  }

  const typeCaster = optionType[typeId] as typeof String | typeof Number | typeof Boolean;

  return typeCaster ? typeCaster(value) : value;
}

export function getParsedCommand(
  stringCommand: string,
  commandData: Omit<SlashCommandBuilder, 'addSubcommandGroup' | 'addSubcommand'> | SlashCommandSubcommandsOnlyBuilder,
) {
  const options = getNestedOptions(commandData.options); // @ts-ignore
  // log.debug(F, `getNestedOptions: ${JSON.stringify(options, null, 2)}`); // @ts-ignore
  const optionsIndentifiers = options.map(option => `${option.name}:`);
  // log.debug(`[${PREFIX}] optionsIndentifiers: ${JSON.stringify(optionsIndentifiers, null, 2)}`);
  const requestedOptions = options.reduce((
    requestedOptions2:ToAPIApplicationCommandOptions[],
    option:ToAPIApplicationCommandOptions,
  ):ToAPIApplicationCommandOptions[] => {
    const identifier = `${option.toJSON().name}:`;
    // log.debug(`[${PREFIX}] identifier: ${JSON.stringify(identifier, null, 2)}`);
    const inclused = stringCommand.includes(identifier);
    // log.debug(`[${PREFIX}] inclused: ${JSON.stringify(inclused, null, 2)}`);
    if (!inclused) return requestedOptions2;
    const remainder = stringCommand.split(identifier)[1];
    // log.debug(`[${PREFIX}] remainder: ${JSON.stringify(remainder, null, 2)}`);

    const nextoptions = remainder.split(' ');
    // log.debug(`[${PREFIX}] nextoptions: ${JSON.stringify(nextoptions, null, 2)}`);

    const nextOptionIdentifier = nextoptions.find(word => {
      // log.debug(`[${PREFIX}] word: ${JSON.stringify(word, null, 2)}`);
      const wordIdentifier = word.split(':')[0];
      // log.debug(F, `wordIdentifier: ${JSON.stringify(wordIdentifier, null, 2)}`);
      return optionsIndentifiers.includes(`${wordIdentifier}:`);
    });
    // log.debug(`[${PREFIX}] nextOptionIdentifier: ${JSON.stringify(nextOptionIdentifier, null, 2)}`);

    if (nextOptionIdentifier) {
      const value = remainder.split(nextOptionIdentifier)[0].trim();
      // log.debug(`[${PREFIX}] value: ${JSON.stringify(value, null, 2)}`);
      const formattedValue = castToType(value, option.toJSON().type);
      log.debug(F, `formattedValue: ${JSON.stringify(formattedValue, null, 2)}`);
      return [...requestedOptions2, { // @ts-ignore
        name: option.toJSON().name,
        value: formattedValue,
        type: option.toJSON().type,
      }];
    }

    // log.debug(F, `remainderFinal: ${JSON.stringify(remainder, null, 2)}`);
    const formattedValue2 = castToType(remainder.trim(), option.toJSON().type);
    // log.debug(F, `formattedValue2: ${JSON.stringify(formattedValue2, null, 2)}`);
    if (option.toJSON().type === 6) {
      // log.debug(F, 'option.toJSON().type === 6');
      return [...requestedOptions2, { // @ts-ignore
        name: option.toJSON().name,
        value: '1223456789',
        type: option.toJSON().type,
        user: formattedValue2,
      }];
    }
    return [...requestedOptions2, { // @ts-ignore
      name: option.toJSON().name,
      value: formattedValue2,
      type: option.toJSON().type,
    }];
  }, []);
  // log.debug(`[${PREFIX}] requestedOptions: ${JSON.stringify(requestedOptions, null, 2)}`);
  const optionNames = options.map(option => option.toJSON().name);
  // log.debug(`[${PREFIX}] optionNames: ${JSON.stringify(optionNames, null, 2)}`);
  const splittedCommand = stringCommand.split(' ');
  // log.debug(`[${PREFIX}] splittedCommand: ${JSON.stringify(splittedCommand, null, 2)}`);
  const name = splittedCommand[0].replace('/', '');
  // log.debug(`[${PREFIX}] name: ${JSON.stringify(name, null, 2)}`);
  const subcommand = splittedCommand.find(word => optionNames.includes(word));
  // log.debug(`[${PREFIX}] subcommand: ${JSON.stringify(subcommand, null, 2)}`);
  // log.debug(`[${PREFIX}] retValue: ${JSON.stringify(retValue, null, 2)}`);
  return {
    id: name,
    name,
    type: 1,
    options: subcommand ? [{
      name: subcommand,
      type: 1,
      options: requestedOptions,
    }] : requestedOptions,
  };
}

export function embedContaining(content:EmbedData) {
  return expect.arrayContaining([expect.objectContaining(new EmbedBuilder(content))]);
}

export function embedContainingWithoutFetchReply(content:EmbedData) {
  return {
    embeds: expect.arrayContaining([expect.objectContaining(content)]),
  };
}

export function fieldContainingValue(expectedValue:string) {
  return embedContainingWithoutFetchReply({
    fields: expect.arrayContaining([expect.objectContaining({
      value: expect.stringContaining(expectedValue),
    })]),
  });
}

export function copy(obj:any) { // eslint-disable-line @typescript-eslint/no-explicit-any
  return JSON.parse(JSON.stringify(obj));
}

/* Spy 'reply' */
export function mockInteractionAndSpyReply(command:{
  id: string;
  name: string;
  type: number;
  options: ToAPIApplicationCommandOptions[] | {
    name: string;
    type: number;
    options: ToAPIApplicationCommandOptions[];
  }[];
}) {
  const discord = new MockDiscord({ command });
  // console.log(discord);
  const interaction = discord.getInteraction() as ChatInputCommandInteraction;
  // console.log(interaction);
  const spy = jest.spyOn(interaction, 'reply');
  return { interaction, spy };
}

export async function executeCommandAndSpyReply(
  Command:SlashCommand,
  content:{
    id: string;
    name: string;
    type: number;
    options: ToAPIApplicationCommandOptions[] | {
      name: string;
      type: number;
      options: ToAPIApplicationCommandOptions[];
    }[];
  },
  // config = {},
) {
  const { interaction, spy } = mockInteractionAndSpyReply(content);
  // const commandInstance = new Command(interaction, { ...defaultConfig, ...config });
  await Command.execute(interaction);
  return spy;
}

/* Spy 'editReply' */
export function mockInteractionAndSpyEditReply(command:{
  id: string;
  name: string;
  type: number;
  options: ToAPIApplicationCommandOptions[] | {
    name: string;
    type: number;
    options: ToAPIApplicationCommandOptions[];
  }[];
}) {
  const discord = new MockDiscord({ command });
  // console.log(discord);
  const interaction = discord.getInteraction() as ChatInputCommandInteraction;
  // console.log(interaction);
  const spy = jest.spyOn(interaction, 'editReply');
  return { interaction, spy };
}

/* Spy channel 'send' with mock options */
export function mockInteractionWithOptionsAndSpyChannelSend(command:{
  id: string;
  name: string;
  type: number;
  options: ToAPIApplicationCommandOptions[] | {
    name: string;
    type: number;
    options: ToAPIApplicationCommandOptions[];
  }[];
}) {
  const discord = new MockDiscord({ command });
  const interaction = discord.getInteraction() as ChatInputCommandInteraction;
  // const channel = discord.getBotPartyTextChannel();
  if (!interaction.channel) throw new Error('Channel not found');
  const spy = jest.spyOn(interaction.channel, 'send');
  return { interaction, spy };
}

export async function executeCommandWithMockOptionsAndSpySentMessage(
  Command:SlashCommand,
  options:{
    id: string;
    name: string;
    type: number;
    options: ToAPIApplicationCommandOptions[] | {
      name: string;
      type: number;
      options: ToAPIApplicationCommandOptions[];
    }[];
  },
  // config = {},
) {
  const { interaction, spy } = mockInteractionWithOptionsAndSpyChannelSend(options);
  // const commandInstance = new Command(interaction, { ...defaultConfig, ...config });
  await Command.execute(interaction);
  return spy;
}

/* Spy 'edit' with mock options */
export function mockMessageWithOptionsAndSpyEdit(command:{
  id: string;
  name: string;
  type: number;
  options: ToAPIApplicationCommandOptions[] | {
    name: string;
    type: number;
    options: ToAPIApplicationCommandOptions[];
  }[];
}) {
  const discord = new MockDiscord({ command });
  const interaction = discord.getInteraction() as ChatInputCommandInteraction;
  const channel = discord.getBotPartyTextChannel();
  const lastMessage = channel.messages.cache.last() as Message;
  const spy = jest.spyOn(lastMessage, 'edit');
  return { interaction, spy };
}

export async function executeCommandWithMockOptionsAndSpyEdit(
  Command:SlashCommand,
  options:{
    id: string;
    name: string;
    type: number;
    options: ToAPIApplicationCommandOptions[] | {
      name: string;
      type: number;
      options: ToAPIApplicationCommandOptions[];
    }[];
  },
  // config = {},
) {
  const { interaction, spy } = mockMessageWithOptionsAndSpyEdit(options);
  // const commandInstance = new Command(interaction, { ...defaultConfig, ...config });
  await Command.execute(interaction);
  return spy;
}

/* Spy 'edit' with mock options for a party reaction */
export function mockPartyReactionAndSpyEdit(command:{
  id: string;
  name: string;
  type: number;
  options: ToAPIApplicationCommandOptions[] | {
    name: string;
    type: number;
    options: ToAPIApplicationCommandOptions[];
  }[];
}) {
  const discord = new MockDiscord({ command });
  const channel = discord.getBotPartyTextChannel();
  const lastMessage = channel.messages.cache.last() as Message;
  const userMessage = discord.getMessage();
  const userReaction = discord.getReaction();
  const user = discord.getReactionUser();
  const spy = jest.spyOn(lastMessage, 'edit');
  return {
    userMessage, spy, reaction: userReaction, user,
  };
}

// export async function executePartyReactionAndSpyEdit(
//   Command:SlashCommand,
//   action:any,
//   options:{
//     id: string;
//     name: string;
//     type: number;
//     options: ToAPIApplicationCommandOptions[] | {
//       name: string;
//       type: number;
//       options: ToAPIApplicationCommandOptions[];
//     }[];
//   },
//   config = {},
// ) {
//   const { spy, reaction, user } = mockPartyReactionAndSpyEdit(options);
//   const commandInstance = new Command(reaction, user, { ...defaultConfig, ...config });
//   await commandInstance.execute(action);
//   return spy;
// }
