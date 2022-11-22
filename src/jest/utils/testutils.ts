import {
  ChatInputCommandInteraction,
  CommandInteraction,
  Message,
  SlashCommandBuilder,
  // ToAPIApplicationCommandOptions,
  SlashCommandSubcommandsOnlyBuilder,
  // ApplicationCommandOptionBase,
  // ApplicationCommandOption,
  // APIApplicationCommandOption,
  // APIChatInputApplicationCommandInteractionData,
  // APIApplicationCommandInteractionData,
} from 'discord.js';
import { parse } from 'path';
import { SlashCommand } from '../../discord/@types/commandDef';
import MockDiscord from './mockDiscord';
import log from '../../global/utils/log'; // eslint-disable-line

const PREFIX = parse(__filename).name; // eslint-disable-line

export const defaultConfig = {
  id: '11',
  lang: 'en',
  prefix: '.',
  almanaxChannel: 'almanax',
  partyChannel: 'listagem-de-grupos',
  buildPreview: 'enabled',
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
} as any;

function getNestedOptions(options:any) {
  return options.reduce((allOptions:any, option:any) => {
    if (!option.options) return [...allOptions, option];
    const nestedOptions = getNestedOptions(option.options);
    return [option, ...allOptions, ...nestedOptions];
  }, []);
}

function castToType(value: string, typeId: number) {
  const typeCaster = optionType[typeId] as any;
  return typeCaster ? typeCaster(value) : value;
}

export function getParsedCommand(
  stringCommand: string,
  commandData: Omit<SlashCommandBuilder, 'addSubcommandGroup' | 'addSubcommand'> | SlashCommandSubcommandsOnlyBuilder,
) {
  // log.debug(`[${PREFIX}] options1: ${JSON.stringify(commandData.options, null, 2)}`);
  const options = getNestedOptions(commandData.options);
  // log.debug(`[${PREFIX}] options2: ${JSON.stringify(options, null, 2)}`);
  // log.debug(`[${PREFIX}] options2 type: ${typeof options}`);
  const optionsIndentifiers = options.map((option:any) => `${option.name}:`);
  const requestedOptions = options.reduce((requestedOptions2:any, option:any) => {
    const identifier = `${option.name}:`;
    if (!stringCommand.includes(identifier)) return requestedOptions2;
    const remainder = stringCommand.split(identifier)[1];

    const nextOptionIdentifier = remainder.split(' ').find(word => optionsIndentifiers.includes(word));
    if (nextOptionIdentifier) {
      const value = remainder.split(nextOptionIdentifier)[0].trim();
      return [...requestedOptions2, {
        name: option.name,
        value: castToType(value, option.type),
        type: option.type,
      }];
    }

    return [...requestedOptions2, {
      name: option.name,
      value: castToType(remainder.trim(), option.type),
      type: option.type,
    }];
  }, []);
  const optionNames = options.map((option:any) => option.name);
  const splittedCommand = stringCommand.split(' ');
  const name = splittedCommand[0].replace('/', '');
  const subcommand = splittedCommand.find(word => optionNames.includes(word));
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

export function embedContaining(embeds:any) {
  // return {
  //   // embeds: expect.arrayContaining([expect.objectContaining(embed)]),
  //   embeds: [{ embed }],
  //   fetchReply: true,
  // };
  return { embeds, fetchReply: true };
}

export function embedContainingWithoutFetchReply(content:any) {
  return {
    embeds: expect.arrayContaining([expect.objectContaining(content)]),
  };
}

export function fieldContainingValue(expectedValue:any) {
  return embedContainingWithoutFetchReply({
    fields: expect.arrayContaining([expect.objectContaining({
      value: expect.stringContaining(expectedValue),
    })]),
  });
}

export function copy(obj:any) {
  return JSON.parse(JSON.stringify(obj));
}

/* Spy 'reply' */
export function mockInteractionAndSpyReply(command:any) {
  const discord = new MockDiscord({ command });
  const interaction = discord.getInteraction() as ChatInputCommandInteraction;
  const spy = jest.spyOn(interaction, 'reply');
  return { interaction, spy };
}

export async function executeCommandAndSpyReply(
  Command:SlashCommand,
  content:{
    id: string;
    name: string;
    type: number;
    options: any;
  },
  // config = {},
) {
  const { interaction, spy } = mockInteractionAndSpyReply(content);
  // const commandInstance = new Command(interaction, { ...defaultConfig, ...config });
  await Command.execute(interaction);
  return spy;
}

/* Spy channel 'send' with mock options */
export function mockInteractionWithOptionsAndSpyChannelSend(options:any) {
  const discord = new MockDiscord(options);
  const interaction = discord.getInteraction() as CommandInteraction;
  const channel = discord.getBotPartyTextChannel();
  const spy = jest.spyOn(channel, 'send');
  return { interaction, spy };
}

export async function executeCommandWithMockOptionsAndSpySentMessage(Command:any, options:any, config = {}) {
  const { interaction, spy } = mockInteractionWithOptionsAndSpyChannelSend(options);
  const commandInstance = new Command(interaction, { ...defaultConfig, ...config });
  await commandInstance.execute();
  return spy;
}

/* Spy 'edit' with mock options */
export function mockMessageWithOptionsAndSpyEdit(options:any) {
  const discord = new MockDiscord(options);
  const interaction = discord.getInteraction() as CommandInteraction;
  const channel = discord.getBotPartyTextChannel();
  const lastMessage = channel.messages.cache.last() as Message;
  const spy = jest.spyOn(lastMessage, 'edit');
  return { interaction, spy };
}

export async function executeCommandWithMockOptionsAndSpyEdit(Command:any, options:any, config = {}) {
  const { interaction, spy } = mockMessageWithOptionsAndSpyEdit(options);
  const commandInstance = new Command(interaction, { ...defaultConfig, ...config });
  await commandInstance.execute();
  return spy;
}

/* Spy 'edit' with mock options for a party reaction */
export function mockPartyReactionAndSpyEdit(options:any) {
  const discord = new MockDiscord(options);
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

export async function executePartyReactionAndSpyEdit(Command:any, action:any, options:any, config = {}) {
  const { spy, reaction, user } = mockPartyReactionAndSpyEdit(options);
  const commandInstance = new Command(reaction, user, { ...defaultConfig, ...config });
  await commandInstance.execute(action);
  return spy;
}
