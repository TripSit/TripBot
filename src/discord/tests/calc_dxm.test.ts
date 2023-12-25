import {
  Colors,
} from 'discord.js';
import { stripIndents } from 'common-tags';
import { dCalcDXM } from '../commands/global/d.calcDXM';
import { executeCommandAndSpyEditReply, embedContaining, getParsedCommand } from '../../jest/utils/testutils';

const slashCommand = dCalcDXM;

const authorInfo = {
  iconURL: 'https://i.gyazo.com/b48b08a853fefaafb6393837eec1a501.png',
  name: 'TripSit.Me',
  url: 'http://www.tripsit.me',
};
const footerInfo = {
  iconURL: 'https://i.gyazo.com/19276c297cca0761dc9689ac7c320b8e.png',
  text: 'Dose responsibly!',
};
const title = 'DXM Dosages';

describe(slashCommand.data.name, () => {
  it(slashCommand.data.description, async () => {
    expect(await executeCommandAndSpyEditReply(
      slashCommand,
      getParsedCommand(
        `/${slashCommand.data.name} calc_weight:200 units:kg taking:RoboCough (ml)`,
        slashCommand.data,
        'tripsit',
      ),
    )).toHaveBeenCalledWith({
      embeds: embedContaining({
        author: authorInfo,
        footer: footerInfo,
        color: Colors.Purple,
        title,
        description: stripIndents`For a 200kg individual taking RoboCough (ml)`,
        fields: [
          { name: 'Plateau', value: stripIndents`**First**`, inline: true },
          { name: 'Minimum', value: stripIndents`30 (ml)`, inline: true },
          { name: 'Maximum', value: stripIndents`50 (ml)`, inline: true },
          { name: '\u200B', value: stripIndents`**Second**`, inline: true },
          { name: '\u200B', value: stripIndents`50 (ml)`, inline: true },
          { name: '\u200B', value: stripIndents`150 (ml)`, inline: true },
          { name: '\u200B', value: stripIndents`**Third**`, inline: true },
          { name: '\u200B', value: stripIndents`150 (ml)`, inline: true },
          { name: '\u200B', value: stripIndents`300 (ml)`, inline: true },
          { name: '\u200B', value: stripIndents`**Fourth**`, inline: true },
          { name: '\u200B', value: stripIndents`300 (ml)`, inline: true },
          { name: '\u200B', value: stripIndents`400 (ml)`, inline: true },
        ],
      }),
    });

    expect(await executeCommandAndSpyEditReply(
      slashCommand,
      getParsedCommand(
        `/${slashCommand.data.name} calc_weight:200 units:kg taking:Robitussin DX (oz)`,
        slashCommand.data,
        'tripsit',
      ),
    )).toHaveBeenCalledWith({
      embeds: embedContaining({
        author: authorInfo,
        footer: footerInfo,
        color: Colors.Purple,
        title,
        description: stripIndents`For a 200kg individual taking Robitussin DX (oz)`,
        fields: [
          { name: 'Plateau', value: stripIndents`**First**`, inline: true },
          { name: 'Minimum', value: stripIndents`3.39 (oz)`, inline: true },
          { name: 'Maximum', value: stripIndents`5.65 (oz)`, inline: true },
          { name: '\u200B', value: stripIndents`**Second**`, inline: true },
          { name: '\u200B', value: stripIndents`5.65 (oz)`, inline: true },
          { name: '\u200B', value: stripIndents`16.95 (oz)`, inline: true },
          { name: '\u200B', value: stripIndents`**Third**`, inline: true },
          { name: '\u200B', value: stripIndents`16.95 (oz)`, inline: true },
          { name: '\u200B', value: stripIndents`33.9 (oz)`, inline: true },
          { name: '\u200B', value: stripIndents`**Fourth**`, inline: true },
          { name: '\u200B', value: stripIndents`33.9 (oz)`, inline: true },
          { name: '\u200B', value: stripIndents`45.2 (oz)`, inline: true },
        ],
      }),
    });

    expect(await executeCommandAndSpyEditReply(
      slashCommand,
      getParsedCommand(
        `/${slashCommand.data.name} calc_weight:200 units:kg taking:Robitussin DX (ml)`,
        slashCommand.data,
        'tripsit',
      ),
    )).toHaveBeenCalledWith({
      embeds: embedContaining({
        author: authorInfo,
        footer: footerInfo,
        color: Colors.Purple,
        title,
        description: stripIndents`For a 200kg individual taking Robitussin DX (ml)`,
        fields: [
          { name: 'Plateau', value: stripIndents`**First**`, inline: true },
          { name: 'Minimum', value: stripIndents`100 (ml)`, inline: true },
          { name: 'Maximum', value: stripIndents`166.67 (ml)`, inline: true },
          { name: '\u200B', value: stripIndents`**Second**`, inline: true },
          { name: '\u200B', value: stripIndents`166.67 (ml)`, inline: true },
          { name: '\u200B', value: stripIndents`500 (ml)`, inline: true },
          { name: '\u200B', value: stripIndents`**Third**`, inline: true },
          { name: '\u200B', value: stripIndents`500 (ml)`, inline: true },
          { name: '\u200B', value: stripIndents`1000 (ml)`, inline: true },
          { name: '\u200B', value: stripIndents`**Fourth**`, inline: true },
          { name: '\u200B', value: stripIndents`1000 (ml)`, inline: true },
          { name: '\u200B', value: stripIndents`1333.33 (ml)`, inline: true },
        ],
      }),
    });

    expect(await executeCommandAndSpyEditReply(
      slashCommand,
      getParsedCommand(
        `/${slashCommand.data.name} calc_weight:200 units:kg taking:Robitussin Gelcaps (15 mg caps)`,
        slashCommand.data,
        'tripsit',
      ),
    )).toHaveBeenCalledWith({
      embeds: embedContaining({
        author: authorInfo,
        footer: footerInfo,
        color: Colors.Purple,
        title,
        description: stripIndents`For a 200kg individual taking Robitussin Gelcaps (15 mg caps)`,
        fields: [
          { name: 'Plateau', value: stripIndents`**First**`, inline: true },
          { name: 'Minimum', value: stripIndents`20 (15 mg caps)`, inline: true },
          { name: 'Maximum', value: stripIndents`33.33 (15 mg caps)`, inline: true },
          { name: '\u200B', value: stripIndents`**Second**`, inline: true },
          { name: '\u200B', value: stripIndents`33.33 (15 mg caps)`, inline: true },
          { name: '\u200B', value: stripIndents`100 (15 mg caps)`, inline: true },
          { name: '\u200B', value: stripIndents`**Third**`, inline: true },
          { name: '\u200B', value: stripIndents`100 (15 mg caps)`, inline: true },
          { name: '\u200B', value: stripIndents`200 (15 mg caps)`, inline: true },
          { name: '\u200B', value: stripIndents`**Fourth**`, inline: true },
          { name: '\u200B', value: stripIndents`200 (15 mg caps)`, inline: true },
          { name: '\u200B', value: stripIndents`266.67 (15 mg caps)`, inline: true },
        ],
      }),
    });

    expect(await executeCommandAndSpyEditReply(
      slashCommand,
      getParsedCommand(
        `/${slashCommand.data.name} calc_weight:200 units:kg taking:Pure (mg)`,
        slashCommand.data,
        'tripsit',
      ),
    )).toHaveBeenCalledWith({
      embeds: embedContaining({
        author: authorInfo,
        footer: footerInfo,
        color: Colors.Purple,
        title,
        description: stripIndents`For a 200kg individual taking Pure (mg)`,
        fields: [
          { name: 'Plateau', value: stripIndents`**First**`, inline: true },
          { name: 'Minimum', value: stripIndents`300 (mg)`, inline: true },
          { name: 'Maximum', value: stripIndents`500 (mg)`, inline: true },
          { name: '\u200B', value: stripIndents`**Second**`, inline: true },
          { name: '\u200B', value: stripIndents`500 (mg)`, inline: true },
          { name: '\u200B', value: stripIndents`1500 (mg)`, inline: true },
          { name: '\u200B', value: stripIndents`**Third**`, inline: true },
          { name: '\u200B', value: stripIndents`1500 (mg)`, inline: true },
          { name: '\u200B', value: stripIndents`3000 (mg)`, inline: true },
          { name: '\u200B', value: stripIndents`**Fourth**`, inline: true },
          { name: '\u200B', value: stripIndents`3000 (mg)`, inline: true },
          { name: '\u200B', value: stripIndents`4000 (mg)`, inline: true },
        ],
      }),
    });

    expect(await executeCommandAndSpyEditReply(
      slashCommand,
      getParsedCommand(
        `/${slashCommand.data.name} calc_weight:200 units:kg taking:30mg Gelcaps (30 mg caps)`,
        slashCommand.data,
        'tripsit',
      ),
    )).toHaveBeenCalledWith({
      embeds: embedContaining({
        author: authorInfo,
        footer: footerInfo,
        color: Colors.Purple,
        title,
        description: stripIndents`For a 200kg individual taking 30mg Gelcaps (30 mg caps)`,
        fields: [
          { name: 'Plateau', value: stripIndents`**First**`, inline: true },
          { name: 'Minimum', value: stripIndents`10 (30 mg caps)`, inline: true },
          { name: 'Maximum', value: stripIndents`16.67 (30 mg caps)`, inline: true },
          { name: '\u200B', value: stripIndents`**Second**`, inline: true },
          { name: '\u200B', value: stripIndents`16.67 (30 mg caps)`, inline: true },
          { name: '\u200B', value: stripIndents`50 (30 mg caps)`, inline: true },
          { name: '\u200B', value: stripIndents`**Third**`, inline: true },
          { name: '\u200B', value: stripIndents`50 (30 mg caps)`, inline: true },
          { name: '\u200B', value: stripIndents`100 (30 mg caps)`, inline: true },
          { name: '\u200B', value: stripIndents`**Fourth**`, inline: true },
          { name: '\u200B', value: stripIndents`100 (30 mg caps)`, inline: true },
          { name: '\u200B', value: stripIndents`133.33 (30 mg caps)`, inline: true },
        ],
      }),
    });

    expect(await executeCommandAndSpyEditReply(
      slashCommand,
      getParsedCommand(
        `/${slashCommand.data.name} calc_weight:200 units:kg taking:RoboTablets (30 mg tablets)`,
        slashCommand.data,
        'tripsit',
      ),
    )).toHaveBeenCalledWith({
      embeds: embedContaining({
        author: authorInfo,
        footer: footerInfo,
        color: Colors.Purple,
        title,
        description: stripIndents`For a 200kg individual taking RoboTablets (30 mg tablets)`,
        fields: [
          { name: 'Plateau', value: stripIndents`**First**`, inline: true },
          { name: 'Minimum', value: stripIndents`7.33 (30 mg tablets)`, inline: true },
          { name: 'Maximum', value: stripIndents`12.22 (30 mg tablets)`, inline: true },
          { name: '\u200B', value: stripIndents`**Second**`, inline: true },
          { name: '\u200B', value: stripIndents`12.22 (30 mg tablets)`, inline: true },
          { name: '\u200B', value: stripIndents`36.65 (30 mg tablets)`, inline: true },
          { name: '\u200B', value: stripIndents`**Third**`, inline: true },
          { name: '\u200B', value: stripIndents`36.65 (30 mg tablets)`, inline: true },
          { name: '\u200B', value: stripIndents`73.29 (30 mg tablets)`, inline: true },
          { name: '\u200B', value: stripIndents`**Fourth**`, inline: true },
          { name: '\u200B', value: stripIndents`73.29 (30 mg tablets)`, inline: true },
          { name: '\u200B', value: stripIndents`97.72 (30 mg tablets)`, inline: true },
        ],
      }),
    });

    expect(await executeCommandAndSpyEditReply(
      slashCommand,
      getParsedCommand(
        `/${slashCommand.data.name} calc_weight:200 units:lbs taking:RoboTablets (30 mg tablets)`,
        slashCommand.data,
        'tripsit',
      ),
    )).toHaveBeenCalledWith({
      embeds: embedContaining({
        author: authorInfo,
        footer: footerInfo,
        color: Colors.Purple,
        title,
        description: stripIndents`For a 200lbs individual taking RoboTablets (30 mg tablets)`,
        fields: [
          { name: 'Plateau', value: stripIndents`**First**`, inline: true },
          { name: 'Minimum', value: stripIndents`3.32 (30 mg tablets)`, inline: true },
          { name: 'Maximum', value: stripIndents`5.54 (30 mg tablets)`, inline: true },
          { name: '\u200B', value: stripIndents`**Second**`, inline: true },
          { name: '\u200B', value: stripIndents`5.54 (30 mg tablets)`, inline: true },
          { name: '\u200B', value: stripIndents`16.62 (30 mg tablets)`, inline: true },
          { name: '\u200B', value: stripIndents`**Third**`, inline: true },
          { name: '\u200B', value: stripIndents`16.62 (30 mg tablets)`, inline: true },
          { name: '\u200B', value: stripIndents`33.24 (30 mg tablets)`, inline: true },
          { name: '\u200B', value: stripIndents`**Fourth**`, inline: true },
          { name: '\u200B', value: stripIndents`33.24 (30 mg tablets)`, inline: true },
          { name: '\u200B', value: stripIndents`44.33 (30 mg tablets)`, inline: true },
        ],
      }),
    });
  });
});
