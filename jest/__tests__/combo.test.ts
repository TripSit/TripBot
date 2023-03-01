import { stripIndents } from 'common-tags';
import { Colors } from 'discord.js';
import { dCombo } from '../../src/discord/commands/global/d.combo';
import { executeCommandAndSpyEditReply, embedContaining, getParsedCommand } from '../utils/testutils';

const slashCommand = dCombo;

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
    expect(await executeCommandAndSpyEditReply(
      slashCommand,
      getParsedCommand(
        `/${slashCommand.data.name} first_drug:MDMA second_drug:Ketamine`,
        slashCommand.data,
        'tripsit',
      ),
    )).toHaveBeenCalledWith({
      embeds: embedContaining({
        color: Colors.DarkBlue,
        author: authorInfo,
        footer: footerInfo,
        thumbnail: {
          url: 'https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/120/samsung/320/up-right-arrow_2197-fe0f.png', // eslint-disable-line
        },
        title: 'Mixing **MDMA** and **Ketamine**: ↗ Low Risk & Synergy ↗',
        description: stripIndents`These drugs work together to cause an effect greater than the sum of its parts, and they aren't likely to cause an adverse or undesirable reaction when used carefully. Additional research should always be done before combining drugs.`, // eslint-disable-line
      }),
      ephemeral: false,
    });

    expect(await executeCommandAndSpyEditReply(
      slashCommand,
      getParsedCommand(
        `/${slashCommand.data.name} first_drug:booze second_drug:xanax`,
        slashCommand.data,
        'tripsit',
      ),
    )).toHaveBeenCalledWith({
      embeds: embedContaining({
        color: Colors.Red,
        author: authorInfo,
        footer: footerInfo,
        thumbnail: {
          url: 'https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/120/samsung/320/skull-and-crossbones_2620-fe0f.png', // eslint-disable-line
        },
        title: 'Mixing **booze** and **xanax**: ☠️ Dangerous ☠️',
        description: stripIndents`These combinations are considered extremely harmful and should always be avoided. Reactions to these drugs taken in combination are highly unpredictable and have a potential to cause death.`, // eslint-disable-line
      }),
      ephemeral: false,
    });

    expect(await executeCommandAndSpyEditReply(
      slashCommand,
      getParsedCommand(
        `/${slashCommand.data.name} first_drug:booze second_drug:Methamphetamine`,
        slashCommand.data,
        'tripsit',
      ),
    )).toHaveBeenCalledWith({
      embeds: embedContaining({
        color: Colors.Yellow,
        author: authorInfo,
        footer: footerInfo,
        thumbnail: {
          url: 'https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/120/samsung/320/caution-sign_2621.png', // eslint-disable-line
        },
        title: 'Mixing **booze** and **Methamphetamine**: ⚠️ Caution ⚠️',
        description: stripIndents`These combinations are not usually physically harmful, but may produce undesirable  effects, such as physical discomfort or overstimulation. Extreme use may cause physical health issues. Synergistic effects may be unpredictable. Care should be taken when choosing to use this combination.`, // eslint-disable-line
      }),
      ephemeral: false,
    });

    expect(await executeCommandAndSpyEditReply(
      slashCommand,
      getParsedCommand(
        `/${slashCommand.data.name} first_drug:Methamphetamine second_drug:booze`,
        slashCommand.data,
        'tripsit',
      ),
    )).toHaveBeenCalledWith({
      embeds: embedContaining({
        color: Colors.Yellow,
        author: authorInfo,
        footer: footerInfo,
        thumbnail: {
          url: 'https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/120/samsung/320/caution-sign_2621.png', // eslint-disable-line
        },
        title: 'Mixing **Methamphetamine** and **booze**: ⚠️ Caution ⚠️',
        description: stripIndents`These combinations are not usually physically harmful, but may produce undesirable  effects, such as physical discomfort or overstimulation. Extreme use may cause physical health issues. Synergistic effects may be unpredictable. Care should be taken when choosing to use this combination.`, // eslint-disable-line
      }),
      ephemeral: false,
    });

    expect(await executeCommandAndSpyEditReply(
      slashCommand,
      getParsedCommand(
        `/${slashCommand.data.name} first_drug:Alcohol second_drug:Oxycodone`,
        slashCommand.data,
        'tripsit',
      ),
    )).toHaveBeenCalledWith({
      embeds: embedContaining({
        color: Colors.Red,
        author: authorInfo,
        footer: footerInfo,
        thumbnail: {
          url: 'https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/120/samsung/320/skull-and-crossbones_2620-fe0f.png', // eslint-disable-line
        },
        title: 'Mixing **Alcohol** and **Oxycodone**: ☠️ Dangerous ☠️',
        description: stripIndents`These combinations are considered extremely harmful and should always be avoided. Reactions to these drugs taken in combination are highly unpredictable and have a potential to cause death.`, // eslint-disable-line
      }),
      ephemeral: false,
    });

    expect(await executeCommandAndSpyEditReply(
      slashCommand,
      getParsedCommand(
        `/${slashCommand.data.name} first_drug:Oxycodone second_drug:Alcohol`,
        slashCommand.data,
        'tripsit',
      ),
    )).toHaveBeenCalledWith({
      embeds: embedContaining({
        color: Colors.Red,
        author: authorInfo,
        footer: footerInfo,
        thumbnail: {
          url: 'https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/120/samsung/320/skull-and-crossbones_2620-fe0f.png', // eslint-disable-line
        },
        title: 'Mixing **Oxycodone** and **Alcohol**: ☠️ Dangerous ☠️',
        description: stripIndents`These combinations are considered extremely harmful and should always be avoided. Reactions to these drugs taken in combination are highly unpredictable and have a potential to cause death.`, // eslint-disable-line
      }),
      ephemeral: false,
    });

    expect(await executeCommandAndSpyEditReply(
      slashCommand,
      getParsedCommand(
        `/${slashCommand.data.name} first_drug:amphetamines second_drug:booze`,
        slashCommand.data,
        'tripsit',
      ),
    )).toHaveBeenCalledWith({
      embeds: embedContaining({
        color: Colors.Yellow,
        author: authorInfo,
        footer: footerInfo,
        thumbnail: {
          url: 'https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/120/samsung/320/caution-sign_2621.png', // eslint-disable-line
        },
        title: 'Mixing **amphetamines** and **booze**: ⚠️ Caution ⚠️',
        description: stripIndents`These combinations are not usually physically harmful, but may produce undesirable  effects, such as physical discomfort or overstimulation. Extreme use may cause physical health issues. Synergistic effects may be unpredictable. Care should be taken when choosing to use this combination.`, // eslint-disable-line
      }),
      ephemeral: false,
    });

    expect(await executeCommandAndSpyEditReply(
      slashCommand,
      getParsedCommand(
        `/${slashCommand.data.name} first_drug:booze second_drug:diazepam`,
        slashCommand.data,
        'tripsit',
      ),
    )).toHaveBeenCalledWith({
      embeds: embedContaining({
        color: Colors.Red,
        author: authorInfo,
        footer: footerInfo,
        thumbnail: {
          url: 'https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/120/samsung/320/skull-and-crossbones_2620-fe0f.png', // eslint-disable-line
        },
        title: 'Mixing **booze** and **diazepam**: ☠️ Dangerous ☠️',
        description: stripIndents`These combinations are considered extremely harmful and should always be avoided. Reactions to these drugs taken in combination are highly unpredictable and have a potential to cause death.`, // eslint-disable-line
      }),
      ephemeral: false,
    });

    expect(await executeCommandAndSpyEditReply(
      slashCommand,
      getParsedCommand(
        `/${slashCommand.data.name} first_drug:diazepam second_drug:booze`,
        slashCommand.data,
        'tripsit',
      ),
    )).toHaveBeenCalledWith({
      embeds: embedContaining({
        color: Colors.Red,
        author: authorInfo,
        footer: footerInfo,
        thumbnail: {
          url: 'https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/120/samsung/320/skull-and-crossbones_2620-fe0f.png', // eslint-disable-line
        },
        title: 'Mixing **diazepam** and **booze**: ☠️ Dangerous ☠️',
        description: stripIndents`These combinations are considered extremely harmful and should always be avoided. Reactions to these drugs taken in combination are highly unpredictable and have a potential to cause death.`, // eslint-disable-line
      }),
      ephemeral: false,
    });

    expect(await executeCommandAndSpyEditReply(
      slashCommand,
      getParsedCommand(
        `/${slashCommand.data.name} first_drug:boxxxxoze second_drug:diazepam`,
        slashCommand.data,
        'tripsit',
      ),
    )).toHaveBeenCalledWith({
      embeds: embedContaining({
        color: Colors.Purple,
        author: authorInfo,
        footer: footerInfo,
        title: 'boxxxxoze was not found, make sure you spelled it correctly!',
        description: stripIndents`...this shouldn't have happened, please tell the developer!`, // eslint-disable-line
      }),
      ephemeral: false,
    });

    expect(await executeCommandAndSpyEditReply(
      slashCommand,
      getParsedCommand(
        `/${slashCommand.data.name} first_drug:booze second_drug:diazxxxepam`,
        slashCommand.data,
        'tripsit',
      ),
    )).toHaveBeenCalledWith({
      embeds: embedContaining({
        color: Colors.Purple,
        author: authorInfo,
        footer: footerInfo,
        title: 'diazxxxepam was not found, make sure you spelled it correctly!',
        description: stripIndents`...this shouldn't have happened, please tell the developer!`, // eslint-disable-line
      }),
      ephemeral: false,
    });

    expect(await executeCommandAndSpyEditReply(
      slashCommand,
      getParsedCommand(
        `/${slashCommand.data.name} first_drug:Methamphetamine second_drug:Heroin`,
        slashCommand.data,
        'tripsit',
      ),
    )).toHaveBeenCalledWith({
      embeds: embedContaining({
        color: Colors.Purple,
        author: authorInfo,
        footer: footerInfo,
        title: 'Could not find interaction info for Methamphetamine and Heroin!',
        description: stripIndents`This does not mean combining them is safe!
        This means we don't have information on it!
        
        Start your research here:
        [Methamphetamine](https://psychonautwiki.org/wiki/Methamphetamine)
        [Heroin](https://psychonautwiki.org/wiki/Heroin)`, // eslint-disable-line
      }),
      ephemeral: false,
    });
  });
});
