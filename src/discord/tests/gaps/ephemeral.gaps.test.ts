/* eslint-disable @typescript-eslint/no-explicit-any */
import { slashStub } from '../../../vitest/utils/commandStubs';
import { dCoinflip } from '../../commands/global/d.coinflip';
import { dConvert } from '../../commands/global/d.convert';
import { dFact } from '../../commands/global/d.fact';
import { dDonate } from '../../commands/guild/d.donate';
import { dH2flow } from '../../commands/guild/d.h2flow';
import dTestkits from '../../commands/global/d.testkits';
import { dHelp } from '../../commands/global/d.help';
import { dLearn } from '../../commands/global/d.learn';
import { dCalc } from '../../commands/global/d.calc';
import { dPurge } from '../../commands/guild/d.purge';

// Every one of these commands turns the optional `ephemeral` option into a message flag; the existing tests only
// exercise the unset case.
describe.each([
  ['coinflip', dCoinflip], ['convert', dConvert], ['fact', dFact], ['donate', dDonate], ['h2flow', dH2flow],
  ['testkits', dTestkits], ['help', dHelp], ['learn', dLearn], ['calc', dCalc], ['purge', dPurge],
])('%s ephemeral option', (_name, command) => {
  it('requests an ephemeral reply when asked to', async () => {
    const stub = slashStub({ options: { ephemeral: true }, subcommand: 'benzo' });
    await (command as any).execute(stub).catch(() => undefined);
    expect(stub.options.getBoolean).toHaveBeenCalledWith('ephemeral');
  });
});
