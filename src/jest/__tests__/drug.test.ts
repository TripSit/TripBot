import {
  Colors,
} from 'discord.js';
import { parse } from 'path';
import { stripIndents } from 'common-tags';
import { dDrug } from '../../discord/commands/global/d.drug';
import { executeCommandAndSpyReply, embedContaining, getParsedCommand } from '../utils/testutils';
import log from '../../global/utils/log'; // eslint-disable-line

const PREFIX = parse(__filename).name; // eslint-disable-line

const slashCommand = dDrug;

describe(slashCommand.data.name, () => {
  it(slashCommand.data.description, async () => {
    const commandData = slashCommand.data;
    const stringCommand = `/${commandData.name} substance:Cannabis`;
    const command = getParsedCommand(stringCommand, commandData);
    // log.debug(`[${PREFIX}] command: ${JSON.stringify(command, null, 2)}`);
    const spy = await executeCommandAndSpyReply(slashCommand, command);
    expect(spy).toHaveBeenCalledWith(embedContaining({
      color: Colors.Purple,
      author: {
        iconURL: 'https://fossdroid.com/images/icons/me.tripsit.tripmobile.13.png',
        name: 'TripSit.Me',
        url: 'http://www.tripsit.me',
      },
      footer: {
        iconURL: 'https://imgur.com/b923xK2.png',
        text: 'Dose responsibly!',
      },
      title: '🌐 Cannabis Information',
      url: 'https://wiki.tripsit.me/wiki/Cannabis',
      description: stripIndents`A common and widely used psychoactive plant, which is beginning to enjoy legal status for medical and even recreational use in some parts of the world. Usually smoked or eaten, primary effects are relaxation and an affinity towards food - a state described as being 'stoned.'`, // eslint-disable-line
      fields: [
        {
          name: 'Aliases',
          value: stripIndents`Aliases: bud, dagga, grass, green, hash, herb, marijuana, mary jane, pot, thc, tree, weed`, // eslint-disable-line
          inline: false,
        },
        {
          name: 'ℹ Class',
          value: stripIndents`**Chemical**: Cannabinoid`,
          inline: true,
        },
        {
          name: '🔀 Cross Tolerances',
          value: stripIndents`Cannabinoids`,
          inline: true,
        },
        {
          name: '💔 Addiction Potential',
          value: stripIndents`Moderately habit-forming`,
          inline: true,
        },
        {
          name: '💊 Dosage (Smoked)',
          value: stripIndents`
          Threshold: 25 mg
          Light: 33 - 66 mg
          Common: 66 - 100 mg
          Strong: 100 - 150 mg
          Heavy: 150 mg +`,
          inline: true,
        },
        {
          name: '💊 Dosage (Oral)',
          value: stripIndents`
          Threshold: 1 mg (THC)
          Light: 2.5 - 5 mg (THC)
          Common: 5 - 10 mg (THC)
          Strong: 10 - 25 mg (THC)
          Heavy: 25 mg + (THC)`,
          inline: true,
        },
        {
          name: '↗ Tolerance',
          value: stripIndents`
          Full: Develops with prolonged and repeated use
          Half: 1 - 2 weeks
          Zero: 2 - 3 weeks`,
          inline: true,
        },
        {
          name: '⏳ Duration (Smoked)',
          value: stripIndents`
          Total: 1 - 4 hours
          Onset: 0 - 10 minutes
          Come up: 5 - 10 minutes
          Peak: 15 - 30 minutes
          After effects: 45 - 180 minutes`,
          inline: true,
        },
        {
          name: '⏳ Duration (Oral)',
          value: stripIndents`
          Total: 4 - 10 hours
          Onset: 20 - 120 minutes
          Come up: 20 - 40 minutes
          Peak: 2 - 5 hours
          After effects: 6 - 12 hours`,
          inline: true,
        },
        {
          name: '\u200B',
          value: stripIndents`\u200B`,
          inline: true,
        },
        {
          name: 'Links',
          value: stripIndents`[Erowid](https://www.erowid.org/experiences/subs/exp_Cannabis.shtml)`,
          inline: false,
        },
      ],
    }));
  });
});
