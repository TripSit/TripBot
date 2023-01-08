import {
  Colors, InteractionResponse,
} from 'discord.js';
import { stripIndents } from 'common-tags';
import { dCalcbenzo } from '../../src/discord/commands/global/d.calcBenzo';
import { executeCommandAndSpyReply, embedContaining, getParsedCommand } from '../utils/testutils';

const slashCommand = dCalcbenzo;

describe(slashCommand.data.name, () => {
  it(slashCommand.data.description, async () => {
    const commandData = slashCommand.data;

    let spy = {} as jest.SpyInstance<Promise<InteractionResponse<boolean>> | InteractionResponse<boolean>>;
    let stringCommand = '' as string;

    const benzosNames = [
      { name: 'alprazolam', result: 31.45 },
      { name: 'bromazepam', result: 3.15 },
      { name: 'brotizolam', result: 78.63 },
      { name: 'clobazam', result: 0.79 },
      { name: 'clonazepam', result: 31.45 },
      { name: 'clorazepate', result: 1.05 },
      { name: 'diazepam', result: 1.57 },
      { name: 'diclazepam', result: 15.73 },
      { name: 'estazolam', result: 15.73 },
      { name: 'etizolam', result: 15.73 },
      { name: 'flubromazepam', result: 2.62 },
      { name: 'flubromazolam', result: 78.63 },
      { name: 'flunitrazepam', result: 15.73 },
      { name: 'flurazepam', result: 1.05 },
      { name: 'flutoprazepam', result: 6.29 },
      { name: 'halazepam', result: 0.79 },
      { name: 'ketazolam', result: 1.05 },
      { name: 'librium', result: 0.63 },
      { name: 'loprazolam', result: 15.73 },
      { name: 'lorazepam', result: 15.73 },
      { name: 'lormetazepam', result: 15.73 },
      { name: 'medazepam', result: 1.57 },
      { name: 'midazolam', result: 1.57 },
      { name: 'nitrazepam', result: 1.57 },
      { name: 'nordazepam', result: 1.57 },
      { name: 'oxazepam', result: 0.79 },
      { name: 'phenazepam', result: 15.73 },
      { name: 'prazepam', result: 1.05 },
      { name: 'pyrazolam', result: 15.73 },
      { name: 'quazepam', result: 0.79 },
      { name: 'temazepam', result: 0.79 },
      { name: 'triazolam', result: 31.45 },
    ];

    // for (const benzo of benzosNames) { // eslint-disable-line
    benzosNames.forEach(async benzo => {
      stringCommand = `/${commandData.name} i_have:31.45 mg_of:${benzo.name} and_i_want_the_dose_of:alprazolam`;
      spy = await executeCommandAndSpyReply(slashCommand, getParsedCommand(stringCommand, commandData)); // eslint-disable-line
      expect(spy).toHaveBeenCalledWith({
        embeds: embedContaining({
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
          title: `31.45 mg of ${benzo.name} about equal to ${benzo.result} mg of alprazolam`,
          description: stripIndents`**Please make sure to research the substances thoroughly before using them.**
        It's a good idea to start with a lower dose than the calculator shows, since everybody can react differently to different substances.`, // eslint-disable-line
        }),
      });
    });

    // Misspell drugA
    stringCommand = `/${commandData.name} i_have:12.3 mg_of:bromazepams and_i_want_the_dose_of:clobazam`;
    spy = await executeCommandAndSpyReply(slashCommand, getParsedCommand(stringCommand, commandData));
    expect(spy).toHaveBeenCalledWith({
      content: stripIndents`There was an error during conversion!
      I've let the developer know, please try again with different parameters!`,
      ephemeral: true,
    });

    // Misspell drugB
    stringCommand = `/${commandData.name} i_have:12.3 mg_of:bromazepam and_i_want_the_dose_of:clobazams`;
    spy = await executeCommandAndSpyReply(slashCommand, getParsedCommand(stringCommand, commandData));
    expect(spy).toHaveBeenCalledWith({
      content: stripIndents`There was an error during conversion!
      I've let the developer know, please try again with different parameters!`,
      ephemeral: true,
    });

    // Get wrong kind of drugA
    stringCommand = `/${commandData.name} i_have:12.3 mg_of:cannabis and_i_want_the_dose_of:clobazam`;
    spy = await executeCommandAndSpyReply(slashCommand, getParsedCommand(stringCommand, commandData));
    expect(spy).toHaveBeenCalledWith({
      content: stripIndents`There was an error during conversion!
          I've let the developer know, please try again with different parameters!`,
      ephemeral: true,
    });

    // Get wrong kind of drugB
    stringCommand = `/${commandData.name} i_have:12.3 mg_of:bromazepam and_i_want_the_dose_of:cannabis`;
    spy = await executeCommandAndSpyReply(slashCommand, getParsedCommand(stringCommand, commandData));
    expect(spy).toHaveBeenCalledWith({
      content: stripIndents`There was an error during conversion!
              I've let the developer know, please try again with different parameters!`,
      ephemeral: true,
    });
  });
});
