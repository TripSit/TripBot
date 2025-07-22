const F = f(__filename);

export default invite;

interface InviteInfo {
  bot: string;
  discord: string;
}

/**
 *
 * @return {inviteInfo}
 */
export async function invite(): Promise<InviteInfo> {
  const inviteInfo =
    process.env.NODE_ENV === 'production'
      ? {
          bot: 'https://discord.com/api/oauth2/authorize?client_id=957780726806380545&permissions=18432&scope=bot%20applications.commands',
          discord: 'https://discord.gg/TripSit',
        }
      : {
          bot: 'https://discord.com/api/oauth2/authorize?client_id=977945272359452713&permissions=18432&scope=bot%20applications.commands',
          discord: 'https://discord.gg/cNDsrMSY',
        };
  log.info(F, `response: ${JSON.stringify(inviteInfo, null, 2)}`);
  return inviteInfo;
}
