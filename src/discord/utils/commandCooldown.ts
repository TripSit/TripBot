import { User, GuildMember } from 'discord.js';

// Map to store cooldowns for users and their commands
const cooldowns = new Map<string, Map<string, number>>();

/**
 * commandCooldown
 * @param {User | GuildMember} user The user or guild member
 * @param {string} commandName The name of the command being executed
 * @param {number} cooldownAmount The cooldown duration in milliseconds (default is 30 seconds)
 * @return {Promise<{ success: boolean; message?: string }>}
 */
async function commandCooldown(
  user: User | GuildMember,
  commandName: string,
  cooldownAmount: number = 30000,
): Promise<{ success: boolean; message?: string }> {
  const now = Date.now();

  // Ensure there's a map for the user in the cooldowns map
  if (!cooldowns.has(user.id)) {
    cooldowns.set(user.id, new Map());
  }

  const userCooldowns = cooldowns.get(user.id) as Map<string, number>;

  // Check if the user has a cooldown for the specific command
  const commandExpiration = userCooldowns.get(commandName);
  if (commandExpiration) {
    const expirationTime = commandExpiration + cooldownAmount;

    // If the cooldown is still active, inform the user
    if (now < expirationTime) {
      const timeLeft = (expirationTime - now) / 1000; // Time left in seconds
      return {
        success: false,
        message: `Please wait ${timeLeft.toFixed(1)} more seconds before using this command or button again.`,
      };
    }
  }

  // Set or reset the cooldown for the specific command
  userCooldowns.set(commandName, now);

  return { success: true };
}

export default commandCooldown;
