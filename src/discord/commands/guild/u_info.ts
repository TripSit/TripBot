import {
  ContextMenuCommandBuilder,
  GuildMember,
} from 'discord.js';
import {
  ApplicationCommandType,
} from 'discord-api-types/v10';
import {UserCommand} from '../../utils/commandDef';
import {embedTemplate} from '../../utils/embedTemplate';
import logger from '../../../global/utils/logger';
import {moderate} from '../../../global/commands/g.moderate';
const PREFIX = require('path').parse(__filename).name;

let actor = {} as GuildMember;
let target = {} as GuildMember | string;
const command = 'info';

const embed = embedTemplate();

export const info: UserCommand = {
  data: new ContextMenuCommandBuilder()
      .setName('u_info')
      .setType(ApplicationCommandType.User),
  async execute(interaction) {
    // https://discord.js.org/#/docs/discord.js/stable/class/ContextMenuInteraction
    actor = interaction.member as GuildMember;
    // logger.debug(`[${PREFIX}] actor: ${JSON.stringify(actor, null, 2)}`);
    target = interaction.options.data[0].member as GuildMember;
    // logger.debug(`[${PREFIX}] target: ${JSON.stringify(target, null, 2)}`);

    const result = await moderate(actor, command, target, undefined, 'on', undefined, undefined, interaction);
    logger.debug(`[${PREFIX}] Result: ${result}`);

    embed.setDescription(result);

    interaction.reply({embeds: [embed], ephemeral: true});

    logger.debug(`[${PREFIX}] finished!`);
  },
};
