import {
  Colors,
} from 'discord.js';
import { stripIndents } from 'common-tags';
import { dCalcketamine } from '../../src/discord/commands/global/d.calcKetamine';
import { executeCommandAndSpyReply, embedContaining, getParsedCommand } from '../utils/testutils';

const slashCommand = dCalcketamine;

const authorInfo = {
  iconURL: 'https://fossdroid.com/images/icons/me.tripsit.tripmobile.13.png',
  name: 'TripSit.Me',
  url: 'http://www.tripsit.me',
};

const footerInfo = {
  iconURL: 'https://imgur.com/b923xK2.png',
  text: 'Dose responsibly!',
};

describe(slashCommand.data.name, () => {
  it(slashCommand.data.description, async () => {
    const commandData = slashCommand.data;
    const stringCommand = `/${commandData.name} weight:130.4 units:kg`;
    const command = getParsedCommand(stringCommand, commandData);
    // log.debug(`[${PREFIX}] command: ${JSON.stringify(command, null, 2)}`);
    const spy = await executeCommandAndSpyReply(slashCommand, command);
    expect(spy).toHaveBeenCalledWith({
      embeds: embedContaining({
        color: Colors.Purple,
        author: authorInfo,
        footer: footerInfo,
        fields: [
          {
            name: 'Insufflated',
            value: stripIndents`
            **Threshold**: 29mg
            **Light**: 43mg
            **Common**: 86mg
            **Strong**: 144mg-216mg
            **KHole**: 287mg`,
            inline: true,
          },
          {
            name: 'Rectal',
            value: stripIndents`
            **Threshold**: 86mg
            **Light**: 144mg
            **Common**: 216mg-575mg
            **Strong**: 575mg-719mg
            **KHole**: 862mg-1150mg`,
            inline: true,
          },
        ],
      }),
    });

    const stringCommandLbs = `/${commandData.name} weight:123.45 units:lbs`;
    const commandLbs = getParsedCommand(stringCommandLbs, commandData);
    // log.debug(`[${PREFIX}] command: ${JSON.stringify(command, null, 2)}`);
    const spyLbs = await executeCommandAndSpyReply(slashCommand, commandLbs);
    expect(spyLbs).toHaveBeenCalledWith({
      embeds: embedContaining({
        color: Colors.Purple,
        author: authorInfo,
        footer: footerInfo,
        fields: [
          {
            name: 'Insufflated',
            value: stripIndents`
            **Threshold**: 12mg
            **Light**: 19mg
            **Common**: 37mg
            **Strong**: 62mg-93mg
            **KHole**: 123mg`,
            inline: true,
          },
          {
            name: 'Rectal',
            value: stripIndents`
            **Threshold**: 37mg
            **Light**: 62mg
            **Common**: 93mg-247mg
            **Strong**: 247mg-309mg
            **KHole**: 370mg-494mg`,
            inline: true,
          },
        ],
      }),
    });

    const stringCommandOverweightKg = `/${commandData.name} calc_weight:180 units:kg`;
    const commandOverweightKg = getParsedCommand(stringCommandOverweightKg, commandData);
    // log.debug(`[${PREFIX}] command: ${JSON.stringify(command, null, 2)}`);
    const spyOverweightKg = await executeCommandAndSpyReply(slashCommand, commandOverweightKg);
    expect(spyOverweightKg).toHaveBeenCalledWith({
      embeds: embedContaining({
        color: Colors.Purple,
        author: authorInfo,
        footer: footerInfo,
        title: 'Please enter a weight less than 179 kg.',
      }),
      ephemeral: true,
    });

    const stringCommandOverweightLbs = `/${commandData.name} calc_weight:400 units:lbs`;
    const commandOverweightLbs = getParsedCommand(stringCommandOverweightLbs, commandData);
    // log.debug(`[${PREFIX}] command: ${JSON.stringify(command, null, 2)}`);
    const spyOverweightLbs = await executeCommandAndSpyReply(slashCommand, commandOverweightLbs);
    expect(spyOverweightLbs).toHaveBeenCalledWith({
      embeds: embedContaining({
        color: Colors.Purple,
        author: authorInfo,
        footer: footerInfo,
        title: 'Please enter a weight less than 398 lbs.',
      }),
      ephemeral: true,
    });
  });
});
