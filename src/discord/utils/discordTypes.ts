import { Collection } from 'discord.js';

declare module 'discord.js' {
  export interface Client {
    commands: Collection<unknown, any>
  }
}

export {};
