import {
  REST,
} from 'discord.js';
import {
  Routes,
} from 'discord-api-types/v10';
import fs from 'fs/promises';
import path from 'path';
import { log } from '../../../global/utils/log';
import { SlashCommand } from '../../@types/commandDef';
import { validateEnv } from '../../../global/utils/env.validate';

const F = f(__filename);

/*
*
* In this file I, MB, tried to make certain commands only register on 'partner' guilds
* I got it to work but it takes like 60 seconds and that doesn't seem sustainable when i only have 1 partner guild
*
*/

/**
 * @param {string} commandType Either Global or Guild
 * @return {Promise<SlashCommand[]>} The list of commands
 */
async function getCommands(commandType: 'global' | 'guild' | 'partner'): Promise<SlashCommand[]> {
  const commandDir = path.join(__dirname, '../commands');
  const files = await fs.readdir(path.join(commandDir, commandType));
  // log.debug(F, `${commandType} command files: ${files}`);
  return files
    .filter(file => (file.endsWith('.ts') || file.endsWith('.js')) && !file.startsWith('index'))
    .map(file =>
      // log.debug(F, `${commandType} command file: ${file}`);
       require(`${commandDir}/${commandType}/${file}`)) // eslint-disable-line
    .map(command => command[Object.keys(command).find(key => command[key].data !== undefined) as string].data.toJSON());
}

async function deployCommands() {
  const startTime = Date.now();
  // log.debug(F, `discordClientId: ${env.DISCORD_CLIENT_ID}`);
  // log.debug(F, `discordGuildId: ${env.DISCORD_GUILD_ID}`);

  const rest = new REST({ version: '9' }).setToken(env.DISCORD_CLIENT_TOKEN);

  const values = await Promise.allSettled([
    await getCommands('global'),
    await getCommands('guild'),
    await getCommands('partner'),
  ]);

  const globalCommands = values[0].status === 'fulfilled' ? values[0].value : {} as SlashCommand[];
  const guildCommands = values[1].status === 'fulfilled' ? values[1].value : {} as SlashCommand[];
  const partnerCommands = values[2].status === 'fulfilled' ? values[2].value : {} as SlashCommand[];

  // const registerCommands = [
  //   () => {
  //     log.debug(F, ` Registering ${globalCommands.length} global commands...`);
  //     rest.put(
  //       Routes.applicationCommands(env.DISCORD_CLIENT_ID.toString()),
  //       { body: globalCommands },
  //     );
  //     log.debug(F, ` Registered global commands in ${Date.now() - startTime}ms`);
  //   },
  //   () => {
  //     log.debug(F, ` Registering ${guildCommands.length} guild commands...`);
  //     rest.put(
  //       Routes.applicationGuildCommands(env.DISCORD_CLIENT_ID.toString(), env.DISCORD_GUILD_ID),
  //       { body: guildCommands },
  //     );
  //     log.debug(F, ` Registered guild commands in ${Date.now() - startTime}ms`);
  //   },
  // ];

  const registerCommands = [
    rest.put(
      Routes.applicationCommands(env.DISCORD_CLIENT_ID.toString()),
      { body: globalCommands },
    ),
    rest.put(
      Routes.applicationGuildCommands(env.DISCORD_CLIENT_ID.toString(), env.DISCORD_GUILD_ID),
      { body: guildCommands },
    ),
  ];

  const partnerGuilds = [
    '960606557622657026', // home guild
    '1088437051134857336', // mb's guild
  ];

  // partnerGuilds.forEach(guildId => {
  //   registerCommands.push(() => {
  //     log.debug(F, ` Registering ${partnerCommands.length} partner commands for guild ${guildId}...`);
  //     rest.put(
  //       Routes.applicationGuildCommands(env.DISCORD_CLIENT_ID.toString(), guildId),
  //       { body: partnerCommands },
  //     );
  //     log.debug(F, ` Registered partner commands for guild ${guildId} in ${Date.now() - startTime}ms`);
  //   });
  // });

  partnerGuilds.forEach(guildId => {
    registerCommands.push(
      rest.put(
        Routes.applicationGuildCommands(env.DISCORD_CLIENT_ID.toString(), guildId),
        { body: partnerCommands },
      ),
    );
  });

  Promise.all(registerCommands)
    .then(() => {
      log.info(F, `Commands successfully registered in ${Date.now() - startTime}ms`);
    })
    .catch(ex => {
      log.error(F, `Error in registering commands: ${ex}`);
      process.exit(1);
    });
}

if (validateEnv()) {
  deployCommands();
}
