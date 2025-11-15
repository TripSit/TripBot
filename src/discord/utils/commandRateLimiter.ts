export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
}

export interface RateLimitConfig {
  defaultLimit: number;
  premiumLimit: number;
  windowMs: number;
  messageInterval?: number; // Show rate limit message every X queries
}

/**
 * RateLimiter class to manage rate limits for users.
 * It tracks the number of queries made by each user and resets the count after a specified time window.
 * It also handles premium users with higher limits and can show rate limit messages based on a configurable interval.
 * Example usage:
    export const commandRateLimiter = new RateLimiter({
      defaultLimit: 100,
      premiumLimit: 500,
      windowMs: 60 * 60 * 1000, // 1 hour
      messageInterval: 20,
    });
 */

export class RateLimiter {
  private userRateLimits = new Map<string, { count: number; resetTime: number }>();

  private userLastRateLimitMessage = new Map<string, number>();

  constructor(private config: RateLimitConfig) {}

  checkRateLimit(userId: string, isPremiumUser: boolean): RateLimitResult {
    const now = Date.now();
    const queryLimit = isPremiumUser ? this.config.premiumLimit : this.config.defaultLimit;
    const userLimit = this.userRateLimits.get(userId);

    if (!userLimit || now >= userLimit.resetTime) {
      // First query of the period or reset time has passed
      const resetTime = now + this.config.windowMs;
      this.userRateLimits.set(userId, { count: 1, resetTime });
      return { allowed: true, remaining: queryLimit - 1, resetTime };
    }

    if (userLimit.count >= queryLimit) {
      // Rate limit exceeded
      return { allowed: false, remaining: 0, resetTime: userLimit.resetTime };
    }

    // Increment count and allow
    userLimit.count += 1;
    this.userRateLimits.set(userId, userLimit);
    return { allowed: true, remaining: queryLimit - userLimit.count, resetTime: userLimit.resetTime };
  }

  shouldShowRateLimitMessage(userId: string, isPremiumUser: boolean): boolean {
    // Never show rate limit message for premium users
    if (isPremiumUser) {
      return false;
    }

    // If no message interval configured, always show
    if (!this.config.messageInterval) {
      return true;
    }

    // Show every X queries for non-premium users
    const currentCount = this.userRateLimits.get(userId)?.count || 0;
    const lastMessageCount = this.userLastRateLimitMessage.get(userId) || 0;
    const shouldShow = currentCount - lastMessageCount >= this.config.messageInterval;

    if (shouldShow) {
      this.userLastRateLimitMessage.set(userId, currentCount);
    }

    return shouldShow;
  }

  // Method to decrement count (for error cases)
  decrementCount(userId: string): void {
    const userLimit = this.userRateLimits.get(userId);
    if (userLimit && userLimit.count > 0) {
      userLimit.count -= 1;
      this.userRateLimits.set(userId, userLimit);
    }
  }

  // Method to get current usage info
  getUserUsage(userId: string): { count: number; resetTime: number } | null {
    return this.userRateLimits.get(userId) || null;
  }

  // Method to reset a user's limit (admin function)
  resetUserLimit(userId: string): void {
    this.userRateLimits.delete(userId);
    this.userLastRateLimitMessage.delete(userId);
  }
}

// Utility function to check if user has premium role or is a team member
export function checkPremiumStatus(member: any, roleId: string, teamImmunity: boolean = false): boolean {
  const hasPremiumRole = member?.roles.cache.has(roleId) || false;
  const isTeamMember = teamImmunity ? (member?.roles.cache.has(env.ROLE_TEAMTRIPSIT) || false) : false;

  return hasPremiumRole || isTeamMember;
}

// Utility function to format time until reset
export function formatTimeUntilReset(resetTime: number): string {
  const timeUntilReset = Math.ceil((resetTime - Date.now()) / (1000 * 60 * 60)); // hours
  return `${timeUntilReset} hour${timeUntilReset !== 1 ? 's' : ''}`;
}
