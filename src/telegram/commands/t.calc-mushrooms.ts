import { stripIndents } from 'common-tags';
import { Composer } from 'telegraf';
import { calcPsychedelics } from '../../global/commands/g.calcPsychedelics';

export default Composer.command('calcmushrooms', async ctx => {
  const splitCommand = ctx.update.message.text.split(' ');

  const lastDose = splitCommand[1];
  // Check if lastDose is a number and if not, return that you must use a number
  if (!Number.isInteger(Number(lastDose))) {
    ctx.reply('Please use a number for the last dose.');
    return;
  }

  const days = splitCommand[2];
  // Check if days is a number and if not, return that you must use a number
  if (!Number.isInteger(Number(days))) {
    ctx.reply('Please use a number for the days.');
    return;
  }

  const desiredDose = splitCommand[3];
  // Check if desiredDose is a number and if not, return that you must use a number
  if (!Number.isInteger(Number(desiredDose))) {
    ctx.reply('Please use a number for the desired dose.');
    return;
  }

  if (lastDose
    && days
    && desiredDose
    && Number.isInteger(Number(lastDose))
    && Number.isInteger(Number(days))
    && Number.isInteger(Number(desiredDose))) {
    const result = await calcPsychedelics(parseInt(lastDose, 10), parseInt(desiredDose, 10), parseInt(days, 10));
    ctx.replyWithHTML(stripIndents`<b>🍄 ${result} g of Mushrooms is needed to feel the same effects as of ${desiredDose} g of Mushrooms. 🍄</b>

    Please note that this calculator only works for tryptamines like LSD and Magic Mushrooms, do not use this calculator for a chemcial that isn't a tryptamine.

    This calculator is only able to provide an estimate. Please do not be deceived by the apparent precision of the numbers.

    Further, this calculator also assumes that you know exactly how much LSD and Shrooms you have consumed, due to the variable nature of street LSD and Shrooms,this calculator is likely to be less successful when measuring tolerance between doses from different batches/chemists and harvests.

    `);
  } else {
    ctx.replyWithMarkdownV2(stripIndents`❌ **Task failed successfully!** ❌
    Wrong command usage.\n/calc-mushrooms <lastDose:int> <desiredDose:int> <days:int>
    lastDose is the last dose in g you took, days is the amount of time in days since you dosed the last time, desiredDose is the dose of mushrooms you want to take. Please fill in only integers (whole numbers, like 1, 2, 3 but not 1,5, 2.412, b ).`);
  }
});
