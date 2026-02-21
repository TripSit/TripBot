import { Server } from 'http';
import app from './app';

const F = f(__filename);

const port = env.API_PORT || 1337;

export default async function api(): Promise<Server> {
  return new Promise((resolve, reject) => {
    const server = app.listen(port, '0.0.0.0', () => {
      log.info(F, `Listening at http://api.${process.env.DNS_DOMAIN ?? 'localhost'}:${port}`);
      resolve(server);
    }).on('error', err => {
      log.info(F, `❌ Server failed to start: ${err.message}`);
      reject(err);
    });
  });
}
