/* eslint-disable max-len */
import {
  Colors,
  SlashCommandBuilder,
} from 'discord.js';
import { stripIndents } from 'common-tags';
import { SlashCommand } from '../../@types/commandDef';
import { embedTemplate } from '../../utils/embedTemplate';
import commandContext from '../../utils/context';

const F = f(__filename);

export const drugChecking: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('drug_checking')
    .setContexts([0, 1, 2])
    .setIntegrationTypes([0, 1])
    .setDescription('Provides information on drug checking services.')
    .addBooleanOption(option => option.setName('ephemeral')
      .setDescription('Set to "True" to show the response only to you')) as SlashCommandBuilder,
  async execute(interaction) {
    log.info(F, await commandContext(interaction));
    await interaction.deferReply({ ephemeral: (interaction.options.getBoolean('ephemeral') === true) });
    const embed = embedTemplate()
      .setTitle('Drug Checking Information')
      .setColor(Colors.Blurple)
      .setDescription(stripIndents`
        Drug-checking services allow for laboratory testing of substances to allow people who use drugs to confirm what substances are present in the drugs they are purchasing and taking. In addition, they often publish results and post alerts when there are concerning samples found so are a good resource to check in with even if you do not or cannot send in your own sample. 
        
        For a full list of resources [check out our wiki page](https://wiki.tripsit.me/wiki/Sources_for_Laboratory_Analysis).
        ## Mail-In Services
        ### North America
        [DrugsData](https://drugsdata.org/send_sample.php) (United States)
        [UNC Street Drugs Lab](https://www.streetsafe.supply/) (United States)
        [Get Your Drugs Tested](https://getyourdrugstested.com/canada-wide-drug-checking-by-mail/) (Canada)
        ### Europe
        [Energy Control](https://energycontrol-international.org/drug-testing-service/) (Spain)
        [WEDINOS](http://www.wedinos.org/sample_testing.html) (United Kingdom)
        ## Walk-In Services
        ### Canada
        [British Columbia Centre on Substance Use](https://drugcheckingbc.ca/drug-checking-sites/) (BC)
        [Toronto's Drug Checking Service](https://drugchecking.cdpe.org/about/) (Toronto)
        [Cactus Montreal](https://cactusmontreal.org/en/services-en/drug-testing/) (Montreal)
        [Spectrum Drug Checking](https://ourhealthyeg.ca/spectrum-drug-testing) (Edmonton)
        [AAWEAR](https://aawear.org/events/) (Calgary)
        ### United States
        [OnPoint NYC](https://onpointnyc.org/) (New York City)
        [Rapid Analysis of Drugs - RAD](https://health.maryland.gov/pha/NALOXONE/Pages/RAD.aspx) (Maryland)
        [Street Check](https://www.info.streetcheck.org/how-to-submit-a-sample) (Massachusetts)
        [Chicago Recovery Alliance](https://anypositivechange.org/van-timetable/) (Chicago)
        ### Europe
        [checkit!](https://checkit.wien/) (Vienna)
        [Drugchecking Berlin](https://drugchecking.berlin/checking/ablauf) (Berlin)
        [Saferparty](https://en.saferparty.ch/angebote/drug-checking) (Zurich)
        [Drugs Information and Monitoring System](https://www.drugs-test.nl/en/testlocations/) (Netherlands)
        ## Austrailia
        [CanTEST](https://www.cahma.org.au/services/cantest/) (Canberra)
        `);

    try {
      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      log.error(F, `${error}`);
      await interaction.deleteReply();
      await interaction.followUp({ embeds: [embed], ephemeral: true });
    }

    return true;
  },
};

export default drugChecking;
