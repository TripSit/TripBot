import { Composer } from 'telegraf';
import { about } from '../../global/commands/g.about';

const F = f(__filename);

export default Composer.command('about', async ctx => {
  const tripsitInfo = await about();

  // It says "This bot is built using the discord.js library"
  ctx.replyWithMarkdownV2(`
    **ℹ️ Information about TripSit ℹ️**\n\n**⚖️ Disclaimer ⚖️**\n${tripsitInfo.disclaimer}\n\n**❤️ Support TripSit ❤️**\n${tripsitInfo.support}\n\n**💬 Feedback 💬**\n${tripsitInfo.feedback}\n\n**©️ Credits ©️**\n${tripsitInfo.credits}
    `);
  log.debug(F, 'finished!');
});
