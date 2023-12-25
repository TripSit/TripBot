import {
  Colors,
} from 'discord.js';
import { stripIndents } from 'common-tags';
import { dCrisis } from '../commands/global/d.crisis';
import { executeCommandAndSpyEditReply, embedContaining, getParsedCommand } from '../../jest/utils/testutils';

const slashCommand = dCrisis;

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
        color: Colors.Purple,
        author: authorInfo,
        footer: footerInfo,
        title: 'Crisis Information',
        fields: [
          {
            name: 'Poison Control (USA)',
            value: stripIndents`
          [Website](https://www.poison.org)            
          [Webchat](https://triage.webpoisoncontrol.org)            
          Call: (800) 222-1222`,
            inline: true,
          },
          {
            name: 'Never Use Alone (USA)',
            value: stripIndents`
          [Website](https://neverusealone.com)                        
          Call: (800) 484-3731`,
            inline: true,
          },
          {
            name: 'National Overdose Response Service (Canada)',
            value: stripIndents`
          [Website](https://www.nors.ca)                        
          Call: 1 (888) 688-6677`,
            inline: true,
          },
          {
            name: 'Talktofrank (UK)',
            value: stripIndents`
          [Website](https://www.talktofrank.com)            
          [Webchat](https://www.talktofrank.com/livechat)            
          Call: 0300 123 6600`,
            inline: true,
          },
          {
            name: 'Mindzone (EU/germany)',
            value: stripIndents`
          [Website](https://mindzone.info/gesundheit/drogennotfall)                                    
          Text: 112 (works EU wide)`,
            inline: true,
          },
          {
            name: 'Crisis Text Line (United States)',
            value: stripIndents`
          [Website](https://www.crisistextline.org)                        
          Call: 988            
          Text: HOME to 741741`,
            inline: true,
          },
          {
            name: 'Canadian Mental Health Association (Canada)',
            value: stripIndents`
          [Website](https://cmha.ca/)                        
          Call: 1-833-456-4566 (24/7) 
          1-866-277-3553 in Quebec (24/7)             
          Text: 45645 (4 p.m. – Midnight ET)`,
            inline: true,
          },
          {
            name: 'Kids Help Phone (<18) (Canada)',
            value: stripIndents`
          [Website](https://kidshelpphone.ca/)            
          [Webchat](https://kidshelpphone.ca/live-chat-counselling/)                        
          Text: CONNECT to 686868`,
            inline: true,
          },
          {
            name: 'Samaritans (UK)',
            value: stripIndents`
          [Website](https://www.samaritans.org)            
          [Webchat](https://www.samaritans.org/how-we-can-help/contact-samaritan/)            
          Call: 116 123`,
            inline: true,
          },
          {
            name: 'Open Counseling Suicide Hotline List (Worldwide)',
            value: stripIndents`
          [Website](https://blog.opencounseling.com)            
          [Webchat](https://blog.opencounseling.com/suicide-hotlines/)`,
            inline: true,
          },
        ],
      }),
    });
  });
});
