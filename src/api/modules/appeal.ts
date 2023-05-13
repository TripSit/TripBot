import { Request, Response } from 'express';
import { ChannelType, EmbedBuilder, Guild } from 'discord.js';
import { database } from '../../global/utils/knex';

const F = f(__filename);

// Will run when there are any incoming POST requests to https://localhost:(port)/user.
// Note that a POST request is different from a GET request
// so this won't exactly work when you actually visit https://localhost:(port)/user

export default async function appeal(
  req: Request,
  res: Response,
) {
  log.info(F, `Received request: ${JSON.stringify(req.method)}, ${JSON.stringify(req.url)}`);
  // log.info(F, `Request headers: ${JSON.stringify(req.headers, null, 2)}`);
  log.debug(F, `Request body: ${JSON.stringify(req.body, null, 2)}`);
  const body = req.body as {
    guild: string;
    userId: string;
    username: string;
    discriminator: string;
    avatar: string;
    reason: string;
    solution: string;
    future: string;
    extra: string;
    email: string;
  };

  // const guildData = await database.guilds.get(body.guild);
  // log.debug(F, `guildData: ${JSON.stringify(guildData, null, 2)}`);

  let guild = {} as Guild;
  try {
    guild = await discordClient.guilds.fetch(body.guild);
  } catch (e) {
    log.error(F, `Could not find guild with id ${body.guild}`);
    res.status(500).send(`Could not find guild with id ${body.guild}`);
    return;
  }
  // log.debug(F, `guild: ${JSON.stringify(guild, null, 2)}`);

  const roleMod = await guild.roles.fetch(env.ROLE_MODERATOR);
  // log.debug(F, `modRole: ${JSON.stringify(roleMod, null, 2)}`);

  const channelModerators = await guild.channels.fetch(env.CHANNEL_MODERATORS);
  if (!channelModerators) {
    log.error(F, `Could not find channel with id ${env.CHANNEL_MODERATORS}`);
    res.status(500).send(`Could not find channel with id ${env.CHANNEL_MODERATORS}`);
    return;
  }

  if (channelModerators.type !== ChannelType.GuildText) {
    log.error(F, `Channel with id ${env.CHANNEL_MODERATORS} is not a text channel`);
    res.status(500).send(`Channel with id ${env.CHANNEL_MODERATORS} is not a text channel`);
    return;
  }
  // log.debug(F, `channelModerators: ${JSON.stringify(channelModerators, null, 2)}`);

  // const userData = await database.users.get(body.userId, null, null);
  // log.debug(F, `userData: ${JSON.stringify(userData, null, 2)}`);

  // Construct the message that will be sent to the room
  const message = `Hey ${roleMod}, ${body.username} has submitted a new appeal:`;

  const embed = new EmbedBuilder()
    .setTitle(`${body.username}#${body.discriminator} (${body.userId})`)
    .setThumbnail(body.avatar)
    .addFields([
      { name: 'Reason', value: body.reason },
      { name: 'Solution', value: body.solution },
      { name: 'Future', value: body.future },
      { name: 'Extra', value: body.extra },
    ])
    .setFooter({
      text: '*I could not find a modthread for this user, so i put this here. If there\'s an existing modthread (or you create one), remember to use /mod link to link it to the user.*',
    });

  await channelModerators.send({
    content: message,
    embeds: [embed],
  });

  // If the userData has a mod_thread_id, then use that thread, otherwise send a new message to the appeals room
  res.status(200).send('okay');
}
