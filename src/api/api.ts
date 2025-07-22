import type { Server } from 'node:http';

import { log } from '../global/utils/log';

import app from './app';

const F = f(__filename);

const port = env.API_PORT ?? 1337;

export default async function api(): Promise<Server> {
  const server = app.listen(port);
  await new Promise<void>((resolve, reject) => {
    server.once('listening', resolve);
    server.once('error', reject);
  });
  log.info(
    F,
    `Listening at http://api.${process.env.DNS_DOMAIN ?? 'localhost'}:${port.toString()}`,
  );
  return server;
}
