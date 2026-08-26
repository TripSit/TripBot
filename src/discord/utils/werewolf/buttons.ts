import { ButtonBuilder, ButtonStyle } from 'discord.js';
import { WerewolfButtonId } from './types';

export class WerewolfButton {
  static get join() {
    return new ButtonBuilder()
      .setCustomId(WerewolfButtonId.JOIN)
      .setLabel('Join')
      .setStyle(ButtonStyle.Primary);
  }

  static get leave() {
    return new ButtonBuilder()
      .setCustomId(WerewolfButtonId.LEAVE)
      .setLabel('Leave')
      .setStyle(ButtonStyle.Danger);
  }

  static get how() {
    return new ButtonBuilder()
      .setCustomId(WerewolfButtonId.HOW)
      .setLabel('How To Play')
      .setStyle(ButtonStyle.Secondary);
  }

  static get start() {
    return new ButtonBuilder()
      .setCustomId(WerewolfButtonId.START)
      .setLabel('Start')
      .setStyle(ButtonStyle.Success);
  }

  static get diary() {
    return new ButtonBuilder()
      .setCustomId(WerewolfButtonId.DIARY)
      .setLabel('Diary')
      .setStyle(ButtonStyle.Primary);
  }

  static kill(discordId: string, label: string) {
    return new ButtonBuilder()
      .setCustomId(`${WerewolfButtonId.KILL}~${discordId}`)
      .setLabel(`Kill ${label}`)
      .setStyle(ButtonStyle.Danger);
  }

  static hang(discordId: string, label: string) {
    return new ButtonBuilder()
      .setCustomId(`${WerewolfButtonId.HANG}~${discordId}`)
      .setLabel(`Hang ${label}`)
      .setStyle(ButtonStyle.Danger);
  }

  static get peek() {
    return new ButtonBuilder()
      .setCustomId(WerewolfButtonId.PEEK)
      .setLabel('Peek')
      .setEmoji('🔮')
      .setStyle(ButtonStyle.Primary);
  }

  static get protect() {
    return new ButtonBuilder()
      .setCustomId(WerewolfButtonId.PROTECT)
      .setLabel('Protect')
      .setEmoji('💉')
      .setStyle(ButtonStyle.Primary);
  }

  // Embeds the hunter's own id (unlike Kill/Hang, which authorize "any wolf"/"anyone alive") since
  // revenge is only ever valid for one specific dead player.
  static revenge(hunterDiscordId: string, targetDiscordId: string, label: string) {
    return new ButtonBuilder()
      .setCustomId(`${WerewolfButtonId.REVENGE}~${hunterDiscordId}~${targetDiscordId}`)
      .setLabel(`Take ${label} with you`)
      .setStyle(ButtonStyle.Danger);
  }
}

export default WerewolfButton;
