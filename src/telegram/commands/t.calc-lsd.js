'use strict';

const { Composer } = require('telegraf');
const { stripIndents } = require('common-tags');
const calcPsychedelics = require('../../global/utils/calc-psychedelics');

module.exports = Composer.command('calclsd', async ctx => {
  const splitCommand = ctx.update.message.text.split(' ');

  const lastDose = splitCommand[1];
  const days = splitCommand[2];
  const desiredDose = splitCommand[3];

  if (
    lastDose
    && days
    && desiredDose
    && Number.isInteger(Number(lastDose))
    && Number.isInteger(Number(days))
    && Number.isInteger(Number(desiredDose))) {
    const result = await calcPsychedelics.calc(lastDose, desiredDose, days);
    ctx.replyWithHTML(stripIndents`<b>🌈 ${result} ug of LSD is needed to feel the same effects as of ${desiredDose} ug of LSD. 🌈</b>

    Please note that this calculator only works for tryptamines like LSD and Magic Mushrooms, do not use this calculator for a chemcial that isn't a tryptamine.

    This calculator is only able to provide an estimate. Please do not be deceived by the apparent precision of the numbers.

    Further, this calculator also assumes that you know exactly how much LSD and Shrooms you have consumed, due to the variable nature of street LSD and Shrooms, this calculator is likely to be less successful when measuring tolerance between doses from different batches/chemists and harvests.

    `);
  } else {
    ctx.replyWithMarkdown(stripIndents`❌ **Task failed successfully!** ❌
    Wrong command usage.
    /calc-mushrooms <lastDose:int> <desiredDose:int> <days:int>
    lastDose is the last dose in g you took, days is the amount of time in days since you dosed the last time, desiredDose is the dose of mushrooms you want to take. Please fill in only integers (whole numbers, like 1, 2, 3 but not 1,5, 2.412, b ).`);
  }
});
