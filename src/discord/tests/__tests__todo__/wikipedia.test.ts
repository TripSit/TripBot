import { Colors } from 'discord.js';
import { stripIndents } from 'common-tags';
import { dWikipedia } from '../../../src/discord/commands/global/d.wikipedia';
import { executeCommandAndSpyEditReply, embedContaining, getParsedCommand } from '../../utils/testutils';
import log from '../../../src/global/utils/log'; // eslint-disable-line

const slashCommand = dWikipedia;

describe(slashCommand.data.name, () => {
  it(slashCommand.data.description, async () => {
    const commandData = slashCommand.data;

    const stringCommand1 = `/${commandData.name} query:T`;
    const command1 = getParsedCommand(stringCommand1, commandData, 'tripsit');

    const stringCommand2 = `/${commandData.name} query:thisissomenonsense`;
    const command2 = getParsedCommand(stringCommand2, commandData, 'tripsit');

    const spy1 = await executeCommandAndSpyEditReply(slashCommand, command1);

    expect(spy1).toHaveBeenCalledWith(embedContaining({
      color: Colors.Purple,
      author: {
        iconURL: 'https://i.gyazo.com/b48b08a853fefaafb6393837eec1a501.png',
        name: 'TripSit.Me',
        url: 'http://www.tripsit.me',
      },
      footer: {
        iconURL: 'https://i.gyazo.com/19276c297cca0761dc9689ac7c320b8e.png',
        text: 'Dose responsibly!',
      },
      title: 'Definition for T',
      description: stripIndents`T, or t, is the twentieth letter in the Latin alphabet, used in the modern English alphabet, the alphabets of other western European languages and others worldwide. Its name in English is tee, plural tees. It is derived from the Semitic Taw 𐤕 of the Phoenician and Paleo-Hebrew script via the Greek letter τ (tau). In English, it is most commonly used to represent the voiceless alveolar plosive, a sound it also denotes in the International Phonetic Alphabet. It is the most commonly used consonant and the second most commonly used letter in English-language texts.`, // eslint-disable-line
    }));

    const spy2 = await executeCommandAndSpyEditReply(slashCommand, command2);

    expect(spy2).toHaveBeenCalledWith(embedContaining({
      color: Colors.Purple,
      author: {
        iconURL: 'https://i.gyazo.com/b48b08a853fefaafb6393837eec1a501.png',
        name: 'TripSit.Me',
        url: 'http://www.tripsit.me',
      },
      footer: {
        iconURL: 'https://i.gyazo.com/19276c297cca0761dc9689ac7c320b8e.png',
        text: 'Dose responsibly!',
      },
      title: 'Definition for thisissomenonsense',
      description:
        stripIndents`An error occured while trying to fetch the definition for thisissomenonsense from wikipedia.`,
    }));
  });
});
