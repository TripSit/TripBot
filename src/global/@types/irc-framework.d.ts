// irc-framework ships no type definitions. This declares only the surface TripBot uses;
// extend it as more of the library is needed.
declare module 'irc-framework' {
  import { EventEmitter } from 'events';

  export interface IrcConnectOptions {
    host: string;
    port?: number;
    tls?: boolean;
    rejectUnauthorized?: boolean;
    nick: string;
    username?: string;
    gecos?: string;
    account?: {
      account: string;
      password: string;
    };
    auto_reconnect?: boolean;
    auto_reconnect_max_wait?: number;
    auto_reconnect_max_retries?: number;
    ping_interval?: number;
    ping_timeout?: number;
    message_max_length?: number;
    sasl_disconnect_on_fail?: boolean;
    version?: string;
  }

  export interface IrcTags {
    [key: string]: string | undefined;
  }

  export interface RegisteredEvent {
    nick: string;
    tags: IrcTags;
  }

  export interface MessageEvent {
    from_server: boolean;
    nick: string;
    ident: string;
    hostname: string;
    target: string;
    message: string;
    tags: IrcTags;
    time?: number;
    /** NickServ account from the IRCv3 account-tag capability, when the server provides it. */
    account?: string;
  }

  export interface JoinEvent {
    nick: string;
    ident: string;
    hostname: string;
    channel: string;
    gecos: string;
    /** From extended-join: the account name, or false when the user is not logged in. */
    account?: string | false;
    time?: number;
    tags: IrcTags;
  }

  export interface ChannelErrorEvent {
    error: string;
    channel?: string;
    nick?: string;
    reason?: string;
  }

  export interface NickInUseEvent {
    nick: string;
    reason: string;
  }

  export interface IrcCommand {
    command: string;
    params: string[];
    tags: IrcTags;
  }

  export interface SaslFailedEvent {
    reason: 'fail' | 'too_long' | 'nick_locked' | 'unsupported_mechanism' | 'capability_missing' | string;
    message?: string;
  }

  export interface IrcEvents {
    registered: (event: RegisteredEvent) => void;
    privmsg: (event: MessageEvent) => void;
    action: (event: MessageEvent) => void;
    notice: (event: MessageEvent) => void;
    join: (event: JoinEvent) => void;
    'irc error': (event: ChannelErrorEvent) => void;
    'nick in use': (event: NickInUseEvent) => void;
    'sasl failed': (event: SaslFailedEvent) => void;
    'unknown command': (command: IrcCommand) => void;
    'socket close': (err: Error | false) => void;
    close: (hadError: boolean) => void;
  }

  export class Client extends EventEmitter {
    constructor(options?: Partial<IrcConnectOptions>);

    readonly connected: boolean;

    user: {
      nick: string;
    };

    connect(options?: IrcConnectOptions): void;

    join(channel: string, key?: string): void;

    part(channel: string, message?: string): void;

    say(target: string, message: string): void;

    changeNick(nick: string): void;

    raw(...args: (string | number)[]): void;

    quit(message?: string): void;

    on<E extends keyof IrcEvents>(event: E, listener: IrcEvents[E]): this;
  }
}
