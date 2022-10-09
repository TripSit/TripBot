import {
  SlashCommandBuilder,
} from 'discord.js';
import {SlashCommand} from '../../@types/commandDef';
import {embedTemplate} from '../../utils/embedTemplate';
import logger from '../../../global/utils/logger';
import * as path from 'path';
import {stripIndents} from 'common-tags';
const PREFIX = path.parse(__filename).name;

export const dwarmline: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('testkits')
    .setDescription('Information on how to get a test kit'),

  async execute(interaction) {
    const embed = embedTemplate()
      .setTitle('Test Kit Resources and information!')
      .setDescription(stripIndents`
        [Dosetest](https://dosetest.com/) (Worldwide) offers 20% off test kits with code TripSit!
        [ReagentTests UK](https://www.reagent-tests.uk/shop/) (UK & EU ONLY) offers 10% off with code tripsitwiki!

        [How to use a reagent test kit](https://dancesafe.org/testing-kit-instructions/)
        [How to use fent strips](https://dancesafe.org/you-may-be-using-fentanyl-testing-strips-incorrectly/)

        [More testkit resources on the TripSit wiki!](https://wiki.tripsit.me/wiki/Test_Kits)
        `);
    interaction.reply({embeds: [embed], ephemeral: false});
    logger.debug(`[${PREFIX}] finished!`);
  },
};
