import { Server } from 'http';
import app from './app';

const F = f(__filename);

const port = 3024;

export default async function api(): Promise<Server> {
  log.info(F, `Attempting to start server on port ${port}...`); // Debug log

  return new Promise((resolve, reject) => {
    const server = app.listen(port, '0.0.0.0', () => {
      log.info(F, `✅ Server is running at http://localhost:${port}`);
      resolve(server);
    }).on('error', err => {
      log.info(F, `❌ Server failed to start: ${err.message}`);
      reject(err);
    });
  });
}
