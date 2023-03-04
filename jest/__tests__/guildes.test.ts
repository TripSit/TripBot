/* eslint-disable max-len */

import {
  Colors,
} from 'discord.js';
import { stripIndents } from 'common-tags';
import { dGuides } from '../../src/discord/commands/global/d.guides';
import { executeCommandAndSpyEditReply, embedContaining, getParsedCommand } from '../utils/testutils';

const slashCommand = dGuides;

const authorInfo = {
  iconURL: 'https://i.gyazo.com/b48b08a853fefaafb6393837eec1a501.png',
  name: 'TripSit.Me',
  url: 'http://www.tripsit.me',
};
const footerInfo = {
  iconURL: 'https://i.gyazo.com/19276c297cca0761dc9689ac7c320b8e.png',
  text: 'Dose responsibly!',
};

describe(slashCommand.data.name, () => {
  it(slashCommand.data.description, async () => {
    expect(await executeCommandAndSpyEditReply(
      slashCommand,
      getParsedCommand(
        `/${slashCommand.data.name}`,
        slashCommand.data,
        'tripsit',
      ),
    )).toHaveBeenCalledWith({
      embeds: embedContaining({
        author: authorInfo,
        footer: footerInfo,
        color: Colors.Purple,
        title: 'Wiki Guides',
        description: stripIndents`These are the guides currently available on our [Wiki](https://wiki.tripsit.me)
        
        [Addiction](https://wiki.tripsit.me/wiki/Addiction)
        [Cannabinoid Eliquid](https://wiki.tripsit.me/wiki/Cannabinoid_Eliquid)
        [Cold Water Extraction](https://wiki.tripsit.me/wiki/Cold_Water_Extraction)
        [Common Misconceptions About Psychedelics](https://wiki.tripsit.me/wiki/Common_Misconceptions_About_Psychedelics)
        [Drug combinations](https://wiki.tripsit.me/wiki/Drug_combinations)
        [Guide to Withdrawals](https://wiki.tripsit.me/wiki/Guide_to_Withdrawals)
        [Guides](https://wiki.tripsit.me/wiki/Guides)
        [Hallucinogens](https://wiki.tripsit.me/wiki/Hallucinogens)
        [How To Deal With A Bad Trip](https://wiki.tripsit.me/wiki/How_To_Deal_With_A_Bad_Trip)
        [How To Tripsit In Real Life](https://wiki.tripsit.me/wiki/How_To_Tripsit_In_Real_Life)
        [How To Tripsit Online](https://wiki.tripsit.me/wiki/How_To_Tripsit_Online)
        [HPPD](https://wiki.tripsit.me/wiki/HPPD)
        [Overdose](https://wiki.tripsit.me/wiki/Overdose)
        [Professional Help Resources](https://wiki.tripsit.me/wiki/Professional_Help_Resources)
        [Quick Guide to Plugging](https://wiki.tripsit.me/wiki/Quick_Guide_to_Plugging)
        [Quick Guide to Stimulant Comedowns](https://wiki.tripsit.me/wiki/Quick_Guide_to_Stimulant_Comedowns)
        [Quick Guide to Volumetric Dosing](https://wiki.tripsit.me/wiki/Quick_Guide_to_Volumetric_Dosing)
        [Reducing Pain Caused by Insufflation](https://wiki.tripsit.me/wiki/Reducing_Pain_Caused_by_Insufflation)
        [Scales](https://wiki.tripsit.me/wiki/Scales)
        [Sources for Laboratory Analysis](https://wiki.tripsit.me/wiki/Sources_for_Laboratory_Analysis)
        [Storage](https://wiki.tripsit.me/wiki/Storage)
        [Test Kits](https://wiki.tripsit.me/wiki/Test_Kits)
        [Zim's Clarified ATB Hybrid Salt Tek](https://wiki.tripsit.me/wiki/Zim's_Clarified_ATB_Hybrid_Salt_Tek)
        
        You're welcome to contribute. :heart:`,
      }),
    });
  });
});
