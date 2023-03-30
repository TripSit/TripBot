import { ChatInputCommandInteraction } from 'discord.js';

const F = f(__filename);

export async function bridgeCreate(
  interaction:ChatInputCommandInteraction,
):Promise<string> {
  log.debug(F, `bridgeCreate: ${JSON.stringify(interaction, null, 2)}`);
  return 'Creating bridge...';
}

export async function bridgeConfirm(
  interaction:ChatInputCommandInteraction,
):Promise<string> {
  log.debug(F, `bridgeConfirm: ${JSON.stringify(interaction, null, 2)}`);
  return 'Confirming bridge...';
}

export async function bridgePause(
  interaction:ChatInputCommandInteraction,
):Promise<string> {
  log.debug(F, `bridgePause: ${JSON.stringify(interaction, null, 2)}`);
  return 'Pausing bridge...';
}

export async function bridgeResume(
  interaction:ChatInputCommandInteraction,
):Promise<string> {
  log.debug(F, `bridgeResume: ${JSON.stringify(interaction, null, 2)}`);
  return 'Resuming bridge...';
}

export async function bridgeRemove(
  interaction:ChatInputCommandInteraction,
):Promise<string> {
  log.debug(F, `bridgeRemove: ${JSON.stringify(interaction, null, 2)}`);
  return 'Removing bridge...';
}
