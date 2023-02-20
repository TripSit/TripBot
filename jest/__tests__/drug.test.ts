import {
  Colors,
} from 'discord.js';
import { stripIndents } from 'common-tags';
import { dDrug } from '../../src/discord/commands/global/d.drug';
import { executeCommandAndSpyReply, embedContaining, getParsedCommand } from '../utils/testutils';

const slashCommand = dDrug;

const authorInfo = {
  iconURL: 'https://fossdroid.com/images/icons/me.tripsit.tripmobile.13.png',
  name: 'TripSit.Me',
  url: 'http://www.tripsit.me',
};
const footerInfo = {
  iconURL: 'https://imgur.com/b923xK2.png',
  text: 'Dose responsibly!',
};

const dosageLabelSmoked = '💊 Dosage (Smoked)';
const dosageLabelVaporized = '💊 Dosage (Vapourised)';
const dosageLabelInsufflated = '💊 Dosage (Insufflated)';
const durationLabelSmoked = '⏳ Duration (Smoked)';
const durationLabelVaporized = '⏳ Duration (Vapourised)';
const durationLabelInsufflated = '⏳ Duration (Insufflated)';

describe(slashCommand.data.name, () => {
  it(slashCommand.data.description, async () => {
    // /drug substance:Cannabidiol response:All public:True
    expect(await executeCommandAndSpyReply(
      slashCommand,
      getParsedCommand(
        `/${slashCommand.data.name} substance:DMT`,
        slashCommand.data,
        'tripsit',
      ),
    )).toHaveBeenCalledWith({
      embeds: embedContaining({
        color: Colors.Purple,
        author: authorInfo,
        footer: footerInfo,
        title: stripIndents`🌐 DMT Information`,
        url: stripIndents`https://wiki.tripsit.me/wiki/DMT`,
        description: stripIndents`A popular and powerful psychedelic, typically used in two ways; either it is vapourised for a short 'breakthrough' experience, or it is taken in combination with an enzyme inhibitor for a long, intense trip (this is also known as ayahuasca or pharmahuasca).`, // eslint-disable-line
        fields: [
          {
            name: 'Aliases',
            value: stripIndents`Aliases: dimethyltryptamine, dmitry, n,n-dmt, the glory, the spirit molecule`,
            inline: false,
          },
          {
            name: 'ℹ Class',
            value: stripIndents`**Chemical**: Substituted tryptamines
            **Physical**: Substituted tryptamines`,
            inline: true,
          },
          {
            name: '🔀 Cross Tolerances',
            value: stripIndents`Psychedelics`,
            inline: true,
          },
          {
            name: '💔 Addiction Potential',
            value: stripIndents`Non-addictive with a low abuse potential`,
            inline: true,
          },
          {
            name: dosageLabelSmoked,
            value: stripIndents`
              Threshold: 2 mg
              Light: 10 - 20 mg
              Common: 20 - 40 mg
              Strong: 40 - 60 mg
              Heavy: 60+ mg`,
            inline: true,
          },
          {
            name: dosageLabelVaporized,
            value: stripIndents`
              Threshold: 5-10mg
              Light: 10-15mg
              Common: 15-25mg
              Strong: 25-35mg
              Heavy: 35mg+`,
            inline: true,
          },
          {
            name: dosageLabelInsufflated,
            value: stripIndents`
              Light: 10-25mg
              Common: 25-50mg
              Strong: 50-125mg+`,
            inline: true,
          },
          {
            name: durationLabelSmoked,
            value: stripIndents`
              Total: 5 - 20 minutes
              Onset: 20 - 40 seconds
              Come up: 1 - 3 minutes
              Peak: 2 - 8 minutes
              Offset: 1 - 6 minutes
              After effects: 10 - 60 minutes`,
            inline: true,
          },
          {
            name: durationLabelVaporized,
            value: stripIndents`After effects: 15-60 minutes`,
            inline: true,
          },
          {
            name: durationLabelInsufflated,
            value: stripIndents`
              Onset: 3-5 minutes
              Duration: 45-60 minutes
              After effects: 15-60 minutes`,
            inline: true,
          },
          {
            name: '↗ Tolerance',
            value: stripIndents`Full: Does not appear to occur`,
            inline: true,
          },
          {
            name: '☣ Toxicity',
            value: stripIndents`Extremely low toxicity`,
            inline: true,
          },
          {
            name: 'Links',
            value: stripIndents`[Erowid](https://www.erowid.org/experiences/subs/exp_DMT.shtml)`,
            inline: false,
          },
        ],
      }),
      ephemeral: true,
    });

    expect(await executeCommandAndSpyReply(
      slashCommand,
      getParsedCommand(
        `/${slashCommand.data.name} substance:DMT response:all public:true`,
        slashCommand.data,
        'tripsit',
      ),
    )).toHaveBeenCalledWith({
      embeds: embedContaining({
        color: Colors.Purple,
        author: authorInfo,
        footer: footerInfo,
        title: stripIndents`🌐 DMT Information`,
        url: stripIndents`https://wiki.tripsit.me/wiki/DMT`,
        description: stripIndents`A popular and powerful psychedelic, typically used in two ways; either it is vapourised for a short 'breakthrough' experience, or it is taken in combination with an enzyme inhibitor for a long, intense trip (this is also known as ayahuasca or pharmahuasca).`, // eslint-disable-line
        fields: [
          {
            name: 'Aliases',
            value: stripIndents`Aliases: dimethyltryptamine, dmitry, n,n-dmt, the glory, the spirit molecule`,
            inline: false,
          },
          {
            name: 'ℹ Class',
            value: stripIndents`**Chemical**: Substituted tryptamines
            **Physical**: Substituted tryptamines`,
            inline: true,
          },
          {
            name: '🔀 Cross Tolerances',
            value: stripIndents`Psychedelics`,
            inline: true,
          },
          {
            name: '💔 Addiction Potential',
            value: stripIndents`Non-addictive with a low abuse potential`,
            inline: true,
          },
          {
            name: dosageLabelSmoked,
            value: stripIndents`
              Threshold: 2 mg
              Light: 10 - 20 mg
              Common: 20 - 40 mg
              Strong: 40 - 60 mg
              Heavy: 60+ mg`,
            inline: true,
          },
          {
            name: dosageLabelVaporized,
            value: stripIndents`
              Threshold: 5-10mg
              Light: 10-15mg
              Common: 15-25mg
              Strong: 25-35mg
              Heavy: 35mg+`,
            inline: true,
          },
          {
            name: dosageLabelInsufflated,
            value: stripIndents`
              Light: 10-25mg
              Common: 25-50mg
              Strong: 50-125mg+`,
            inline: true,
          },
          {
            name: durationLabelSmoked,
            value: stripIndents`
              Total: 5 - 20 minutes
              Onset: 20 - 40 seconds
              Come up: 1 - 3 minutes
              Peak: 2 - 8 minutes
              Offset: 1 - 6 minutes
              After effects: 10 - 60 minutes`,
            inline: true,
          },
          {
            name: durationLabelVaporized,
            value: stripIndents`After effects: 15-60 minutes`,
            inline: true,
          },
          {
            name: durationLabelInsufflated,
            value: stripIndents`
              Onset: 3-5 minutes
              Duration: 45-60 minutes
              After effects: 15-60 minutes`,
            inline: true,
          },
          {
            name: '↗ Tolerance',
            value: stripIndents`Full: Does not appear to occur`,
            inline: true,
          },
          {
            name: '☣ Toxicity',
            value: stripIndents`Extremely low toxicity`,
            inline: true,
          },
          {
            name: 'Links',
            value: stripIndents`[Erowid](https://www.erowid.org/experiences/subs/exp_DMT.shtml)`,
            inline: false,
          },
        ],
      }),
      ephemeral: true,
    });

    // via MoonBear#1024 (177537158419054592) in TripSitDev (960606557622657026)
    // with params: substance: Cannabis, response: summary, public: false
    expect(await executeCommandAndSpyReply(
      slashCommand,
      getParsedCommand(
        `/${slashCommand.data.name} substance:DMT response:summary public:False`,
        slashCommand.data,
        'tripsit',
      ),
    )).toHaveBeenCalledWith({
      embeds: embedContaining({
        color: Colors.Purple,
        author: authorInfo,
        footer: footerInfo,
        title: stripIndents`🌐 DMT Information`,
        url: stripIndents`https://wiki.tripsit.me/wiki/DMT`,
        description: stripIndents`A popular and powerful psychedelic, typically used in two ways; either it is vapourised for a short 'breakthrough' experience, or it is taken in combination with an enzyme inhibitor for a long, intense trip (this is also known as ayahuasca or pharmahuasca).`, // eslint-disable-line
      }),
      ephemeral: true,
    });

    expect(await executeCommandAndSpyReply(
      slashCommand,
      getParsedCommand(
        `/${slashCommand.data.name} substance:DMT response:dosage public:true`,
        slashCommand.data,
        'tripsit',
      ),
    )).toHaveBeenCalledWith({
      embeds: embedContaining({
        color: Colors.Purple,
        author: authorInfo,
        footer: footerInfo,
        title: stripIndents`🌐 DMT Information`,
        url: stripIndents`https://wiki.tripsit.me/wiki/DMT`,
        description: stripIndents`A popular and powerful psychedelic, typically used in two ways; either it is vapourised for a short 'breakthrough' experience, or it is taken in combination with an enzyme inhibitor for a long, intense trip (this is also known as ayahuasca or pharmahuasca).`, // eslint-disable-line
        fields: [
          {
            name: dosageLabelSmoked,
            value: stripIndents`
              Threshold: 2 mg
              Light: 10 - 20 mg
              Common: 20 - 40 mg
              Strong: 40 - 60 mg
              Heavy: 60+ mg`,
            inline: true,
          },
          {
            name: dosageLabelVaporized,
            value: stripIndents`
              Threshold: 5-10mg
              Light: 10-15mg
              Common: 15-25mg
              Strong: 25-35mg
              Heavy: 35mg+`,
            inline: true,
          },
          {
            name: dosageLabelInsufflated,
            value: stripIndents`
              Light: 10-25mg
              Common: 25-50mg
              Strong: 50-125mg+`,
            inline: true,
          },
          {
            name: durationLabelSmoked,
            value: stripIndents`
              Total: 5 - 20 minutes
              Onset: 20 - 40 seconds
              Come up: 1 - 3 minutes
              Peak: 2 - 8 minutes
              Offset: 1 - 6 minutes
              After effects: 10 - 60 minutes`,
            inline: true,
          },
          {
            name: durationLabelVaporized,
            value: stripIndents`After effects: 15-60 minutes`,
            inline: true,
          },
          {
            name: durationLabelInsufflated,
            value: stripIndents`
              Onset: 3-5 minutes
              Duration: 45-60 minutes
              After effects: 15-60 minutes`,
            inline: true,
          },
        ],
      }),
      ephemeral: true,
    });
  });
});
