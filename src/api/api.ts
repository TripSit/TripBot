import app from './app';

const F = f(__filename);
// const httpPort = 1337;
// const httpsPort = 1887;

const port = process.env.PORT || 1337;

// const host = env.NODE_ENV === 'production' ? 'api.tripsit.me' : 'api.tripsit.us';

export default async function api(): Promise<void> {
  app.listen(port, () => {
    log.debug(F, `Listening at http://localhost:${port}`);
  });
}
