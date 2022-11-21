import { Colors } from 'discord.js';
import { parse } from 'path';
import { dcalcPsychedelics } from '../../discord/commands/global/d.calcPsychedelics';
import { executeCommandAndSpyReply, embedContaining, getParsedCommand } from '../utils/testutils';
import log from '../../global/utils/log'; // eslint-disable-line

const PREFIX = parse(__filename).name; // eslint-disable-line

describe('Calc Psychedelics', () => {
  it('Detemines dosages ', async () => {
    const commandData = dcalcPsychedelics.data;
    const stringCommand = '/calc_psychedelics lsd last_dose:100 days:3 desired_dose:300';
    const command = getParsedCommand(stringCommand, commandData);
    // log.debug(`[${PREFIX}] command: ${JSON.stringify(command, null, 2)}`);
    const spy = await executeCommandAndSpyReply(dcalcPsychedelics, command);
    expect(spy).toHaveBeenCalledWith(embedContaining({
      color: Colors.DarkBlue,
      title: 'About TripBot',
      url: 'https://tripsit.me/about/',
      description: 'test',
    }));
  });
});
