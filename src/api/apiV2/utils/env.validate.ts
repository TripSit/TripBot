import { stripIndents } from 'common-tags';

export default function validateEnv(
  service: 'APIV2',
) {
  const F = f(__filename);
  log.info(F, `You are in ${process.env.NODE_ENV?.toUpperCase()}`);

  if (service === 'APIV2' && !process.env.VUE_APP_PASSWORD) {
    log.error(F, stripIndents`Missing VUE_APP_PASSWORD`);
    return false;
  }

  return true;
}
