import { Server } from 'http';
import app from './app';

const F = f(__filename);

const port = env.API_PORT || 1337;

export default async function api(): Promise<Server> {
  return new Promise((resolve, reject) => {
    // Express 5 passes a startup failure (for example EADDRINUSE) to this callback instead of throwing
    const server = app.listen(port, '0.0.0.0', (err?: Error) => {
      if (err) {
        log.info(F, `❌ Server failed to start: ${err.message}`);
        reject(err);
        return;
      }
      log.info(F, `Listening at http://api.${process.env.DNS_DOMAIN ?? 'localhost'}:${port}`);
      resolve(server);
    });
  });
}
