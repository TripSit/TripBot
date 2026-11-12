import 'module-alias/register';
import crypto from 'crypto';
import fs from 'fs/promises';
import os from 'os';
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

type DeployOptions = {
  /** Skip the Discord calls when the command definitions match the last successful deploy. */
  skipIfUnchanged?: boolean;
  /** Exit the process when registration fails (CLI use); the bot itself should keep running. */
  exitOnError?: boolean;
};

// Remembers the last deployed definitions so routine restarts (tsc-watch restarts on every save) don't hit
// Discord's registration rate limits. Losing the file only causes one redundant deploy.
function hashFilePath(): string {
  return path.join(os.tmpdir(), `tripbot-command-hash-${env.DISCORD_CLIENT_ID}-${env.DISCORD_GUILD_ID}`);
}

export default async function deployCommands(options: DeployOptions = {}):Promise<{
  globalCommands: SlashCommand[];
  guildCommands: SlashCommand[];
}> {
  const { skipIfUnchanged = false, exitOnError = true } = options;
  const globalCommands:SlashCommand[] = [];
  const guildCommands:SlashCommand[] = [];
  if (validateEnv('DISCORD')) {
    const rest = new REST({ version: '9' }).setToken(env.DISCORD_CLIENT_TOKEN);

    try {
      globalCommands.push(...await getCommands('global'));
      guildCommands.push(...await getCommands('guild'));

      const hash = crypto.createHash('sha256').update(JSON.stringify({ globalCommands, guildCommands })).digest('hex');
      if (skipIfUnchanged && await fs.readFile(hashFilePath(), 'utf8').catch(() => '') === hash) {
        log.info(F, 'Command definitions unchanged, skipping registration.');
        return { globalCommands, guildCommands };
      }

      await Promise.all([
        rest.put(Routes.applicationCommands(env.DISCORD_CLIENT_ID.toString()), { body: globalCommands }),
        rest.put(
          Routes.applicationGuildCommands(env.DISCORD_CLIENT_ID.toString(), env.DISCORD_GUILD_ID),
          { body: guildCommands },
        ),
      ]);
      if (skipIfUnchanged) await fs.writeFile(hashFilePath(), hash).catch(() => undefined);
      log.info(F, 'Commands successfully registered!');
    } catch (ex) {
      log.error(F, 'Error in registering commands');
      // eslint-disable-next-line no-console
      console.log(ex);
      if (exitOnError) process.exit(1);
    }
  }
  return { globalCommands, guildCommands };
}

const args = process.argv.slice(2); // Remove the first two default arguments
if (args.includes('deployCommands')) {
  deployCommands();
}
