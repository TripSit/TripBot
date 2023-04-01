import {
  REST,
} from 'discord.js';
import {
  Routes,
} from 'discord-api-types/v10';
import fs from 'fs/promises';
import path from 'path';
import { log } from '../../global/utils/log';
import { SlashCommand } from '../@types/commandDef';
import { validateEnv } from '../../global/utils/env.validate';

const F = f(__filename);

/**
 * @param {string} commandType Either Global or Guild
 * @return {Promise<SlashCommand[]>} The list of commands
 */
async function getCommands(commandType: 'global' | 'guild' | 'partner'): Promise<SlashCommand[]> {
  const commandDir = path.join(__dirname, '../commands');
  const files = await fs.readdir(path.join(commandDir, commandType));
  // log.debug(F, `${commandType} command files: ${files}`);
  return files
    .filter(file => file.endsWith('.ts') && !file.endsWith('index.ts'))
    .map(file =>
      // log.debug(F, `${commandType} command file: ${file}`);
       require(`${commandDir}/${commandType}/${file}`)) // eslint-disable-line
    .map(command => command[Object.keys(command).find(key => command[key].data !== undefined) as string].data.toJSON());
}

if (validateEnv()) {
// log.debug(F, `discordClientId: ${env.DISCORD_CLIENT_ID}`);
// log.debug(F, `discordGuildId: ${env.DISCORD_GUILD_ID}`);

  const rest = new REST({ version: '9' }).setToken(env.DISCORD_CLIENT_TOKEN);

  Promise.all([
    getCommands('global').then(commands => {
      const startTime = Date.now();
      log.debug(F, `Registering ${commands.length} global commands...`);
      rest.put(
        Routes.applicationCommands(env.DISCORD_CLIENT_ID.toString()),
        { body: commands },
      );
      log.debug(F, `Registered global commands in ${Date.now() - startTime}ms`);
    }),
    getCommands('guild').then(commands => {
      const startTime = Date.now();
      log.debug(F, `Registering ${commands.length} guild commands...`);
      rest.put(
        Routes.applicationGuildCommands(env.DISCORD_CLIENT_ID.toString(), env.DISCORD_GUILD_ID),
        { body: commands },
      );
      log.debug(F, `Registered guild commands in ${Date.now() - startTime}ms`);
    }),
    getCommands('partner').then(commands => {
      const startTime = Date.now();
      const partnerGuilds = [
        '960606557622657026', // home guild
        '1088437051134857336', // mb's guild
      ];
      log.debug(F, `Registering ${commands.length} partner commands in ${partnerGuilds.length} guilds...`);

      Promise.all(partnerGuilds.map(guildId => rest.put(
        Routes.applicationGuildCommands(env.DISCORD_CLIENT_ID.toString(), guildId),
        { body: commands },
      )))
        .then(() => {
          log.debug(F, `Registered partner commands in ${Date.now() - startTime}ms`);
        });
    }),
  ])
    .then(() => {
      log.info(F, 'Commands successfully registered!');
    })
    .catch(ex => {
      log.error(F, `Error in registering commands: ${ex}`);
      process.exit(1);
    });
}
