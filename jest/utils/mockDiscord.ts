import {
  Client,
  Guild,
  Channel,
  GuildChannel,
  TextChannel,
  User,
  GuildMember,
  Message,
  MessageReaction,
  CommandInteraction,
  BaseGuildTextChannel, // eslint-disable-line
  BaseChannel,
  Collection,
  CommandInteractionOptionResolver, // eslint-disable-line
  ToAPIApplicationCommandOptions,
  ChatInputCommandInteraction,
  ReactionEmoji, // eslint-disable-line
  UserManager,
  ClientApplication, // eslint-disable-line
  // ClientApplication,
  // FetchApplicationCommandOptions,
  // ApplicationCommandDataResolvable,
} from 'discord.js';
import fs from 'fs';
import path from 'path';
// import { SlashCommand } from '../../discord/@types/commandDef';

const F = f(__filename);  // eslint-disable-line

const userAvatarUrl = 'userAvatarUrl';
const mockChannelId = 'mock-channel-id';

export default class MockDiscord {
  private client!: Client;

  private guild!: Guild;

  private channel!: Channel;

  private guildChannel!: GuildChannel;

  private textChannel!: TextChannel;

  private user!: User;

  private users!: UserManager;

  private guildMember!: GuildMember;

  public message!: Message;

  public interaction!: CommandInteraction;

  private botPartyChannel!: Channel;

  private botPartyGuildChannel!: GuildChannel;

  private botPartyTextChannel!: TextChannel;

  private reaction!: MessageReaction;

  private reactionUser!: User;

  private application!: ClientApplication;

  constructor(options:{
    message?: Message,
    reaction?: MessageReaction,
    command: {
      context: 'tripsit' | 'guild' | 'dm',
      id: string;
      name: string;
      type: number;
      options: ToAPIApplicationCommandOptions[] | {
        name: string;
        type: number;
        options: ToAPIApplicationCommandOptions[];
      }[];
    },
  }) {
    this.mockClient();
    this.mockGuild(options?.command.context);
    this.mockChannel(options?.command.context);
    this.mockGuildChannel(options?.command.context);
    this.mockTextChannel(options?.command.context);

    this.mockUser();
    this.mockUsers();
    this.mockApplication();
    this.mockGuildMember(options?.command.context);
    this.mockMessage(options?.message?.content as string);
    this.mockInteracion(options?.command);

    this.mockPrototypes();

    this.client.guilds.cache.set(this.guild?.id, this.guild);
  }

  public getClient(): Client {
    return this.client;
  }

  public getGuild(): Guild {
    return this.guild;
  }

  public getChannel(): Channel {
    return this.channel;
  }

  public getGuildChannel(): GuildChannel {
    return this.guildChannel;
  }

  public getBotPartyGuildChannel(): GuildChannel {
    return this.botPartyGuildChannel;
  }

  public getBotPartyTextChannel(): TextChannel {
    return this.botPartyTextChannel;
  }

  public getTextChannel(): TextChannel {
    return this.textChannel;
  }

  public getUser(): User {
    return this.user;
  }

  public getGuildMember(): GuildMember {
    return this.guildMember;
  }

  public getMessage(): Message {
    return this.message;
  }

  public getInteraction(): CommandInteraction {
    return this.interaction;
  }

  public getReaction(): MessageReaction {
    return this.reaction;
  }

  public getReactionUser(): User {
    return this.reactionUser;
  }

  private mockPrototypes() { // eslint-disable-line
    TextChannel.prototype.send = jest.fn().mockImplementation(() => ({
      react: jest.fn(),
    }));

    Message.prototype.edit = jest.fn();
  }

  private mockReaction(reactionOptions:MessageReaction, message:Message): void {
    this.reaction = Reflect.construct(MessageReaction, [
      this.client,
      { emoji: reactionOptions.emoji },
      message,
    ]);
  }

  private mockClient(): void {
    this.client = new Client({ intents: [] });
    this.client.login = jest.fn(() => Promise.resolve('LOGIN_TOKEN'));
    // My stuff
    this.client.commands = new Collection();
    // this.client.application = Reflect.construct(ClientApplication, [
    //   this.client,
    //   { id: '1234567890' },
    // ]);

    // // Register global commands
    // const globalCommands = path.join(__dirname, '../../discord/commands/global');
    // const globalFiles = fs.readdirSync(globalCommands);
    // // log.debug(`[${PREFIX}] Global command files: ${globalFiles}`);
    // globalFiles.forEach(file => {
    //   const filePath = path.join(globalCommands, file);
    //   // log.debug(`[${PREFIX}] Loading global command: ${filePath}`);
    //   const command = require(filePath); // eslint-disable-line
    //   // log.debug(`[${PREFIX}] Command: ${JSON.stringify(command, null, 2)}`);
    //   const commandData = command[Object.keys(command).find(
    // key => command[key].data !== undefined) as string].data.toJSON();
    //   // log.debug(`[${PREFIX}] Command data: ${JSON.stringify(commandData, null, 2)}`);
    //   // log.debug(`[${PREFIX}] Loaded global command: ${commandData.name}`);
    //   // this.client.commands.set(commandData, command);
    //   // this.client.application?.commands.create(commandData);
    // });

    // // Register guild commands
    // const guildCommands = path.join(__dirname, '../../discord/commands/guild');
    // const guildFiles = fs.readdirSync(guildCommands);
    // // log.debug(`[${PREFIX}] Guild command files: ${guildFiles}`);
    // guildFiles.forEach(file => {
    //   const filePath = path.join(guildCommands, file);
    //   // log.debug(`[${PREFIX}] Loading global command: ${filePath}`);
    //   const command = require(filePath); // eslint-disable-line
    //   // log.debug(`[${PREFIX}] Command: ${JSON.stringify(command, null, 2)}`);
    //   const commandData = command[Object.keys(command).find(
    // key => command[key].data !== undefined) as string].data.toJSON();  // eslint-disable-line
    //   // log.debug(`[${PREFIX}] Command data: ${JSON.stringify(commandData, null, 2)}`);
    //   // log.debug(`[${PREFIX}] Loaded global command: ${commandData.name}`);
    //   // this.client.commands.set(commandData, command);
    //   // this.client.application?.commands.create(commandData);
    // });
  }

  private mockApplication(): void {
    this.client.application = Reflect.construct(ClientApplication, [
      this.client,
      { id: '1234567890' },
    ]);

    // Register global commands
    const globalCommands = path.join(__dirname, '../../src/discord/commands/global');
    const globalFiles = fs.readdirSync(globalCommands);
    // log.debug(`[${PREFIX}] Global command files: ${globalFiles}`);
    globalFiles.forEach(file => {
      const filePath = path.join(globalCommands, file);
      // log.debug(`[${PREFIX}] Loading global command: ${filePath}`);
      const command = require(filePath); // eslint-disable-line
      // log.debug(`[${PREFIX}] Command: ${JSON.stringify(command, null, 2)}`);
      const commandData = command[Object.keys(command).find(
        key => command[key].data !== undefined,
      ) as string].data.toJSON();
      // log.debug(F, `Command data: ${JSON.stringify(commandData, null, 2)}`);
      log.debug(F, `Loaded global command: ${commandData.name}`);
      this.client.commands.set(commandData, command);
      // this.client.application?.commands.create(commandData);
    });

    // Register guild commands
    const guildCommands = path.join(__dirname, '../../src/discord/commands/guild');
    const guildFiles = fs.readdirSync(guildCommands);
    // log.debug(`[${PREFIX}] Guild command files: ${guildFiles}`);
    guildFiles.forEach(file => {
      const filePath = path.join(guildCommands, file);
      // log.debug(`[${PREFIX}] Loading global command: ${filePath}`);
      const command = require(filePath); // eslint-disable-line
      // log.debug(`[${PREFIX}] Command: ${JSON.stringify(command, null, 2)}`);
      const commandData = command[Object.keys(command).find(
        key => command[key].data !== undefined) as string].data.toJSON();  // eslint-disable-line
      // log.debug(F, `Command data: ${JSON.stringify(commandData, null, 2)}`);
      log.debug(F, `Loaded global command: ${commandData.name}`);
      this.client.commands.set(commandData, command);
      // this.client.application?.commands.create(commandData);
    });
  }

  private mockGuild(
    context: 'tripsit' | 'guild' | 'dm',
  ): void {
    if (context === 'tripsit') {
      this.guild = Reflect.construct(Guild, [
        this.client,
        {
          unavailable: false,
          id: '179641883222474752',
          name: 'TripSit Guild',
          icon: 'mocked guild icon url',
          splash: 'mocked guild splash url',
          region: 'eu-west',
          member_count: 42,
          large: false,
          features: [],
          application_id: 'application-id',
          afkTimeout: 1000,
          afk_channel_id: 'afk-channel-id',
          system_channel_id: 'system-channel-id',
          embed_enabled: true,
          verification_level: 2,
          explicit_content_filter: 3,
          mfa_level: 8,
          joined_at: new Date('2018-01-01').getTime(),
          owner_id: 'owner-id',
          channels: [],
          roles: [],
          presences: [],
          voice_states: [],
          emojis: [],
        },
      ]);
      this.guild.members.fetch = jest.fn().mockResolvedValue(Reflect.construct(GuildMember, [
        this.client,
        {
          // id: BigInt(1),
          id: '123456789',
          deaf: false,
          mute: false,
          self_mute: false,
          self_deaf: false,
          session_id: 'session-id1',
          channel_id: mockChannelId,
          nick: 'nick',
          joined_at: new Date().getTime(),
          user: Reflect.construct(User, [
            this.client,
            {
              id: '123456789',
              username: 'USERNAME',
              discriminator: 'user#0000',
              avatar: userAvatarUrl,
              bot: false,
            },
          ]),
          roles: [],
        },
        this.guild,
      ]));
    } else if (context === 'guild') {
      this.guild = Reflect.construct(Guild, [
        this.client,
        {
          unavailable: false,
          id: '960606557622657026',
          name: 'Not TripSit Guild',
          icon: 'mocked guild icon url',
          splash: 'mocked guild splash url',
          region: 'eu-west',
          member_count: 42,
          large: false,
          features: [],
          application_id: 'application-id',
          afkTimeout: 1000,
          afk_channel_id: 'afk-channel-id',
          system_channel_id: 'system-channel-id',
          embed_enabled: true,
          verification_level: 2,
          explicit_content_filter: 3,
          mfa_level: 8,
          joined_at: new Date('2018-01-01').getTime(),
          owner_id: 'owner-id',
          channels: [],
          roles: [],
          presences: [],
          voice_states: [],
          emojis: [],
        },
      ]);
      this.guild.members.fetch = jest.fn().mockResolvedValue(Reflect.construct(GuildMember, [
        this.client,
        {
          // id: BigInt(1),
          id: '123456789',
          deaf: false,
          mute: false,
          self_mute: false,
          self_deaf: false,
          session_id: 'session-id',
          channel_id: mockChannelId,
          nick: 'nick',
          joined_at: new Date('2020-01-01').getTime(),
          user: Reflect.construct(User, [
            this.client,
            {
              id: '123456789',
              username: 'USERNAME',
              discriminator: 'user#0000',
              avatar: userAvatarUrl,
              bot: false,
            },
          ]),
          roles: [],
        },
        this.guild,
      ]));
    }
  }

  private mockChannel(
    context: 'tripsit' | 'guild' | 'dm',
  ): void {
    if (context !== 'dm') {
      this.channel = Reflect.construct(BaseChannel, [
        this.client,
        {
          id: mockChannelId,
        },

      ]);
      (this.channel as TextChannel).send = jest.fn();
    }
  }

  private mockPartyChannel(): void {
    this.botPartyChannel = Reflect.construct(BaseChannel, [
      this.client,
      {
        id: 'party-channel-id',
      },
    ]);
  }

  private mockGuildChannel(
    context: 'tripsit' | 'guild' | 'dm',
  ): void {
    if (context !== 'dm') {
      this.guildChannel = Reflect.construct(GuildChannel, [
        this.guild,
        {
          ...this.channel,
          name: 'guild-channel',
          position: 1,
          parent_id: '123456789',
          permission_overwrites: [],
        },
      ]);
    }
  }

  private mockBotPartyTextChannel(): void {
    this.botPartyTextChannel = Reflect.construct(TextChannel, [
      this.guild,
      {
        ...this.botPartyGuildChannel,
        topic: 'topic',
        nsfw: false,
        last_message_id: '123456789',
        lastPinTimestamp: new Date('2019-01-01').getTime(),
        rate_limit_per_user: 0,
      },
    ]);
    this.botPartyTextChannel.messages.fetch = jest.fn().mockResolvedValue(this.botPartyTextChannel.messages.cache);
  }

  private mockBotPartyGuildChannel(): void {
    this.botPartyGuildChannel = Reflect.construct(GuildChannel, [
      this.guild,
      {
        ...this.botPartyChannel,
        name: 'listagem-de-grupos',
        position: 2,
        parent_id: '2',
        permission_overwrites: [],
      },
    ]);
  }

  private mockTextChannel(
    context: 'tripsit' | 'guild' | 'dm',
  ): void {
    if (context !== 'dm') {
      this.textChannel = Reflect.construct(TextChannel, [
        this.guild,
        {
          ...this.guildChannel,
          topic: 'topic',
          nsfw: false,
          last_message_id: '123456789',
          lastPinTimestamp: new Date('2019-01-01').getTime(),
          rate_limit_per_user: 0,
        },
      ]);
    }
  }

  private mockUser(): void {
    this.user = Reflect.construct(User, [
      this.client,
      {
        id: '123456789',
        username: 'USERNAME',
        discriminator: 'user#0000',
        avatar: userAvatarUrl,
        bot: false,
      },
    ]);
  }

  private mockUsers(): void {
    this.users = Reflect.construct(UserManager, [
      this.client,
    ]);
  }

  private mockReactionUser(userId:string): void {
    this.reactionUser = Reflect.construct(User, [
      this.client,
      {
        id: userId,
        username: `USERNAME-${userId}`,
        discriminator: `user#0000-${userId}`,
        avatar: userAvatarUrl,
        bot: false,
      },
    ]);
  }

  private mockGuildMember(
    context: 'tripsit' | 'guild' | 'dm',
  ): void {
    if (context !== 'dm') {
      this.guildMember = Reflect.construct(GuildMember, [
        this.client,
        {
          // id: BigInt(1),
          id: '123456789',
          deaf: false,
          mute: false,
          self_mute: false,
          self_deaf: false,
          session_id: 'session-id',
          channel_id: mockChannelId,
          nick: 'nick',
          joined_at: new Date('2020-01-01').getTime(),
          user: this.user,
          roles: [],
        },
        this.guild,
      ]);
    }
  }

  private mockPartyMessages(messages:Message[]): void {
    messages.forEach((message:Message) => {
      const msg = Reflect.construct(Message, [
        this.client,
        {
          id: BigInt(10),
          type: 'DEFAULT',
          content: '',
          author: this.user,
          webhook_id: null,
          member: this.guildMember,
          pinned: false,
          tts: false,
          nonce: 'nonce',
          embeds: [message.embeds],
          attachments: [],
          edited_timestamp: null,
          reactions: [],
          mentions: [],
          mention_roles: [],
          mention_everyone: [],
          hit: false,
        },
        this.botPartyTextChannel,
      ]);
      msg.channelId = this.botPartyTextChannel.id;
      this.botPartyTextChannel.messages.cache.set(msg.id, msg);
    });
  }

  private mockMessage(content:string): void {
    this.message = Reflect.construct(Message, [
      this.client,
      {
        id: BigInt(10),
        type: 'DEFAULT',
        content,
        author: this.user,
        webhook_id: null,
        member: this.guildMember,
        pinned: false,
        tts: false,
        nonce: 'nonce',
        embeds: [],
        attachments: [],
        edited_timestamp: null,
        reactions: [],
        mentions: [],
        mention_roles: [],
        mention_everyone: [],
        hit: false,
      },
      this.textChannel,
    ]);
    this.message.react = jest.fn();
  }

  private mockInteracion(command:{
    id: string;
    name: string;
    type: number;
    options: ToAPIApplicationCommandOptions[] | {
      name: string;
      type: number;
      options: ToAPIApplicationCommandOptions[];
    }[];
  }): void {
    if (!command) return;

    this.interaction = Reflect.construct(ChatInputCommandInteraction, [
      this.client,
      {
        data: command,
        id: BigInt(1),
        user: this.user,
        // member: this.guildMember,
        // channel: this.textChannel,
      },
      // this.textChannel,
    ]);
    this.interaction.options = Reflect.construct(CommandInteractionOptionResolver, [this.client, command.options]);
    // Define the 'getString' method
    // (this.interaction.options as CommandInteractionOptionResolver).getString = jest.fn().mockImplementation(
    //   (name:string) => {
    //     const options = command.options as ToAPIApplicationCommandOptions[];
    //     // log.debug(`[${PREFIX}] getString: ${name} - ${JSON.stringify(options, null, 2)}`);
    //     const option = options.find(opt => (opt as any).name === name);
    //     if (!option) return null;
    //     // log.debug(`[${PREFIX}] option ${JSON.stringify((option as any).value, null, 2)}`);
    //     return (option as any).value;
    //   },
    // );
    this.interaction.reply = jest.fn();
    // this.interaction.deferReply = () => Promise.resolve({} as Promise<Message<boolean>>);
    this.interaction.deferReply = jest.fn();
    this.interaction.editReply = jest.fn();
    // this.interaction.followUp = jest.fn();
    this.interaction.guildId = this.guild?.id;
    this.interaction.isCommand = jest.fn(() => true);
    this.interaction.showModal = jest.fn();
  }
}
