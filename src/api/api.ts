import app from './app';

const F = f(__filename);

const port = env.API_PORT || 1337;

export default async function api(): Promise<void> {
  app.listen(port, () => {
    log.debug(F, `Listening at http://api.${process.env.DNS_DOMAIN ?? 'localhost'}:${port}`);
  });
}
