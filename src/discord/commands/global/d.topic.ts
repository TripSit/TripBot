import {
  SlashCommandBuilder,
} from 'discord.js';
import { SlashCommand } from '../../@types/commandDef';
// import { embedTemplate } from '../../utils/embedTemplate';
import { topic } from '../../../global/commands/g.topic';
import commandContext from '../../utils/context';
import { t, getLocale, getCommandLocalizations } from '../../../i18n/index';

const F = f(__filename);

export const dTopic: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('topic')
    .setNameLocalizations(getCommandLocalizations('topic', 'commandName'))
    .setDescription(t('en', 'topic', 'commandDescription'))
    .setDescriptionLocalizations(getCommandLocalizations('topic', 'commandDescription'))
    .setIntegrationTypes([0]),
  async execute(interaction) {
    log.info(F, await commandContext(interaction));
    const locale = await getLocale(interaction, 'topic');
    await interaction.deferReply({});
    // interaction.editReply({ embeds: [embedTemplate().setDescription(await topic())] });
    const topicText = await topic();
    await interaction.editReply(t(locale, 'topic', 'replyLabel', { topic: topicText }));
    return true;
  },
};

export default dTopic;
