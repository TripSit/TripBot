import {
  Colors,
} from 'discord.js';
import { stripIndents } from 'common-tags';
import { dDrug } from '../commands/global/d.drug';
import { executeCommandAndSpyEditReply, embedContaining, getParsedCommand } from '../../jest/utils/testutils';

const slashCommand = dDrug;

const authorInfo = {
  iconURL: 'https://i.gyazo.com/b48b08a853fefaafb6393837eec1a501.png',
  name: 'TripSit.Me',
  url: 'http://www.tripsit.me',
};
const footerInfo = {
  iconURL: 'https://i.gyazo.com/19276c297cca0761dc9689ac7c320b8e.png',
  text: 'Dose responsibly!',
};

const dosageLabelOral = '💊 Dosage (Oral)';
const dosageLabelSmoked = '💊 Dosage (Smoked)';
const dosageLabelVaporized = '💊 Dosage (Vapourised)';
const dosageLabelInsufflated = '💊 Dosage (Insufflated)';
const dosageLabelSublingual = '💊 Dosage (Sublingual)';
const dosageLabelSublingualBuccal = '💊 Dosage (Sublingual/Buccal)';

const durationLabelOral = '⏳ Duration (Oral)';
const durationLabelSmoked = '⏳ Duration (Smoked)';
const durationLabelVaporized = '⏳ Duration (Vapourised)';
const durationLabelInsufflated = '⏳ Duration (Insufflated)';
const durationLabelSublingual = '⏳ Duration (Sublingual)';
const durationLabelSublingualBuccal = '⏳ Duration (Sublingual/Buccal)';
const crossTolerances = '🔀 Cross Tolerances';
const tolerance = '↗ Tolerance';
const toxicity = '☣ Toxicity';
const reagentResults = '🔬Reagent Results';
const addictionPotential = '💔 Addiction Potential';

describe(slashCommand.data.name, () => {
  it(slashCommand.data.description, async () => {
    // DMT - All
    expect(await executeCommandAndSpyEditReply(
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
        url: stripIndents`https://psychonautwiki.org/wiki/DMT`,
        description: stripIndents`A popular and powerful psychedelic, typically used in two ways; either it is vapourised for a short 'breakthrough' experience, or it is taken in combination with an enzyme inhibitor for a long, intense trip (this is also known as ayahuasca or pharmahuasca).`, // eslint-disable-line
        fields: [
          {
            name: 'Aliases',
            value: stripIndents`Aliases: dimethyltryptamine, dmitry, n,n-dmt, the glory, the spirit molecule`,
            inline: false,
          },
          {
            name: 'ℹ️ Class',
            value: stripIndents`**Chemical**: Substituted tryptamines
            **Physical**: Substituted tryptamines`,
            inline: true,
          },
          {
            name: crossTolerances,
            value: stripIndents`Psychedelics`,
            inline: true,
          },
          {
            name: addictionPotential,
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
            name: tolerance,
            value: stripIndents`Full: Does not appear to occur`,
            inline: true,
          },
          {
            name: toxicity,
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
    });

    // DMT - All - Ephemeral
    expect(await executeCommandAndSpyEditReply(
      slashCommand,
      getParsedCommand(
        `/${slashCommand.data.name} substance:DMT section:all ephemeral:false`,
        slashCommand.data,
        'tripsit',
      ),
    )).toHaveBeenCalledWith({
      embeds: embedContaining({
        color: Colors.Purple,
        author: authorInfo,
        footer: footerInfo,
        title: stripIndents`🌐 DMT Information`,
        url: stripIndents`https://psychonautwiki.org/wiki/DMT`,
        description: stripIndents`A popular and powerful psychedelic, typically used in two ways; either it is vapourised for a short 'breakthrough' experience, or it is taken in combination with an enzyme inhibitor for a long, intense trip (this is also known as ayahuasca or pharmahuasca).`, // eslint-disable-line
        fields: [
          {
            name: 'Aliases',
            value: stripIndents`Aliases: dimethyltryptamine, dmitry, n,n-dmt, the glory, the spirit molecule`,
            inline: false,
          },
          {
            name: 'ℹ️ Class',
            value: stripIndents`**Chemical**: Substituted tryptamines
            **Physical**: Substituted tryptamines`,
            inline: true,
          },
          {
            name: crossTolerances,
            value: stripIndents`Psychedelics`,
            inline: true,
          },
          {
            name: addictionPotential,
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
            name: tolerance,
            value: stripIndents`Full: Does not appear to occur`,
            inline: true,
          },
          {
            name: toxicity,
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
    });

    // DMT - Summary- Ephemeral
    expect(await executeCommandAndSpyEditReply(
      slashCommand,
      getParsedCommand(
        `/${slashCommand.data.name} substance:DMT section:summary ephemeral:true`,
        slashCommand.data,
        'tripsit',
      ),
    )).toHaveBeenCalledWith({
      embeds: embedContaining({
        color: Colors.Purple,
        author: authorInfo,
        footer: footerInfo,
        title: stripIndents`🌐 DMT Information`,
        url: stripIndents`https://psychonautwiki.org/wiki/DMT`,
        description: stripIndents`A popular and powerful psychedelic, typically used in two ways; either it is vapourised for a short 'breakthrough' experience, or it is taken in combination with an enzyme inhibitor for a long, intense trip (this is also known as ayahuasca or pharmahuasca).`, // eslint-disable-line
      }),
    });

    // DMT - Dosage - Ephemeral
    expect(await executeCommandAndSpyEditReply(
      slashCommand,
      getParsedCommand(
        `/${slashCommand.data.name} substance:DMT section:dosage ephemeral:false`,
        slashCommand.data,
        'tripsit',
      ),
    )).toHaveBeenCalledWith({
      embeds: embedContaining({
        color: Colors.Purple,
        author: authorInfo,
        footer: footerInfo,
        title: stripIndents`🌐 DMT Information`,
        url: stripIndents`https://psychonautwiki.org/wiki/DMT`,
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
        ],
      }),
    });

    // Alcohol - All
    expect(await executeCommandAndSpyEditReply(
      slashCommand,
      getParsedCommand(
        `/${slashCommand.data.name} substance:Alcohol`,
        slashCommand.data,
        'tripsit',
      ),
    )).toHaveBeenCalledWith({
      embeds: embedContaining({
        color: Colors.Purple,
        author: authorInfo,
        footer: footerInfo,
        title: stripIndents`🌐 Alcohol Information`,
        url: stripIndents`https://psychonautwiki.org/wiki/Alcohol`,
        description: stripIndents`Alcohol is a CNS depressant that acts through the GABAₐ receptor, and is one of the most common strong psychoactives used by humans. It has a long history of use and its intoxicating effects are well-studied and documented. It remains legal in most parts of the world.`, // eslint-disable-line
        fields: [
          {
            name: 'Aliases',
            value: stripIndents`Aliases: beer, booze, ethanol, etoh, hooch, juice, liquor, moonshine, sauce`,
            inline: false,
          },
          {
            name: '**💀 Dangerous 🛑 Interactions 💀**',
            value: stripIndents`Benzodiazepines, DXM, GHB/GBL, Ketamine, MXE, Opioids, Tramadol`,
            inline: false,
          },
          {
            name: 'ℹ️ Class',
            value: stripIndents`**Chemical**: Alcohol
            **Physical**: Alcohol`,
            inline: true,
          },
          {
            name: crossTolerances,
            value: stripIndents`GABA, Depressants`,
            inline: true,
          },
          {
            name: addictionPotential,
            value: stripIndents`Extremely addictive with a high potential for abuse`,
            inline: true,
          },
          {
            name: dosageLabelOral,
            value: stripIndents`Threshold: 13 mL EtOH (10 g)
              Light: 25 - 38 mL EtOH (20-30 g)
              Common: 38 - 64 mL EtOH (30-50 g)
              Strong: 64 - 76 mL EtOH (50-60 g)
              Heavy: 76+ mL EtOH (60+ g)`,
            inline: true,
          },
          {
            name: tolerance,
            value: stripIndents`Full: Develops with prolonged and repeated use
            Half: 3 - 7 days
            Zero: 1 - 2 weeks`,
            inline: true,
          },
          {
            name: toxicity,
            value: stripIndents`Death from ethanol consumption is possible when blood alcohol levels reach 0.4%`,
            inline: true,
          },
          {
            name: durationLabelOral,
            value: stripIndents`Total: 1.5 - 3 hours
            Onset: 2 - 5 minutes
            Peak: 30 - 90 minutes
            Offset: 45 - 60 minutes
            After effects: 6 - 48 hours`,
            inline: true,
          },
          {
            name: '\u200B',
            value: '\u200B',
            inline: true,
          },
          {
            name: '\u200B',
            value: '\u200B',
            inline: true,
          },
          {
            name: 'Links',
            value: stripIndents`[Erowid](https://www.erowid.org/experiences/subs/exp_Alcohol.shtml)`,
            inline: false,
          },
        ],
      }),
    });

    // DMT - All
    expect(await executeCommandAndSpyEditReply(
      slashCommand,
      getParsedCommand(
        `/${slashCommand.data.name} substance:25N-NBOMe`,
        slashCommand.data,
        'tripsit',
      ),
    )).toHaveBeenCalledWith({
      embeds: embedContaining({
        color: Colors.Purple,
        author: authorInfo,
        footer: footerInfo,
        title: stripIndents`🌐 25N-NBOMe Information`,
        url: stripIndents`https://psychonautwiki.org/wiki/25N-NBOMe`,
            description: stripIndents`A rare, highly potent and yellow psychedelic phenethylamine and derivative of 2C-N. Effects are similar to other NBOMe compounds, with hallucinations, intense body load, stimulation and vasoconstriction. At high doses vasoconstriction can be dangerous, exercise caution.`, // eslint-disable-line
        fields: [
          {
            name: 'Aliases',
            value: stripIndents`Aliases: 2-c-n-nbome, 25n`,
            inline: false,
          },
          {
            name: 'ℹ️ Class',
            value: stripIndents`**Chemical**: Substituted phenethylamines
                **Physical**: Substituted phenethylamines`,
            inline: true,
          },
          {
            name: crossTolerances,
            value: stripIndents`Psychedelic`,
            inline: true,
          },
          {
            name: addictionPotential,
            value: stripIndents`Not habit-forming`,
            inline: true,
          },
          {
            name: dosageLabelInsufflated,
            value: stripIndents`Heavy: null`,
            inline: true,
          },
          {
            name: dosageLabelSublingual,
            value: stripIndents`
                  Threshold: < 100 µg
                  Light: 100 - 300 µg
                  Common: 300 - 800 µg
                  Strong: 800 - 1300 μg
                  Heavy: null`,
            inline: true,
          },
          {
            name: dosageLabelSublingualBuccal,
            value: stripIndents`
                  Light: 100-300ug
                  Common: 300-800ug
                  Strong: 800-1300ug+`,
            inline: true,
          },
          {
            name: durationLabelInsufflated,
            value: stripIndents`Total: 4 - 8 hours`,
            inline: true,
          },
          {
            name: durationLabelSublingual,
            value: stripIndents`
                  Total: 5 - 10 hours
                  Onset: 45 - 75 minutes
                  Peak: 2 - 3 hours
                  Offset: 2 - 3 hours
                  After effects: 5 - 10 hours`,
            inline: true,
          },
          {
            name: durationLabelSublingualBuccal,
            value: stripIndents`
                  Onset: 45-75 minutes
                  Duration: 5-10 hours
                  After effects: 1-12 hours`,
            inline: true,
          },
          {
            name: reagentResults,
                value: stripIndents`Marquis: Red > Brown. | Mecke: Blue > Black. | Mandelin: Blue > Black. | Froehde: Brown. | Liebermann: Brown. | Simon's: Red > Brown. | Ehrlich: No colour change.`, // eslint-disable-line
            inline: false,
          },
          {
            name: tolerance,
            value: stripIndents`Full: Almost immediately after ingestion
                Half: 3 days
                Zero: 7 days`,
            inline: true,
          },
          {
            name: toxicity,
            value: stripIndents`Potentially fatal at heavy dosages`,
            inline: true,
          },
        ],
      }),
    });

    // Dummy - All
    expect(await executeCommandAndSpyEditReply(
      slashCommand,
      getParsedCommand(
        `/${slashCommand.data.name} substance:Dummy`,
        slashCommand.data,
        'tripsit',
      ),
    )).toHaveBeenCalledWith({
      embeds: embedContaining({
        color: Colors.Purple,
        author: authorInfo,
        footer: footerInfo,
        title: stripIndents`Dummy was not found`,
        description: stripIndents`...this shouldn't have happened, please tell the developer!`, // eslint-disable-line
      }),
    });
  });
});
