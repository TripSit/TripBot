import {
  Colors,
} from 'discord.js';
import { parse } from 'path';
import { stripIndents } from 'common-tags';
import { dH2flow } from '../commands/guild/d.h2flow';
import { executeCommandAndSpyEditReply, embedContaining, getParsedCommand } from '../../utils/testutils';
import log from '../../global/utils/log'; // eslint-disable-line

const PREFIX = parse(__filename).name; // eslint-disable-line

const slashCommand = dH2flow;

describe(slashCommand.data.name, () => {
  it(slashCommand.data.description, async () => {
    const commandData = slashCommand.data;
    const stringCommand = `/${commandData.name}`;
    const command = getParsedCommand(stringCommand, commandData);
    // log.debug(F, `command: ${JSON.stringify(command, null, 2)}`);
    const spy = await executeCommandAndSpyEditReply(slashCommand, command);
    expect(spy).toHaveBeenCalledWith(embedContaining({
      color: Colors.Blue,
      author: {
        iconURL: undefined,
        name: 'What is the H2Flow club?',
        url: 'https://www.youtube.com/watch?v=6r17Ez9V3AQ&t=132s',
      },
      footer: {
        iconURL: undefined,
        text: expect.any(String),
      },
      title: 'Bot Stats',
      url: 'https://tripsit.me/about/',
      description: stripIndents`
      These are not useless internet points✨
      This is an emoji-based social🌐media experience!
      Think about H2Flow as app📱for your health 🩺
      Every so often you'll see a reminder to be healthy🧘‍♂️
      Move around🕴, drink some water💧, or spread love💖
      Perform the action, react to the message, get your points✨!
      You can only get one point✨ per message, so pay attention!
      If you get enough ✨ then you're on your way to your first
      **🌊AquaBadge🔰** or **💖LoveCup🏆** or **🏃Move Medal🏅**!
      Get enough 🌊🔰, 💖🏆 or 🏃🏅 and you'll level up!
      Level up enoough and we'll welcome you to the fabled
      ☆ﾟ.*･｡ﾟ☆ﾟ.*･｡ﾟ🥇*H2Flow Club*🥇☆ﾟ.*･｡ﾟ☆ﾟ.*･｡ﾟ`,
      // thumbnail: 'https://i.imgur.com/2niEJJO.png',
      fields: [
        {
          name: expect.any(String),
          value: expect.any(String),
          inline: true,
        },
        {
          name: expect.any(String),
          value: expect.any(String),
          inline: true,
        },
        {
          name: expect.any(String),
          value: expect.any(String),
          inline: true,
        },
      ],
    }));
  });
});
