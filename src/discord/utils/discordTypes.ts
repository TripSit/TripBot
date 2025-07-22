import type { Collection } from 'discord.js';

declare module 'discord.js' {
  export interface Client {
    commands: Collection<unknown, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
  }
}
