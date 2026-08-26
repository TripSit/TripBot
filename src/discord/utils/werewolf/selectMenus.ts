import { ActionRowBuilder, StringSelectMenuBuilder } from 'discord.js';
import { WerewolfSelectMenuId } from './types';

type Target = { discordId: string; label: string };

// The acting player's own id is embedded in the customId (matching the `rpg*` select-menu
// convention already used elsewhere) so the handler can reject anyone else interacting with it.
export function peekSelectMenu(seerDiscordId: string, targets: Target[]): ActionRowBuilder<StringSelectMenuBuilder> {
  const menu = new StringSelectMenuBuilder()
    .setCustomId(`${WerewolfSelectMenuId.PEEK_SELECT}~${seerDiscordId}`)
    .setPlaceholder('Choose a player to peek at')
    .addOptions(targets.map(target => ({ label: target.label, value: target.discordId })));

  return new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(menu);
}

export function protectSelectMenu(
  doctorDiscordId: string,
  targets: Target[],
): ActionRowBuilder<StringSelectMenuBuilder> {
  const menu = new StringSelectMenuBuilder()
    .setCustomId(`${WerewolfSelectMenuId.PROTECT_SELECT}~${doctorDiscordId}`)
    .setPlaceholder('Choose a player to protect')
    .addOptions(targets.map(target => ({ label: target.label, value: target.discordId })));

  return new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(menu);
}
