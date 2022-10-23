import {
  ContextMenuCommandBuilder,
  GuildMember,
} from 'discord.js';
import {
  ApplicationCommandType,
} from 'discord-api-types/v10';
import {UserCommand} from '../../@types/commandDef';
import logger from '../../../global/utils/logger';
import {moderate} from '../../../global/commands/g.moderate';
import * as path from 'path';
const PREFIX = path.parse(__filename).name;

let actor = {} as GuildMember;
let target = {} as GuildMember | string;
const command = 'info';

export const info: UserCommand = {
  data: new ContextMenuCommandBuilder()
    .setName('Info')
    .setType(ApplicationCommandType.User),
  async execute(interaction) {
    actor = interaction.member as GuildMember;
    target = interaction.options.data[0].member as GuildMember;

    const result = await moderate(actor, command, target, undefined, 'on', undefined, undefined, interaction);

    logger.debug(`[${PREFIX}] Result: ${result}`);
    interaction.reply(result);

    logger.debug(`[${PREFIX}] finished!`);
  },
};
