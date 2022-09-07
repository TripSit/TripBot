import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  GuildMember,
} from 'discord.js';
import {SlashCommand} from '../../utils/commandDef';
// import {embedTemplate} from '../../utils/embedTemplate';
// import {stripIndents} from 'common-tags';
// import env from '../../../global/utils/env.config';
import logger from '../../../global/utils/logger';
import {tripsat} from '../../utils/tripsat';
import {tripsitme} from '../../utils/tripsitme';
const PREFIX = require('path').parse(__filename).name;

export const tripsit: SlashCommand = {
  data: new SlashCommandBuilder()
      .setName('tripsit')
      .setDescription(
          'This command will apply the NeedsHelp role onto a user, and remove other roles!',
      )
      .addUserOption((option) => option
          .setName('user')
          .setDescription('Member to help')
          .setRequired(true))
      .addStringOption((option) => option
          .setName('their_dosage')
          .setDescription('What have they taken?'))
      .addStringOption((option) => option
          .setName('their_issue')
          .setDescription('What\'s going on with them?'))
      .addStringOption((option) => option
          .setName('enable')
          .setDescription('On or Off?')
          .addChoices(
              {name: 'On', value: 'on'},
              {name: 'Off', value: 'off'},
          )),

  async execute(interaction:ChatInputCommandInteraction) {
    let enable = interaction.options.getString('enable');
    // Default to on if no setting is provided
    if (!enable) {
      enable = 'on';
    }

    const target = interaction.options.getMember('user') as GuildMember;
    const triage = interaction.options.getString('their_dosage') || 'No info given';
    const input = interaction.options.getString('their_issue') || 'No info given';

    logger.debug(`[${PREFIX}] target: ${target}`);
    logger.debug(`[${PREFIX}] triage: ${triage}`);
    logger.debug(`[${PREFIX}] input: ${input}`);
    logger.debug(`[${PREFIX}] enable: ${enable}`);

    if (enable === 'on') {
      tripsitme(interaction, target, triage, input);
    }
    if (enable === 'off') {
      tripsat(interaction, target);
    }
  },
};
