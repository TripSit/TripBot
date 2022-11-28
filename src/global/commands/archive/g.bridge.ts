/**
 * Does something
 * @return {any} Something
 */
export async function bridgeWording():Promise<string> {
  return `
  Channels with a 🔗 are 'linked' with our IRC, so messages sent in in Discord are also sent to IRC, and vis versa.
  The "bot" tag is used to identify messages from the bridge, not robots! TS is used on IRC to identify bridge messages.
  Please note that users on IRC can't see replies or custom emojis from Discord!
  `;
}
