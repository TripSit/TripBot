const F = f(__filename);

export default dramacounter;

/**
 * Birthday information of a user
 * @param {'get' | 'set'} command
 * @param {string} guildId
 * @param {Date} lastDramaAt
 * @param {string} dramaReason
 * @return {any}
 */
export async function dramacounter(
  command: 'get' | 'set',
  guildId: string,
  lastDramaAt: Date,
  dramaReason: string,
):Promise<Drama> {
  let response = {} as {
    dramaReason: string;
    lastDramaAt: Date;
  };
  const guildData = await db.discord_guilds.upsert({
    where: {
      id: guildId,
    },
    create: {
      id: guildId,
    },
    update: {},
  });

  if (command === 'get') {
    if (guildData.last_drama_at) {
      const lastDramaDate = guildData.last_drama_at;
      const lastDramaReason = guildData.drama_reason || 'No reason given';
      response = {
        dramaReason: lastDramaReason,
        lastDramaAt: lastDramaDate,
      };
    } else {
      return { dramaReason: null, lastDramaAt: null };
    }
  } else if (command === 'set') {
    guildData.last_drama_at = lastDramaAt;
    guildData.drama_reason = dramaReason;
    // await guildUpdate(guildData);
    await db.discord_guilds.update({
      where: {
        id: guildId,
      },
      data: {
        last_drama_at: lastDramaAt,
        drama_reason: dramaReason,
      },
    });
    response = { dramaReason, lastDramaAt };
  }

  log.info(F, `response: ${JSON.stringify(response, null, 2)}`);
  return response;
}

type Drama = {
  dramaReason: string | null;
  lastDramaAt: Date | null;
};
