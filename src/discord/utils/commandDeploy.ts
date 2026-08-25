import 'module-alias/register';
import fs from 'fs/promises';
import path from 'path';
import {
  REST,
} from 'discord.js';
import {
  Routes,
} from 'discord-api-types/v10';
import { log } from '../../global/utils/log';
import { SlashCommand } from '../@types/commandDef';
import validateEnv from '../../global/utils/env.validate';

const F = f(__filename);

async function getCommands(commandType: string): Promise<SlashCommand[]> {
  const commandDir = path.join(__dirname, '../commands');
  const files = await fs.readdir(path.join(commandDir, commandType));
  // log.debug(F, `${commandType} command files: ${files}`);
  return files
    .filter(file => (file.endsWith('.ts') || file.endsWith('.js')) && !file.startsWith('index'))
    .map(file => ({
      file,
      // log.debug(F, `${commandType} command file: ${file}`);
      command: require(`${commandDir}/${commandType}/${file}`), // eslint-disable-line
    }))
    .filter(({ file, command }) => {
      const key = Object.keys(command).find(k => command[k] && command[k].data !== undefined);
      // log.warn() unconditionally touches global.rollbar, which isn't set up in this standalone
      // script's execution path (only during normal bot startup) - console.warn avoids that.
      if (!key) {
        // eslint-disable-next-line no-console
        console.warn(`[commandDeploy] Skipping ${commandType}/${file} - no SlashCommand .data export found.`);
      }
      return key !== undefined;
    })
    .map(({ command }) => {
      const key = Object.keys(command).find(k => command[k] && command[k].data !== undefined) as string;
      return command[key].data.toJSON();
    });
}

export default async function deployCommands():Promise<{
  globalCommands: SlashCommand[];
  guildCommands: SlashCommand[];
}> {
  const globalCommands:SlashCommand[] = [];
  const guildCommands:SlashCommand[] = [];
  if (validateEnv('DISCORD')) {
    // log.debug(F, `discordClientId: ${env.DISCORD_CLIENT_ID}`);
    // log.debug(F, `discordGuildId: ${env.DISCORD_GUILD_ID}`);

    const rest = new REST({ version: '9' }).setToken(env.DISCORD_CLIENT_TOKEN);

    await Promise.all([
      getCommands('global').then(commands => {
        globalCommands.push(...commands);
        // log.debug(F, `Global commands: ${JSON.stringify(globalCommands.length, null, 2)}`);
        return rest.put(
          Routes.applicationCommands(env.DISCORD_CLIENT_ID.toString()),
          { body: commands },
        );
      }),
      getCommands('guild').then(commands => {
        guildCommands.push(...commands);
        // log.debug(F, `Guild commands: ${JSON.stringify(guildCommands.length, null, 2)}`);
        return rest.put(
          Routes.applicationGuildCommands(env.DISCORD_CLIENT_ID.toString(), env.DISCORD_GUILD_ID),
          { body: commands },
        );
      }),
    ])
      .then(() => {
        log.info(F, 'Commands successfully registered!');
        return { globalCommands, guildCommands };
      })
      .catch(ex => {
        log.error(F, 'Error in registering commands');
        // eslint-disable-next-line no-console
        console.log(ex);
        process.exit(1);
      });
  }
  return { globalCommands, guildCommands };
}

const args = process.argv.slice(2); // Remove the first two default arguments
if (args.includes('deployCommands')) {
  deployCommands();
}
