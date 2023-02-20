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
    expect(await executeCommandAndSpyReply(
      slashCommand,
      getParsedCommand(
        `/${slashCommand.data.name} weight:130.4 units:kg`,
        slashCommand.data,
        'tripsit',
      ),
    )).toHaveBeenCalledWith({
      embeds: embedContaining({
        author: authorInfo,
        footer: footerInfo,
        color: Colors.Purple,
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

    expect(await executeCommandAndSpyReply(
      slashCommand,
      getParsedCommand(
        `/${slashCommand.data.name} weight:130.4 units:lbs`,
        slashCommand.data,
        'tripsit',
      ),
    )).toHaveBeenCalledWith({
      embeds: embedContaining({
        author: authorInfo,
        footer: footerInfo,
        color: Colors.Purple,
        fields: [
          {
            name: 'Insufflated',
            value: stripIndents`
            **Threshold**: 13mg
            **Light**: 20mg
            **Common**: 39mg
            **Strong**: 65mg-98mg
            **KHole**: 130mg`,
            inline: true,
          },
          {
            name: 'Rectal',
            value: stripIndents`
            **Threshold**: 39mg
            **Light**: 65mg
            **Common**: 98mg-261mg
            **Strong**: 261mg-326mg
            **KHole**: 391mg-522mg`,
            inline: true,
          },
        ],
      }),
    });

    expect(await executeCommandAndSpyReply(
      slashCommand,
      getParsedCommand(
        `/${slashCommand.data.name} weight:180 units:kg`,
        slashCommand.data,
        'tripsit',
      ),
    )).toHaveBeenCalledWith({
      embeds: embedContaining({
        author: authorInfo,
        footer: footerInfo,
        color: Colors.Purple,
        title: 'Please enter a weight less than 179 kg.',
      }),
      ephemeral: true,
    });

    expect(await executeCommandAndSpyReply(
      slashCommand,
      getParsedCommand(
        `/${slashCommand.data.name} weight:400 units:lbs`,
        slashCommand.data,
        'tripsit',
      ),
    )).toHaveBeenCalledWith({
      embeds: embedContaining({
        author: authorInfo,
        footer: footerInfo,
        color: Colors.Purple,
        title: 'Please enter a weight less than 398 lbs.',
      }),
      ephemeral: true,
    });
  });
});
