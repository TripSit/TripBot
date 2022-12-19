import { dWikipedia } from '../../src/discord/commands/global/d.wikipedia';
import { executeCommandAndSpyReply, embedContaining, getParsedCommand } from '../utils/testutils';
import log from '../../src/global/utils/log'; // eslint-disable-line
import { Colors } from 'discord.js';
import { stripIndents } from 'common-tags';

const slashCommand = dWikipedia;

describe(slashCommand.data.name, () => {
  it(slashCommand.data.description, async () => {
    const commandData = slashCommand.data;

    const stringCommand1 = `/${commandData.name} query:T`;
    const command1 = getParsedCommand(stringCommand1, commandData);

    const stringCommand2 = `/${commandData.name} query:thisissomenonsense`;
    const command2 = getParsedCommand(stringCommand2, commandData);

    const spy1 = await executeCommandAndSpyReply(slashCommand, command1);

    expect(spy1).toHaveBeenCalledWith(embedContaining({
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
      title: 'Definition for T', 
      description: stripIndents`T, or t, is the twentieth letter in the Latin alphabet, used in the modern English alphabet, the alphabets of other western European languages and others worldwide. Its name in English is tee, plural tees. It is derived from the Semitic Taw 𐤕 of the Phoenician and Paleo-Hebrew script via the Greek letter τ (tau). In English, it is most commonly used to represent the voiceless alveolar plosive, a sound it also denotes in the International Phonetic Alphabet. It is the most commonly used consonant and the second most commonly used letter in English-language texts.`
    })) 
    
    const spy2 = await executeCommandAndSpyReply(slashCommand, command2);

    expect(spy2).toHaveBeenCalledWith(embedContaining({
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
      title: 'Definition for thisissomenonsense', 
      description: stripIndents`An error occured while trying to fetch the definition for thisissomenonsense from wikipedia.`
    }))

  });

 

});
