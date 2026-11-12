import { Collection } from 'discord.js';
import type { Channel } from 'discord.js';

type Ctor = { prototype: object };

/** Builds an object whose prototype is a real discord.js class, so `instanceof` checks pass. */
export function stubInstance<T>(ctor: Ctor, props: Record<string, unknown> = {}): T {
  const instance = Object.create(ctor.prototype);
  Object.entries(props).forEach(([key, value]) => {
    // defineProperty so getter-only accessors on the prototype don't block assignment
    Object.defineProperty(instance, key, {
      value, writable: true, configurable: true, enumerable: true,
    });
  });
  return instance as T;
}

export function collectionOf<V>(entries: Array<[string, V]> | Record<string, V>): Collection<string, V> {
  return new Collection(Array.isArray(entries) ? entries : Object.entries(entries));
}

export const asChannel = (value: unknown) => value as Channel;

/** Lets pending promise callbacks (including un-awaited ones inside code under test) run. */
export async function flushPromises(rounds = 5): Promise<void> {
  for (let i = 0; i < rounds; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    await new Promise<void>(resolve => { setImmediate(resolve); });
  }
}
