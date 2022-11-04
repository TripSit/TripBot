import {
  ContextMenuCommandBuilder,
  GuildMember,
  Colors,
  time,
} from 'discord.js';
import {
  ApplicationCommandType,
} from 'discord-api-types/v10';
import {UserCommand} from '../../@types/commandDef';
import {embedTemplate} from '../../utils/embedTemplate';
import log from '../../../global/utils/log';
import env from '../../../global/utils/env.config';
import {userDbEntry} from '../../../global/@types/database';
import {parse} from 'path';
const PREFIX = parse(__filename).name;

let actor = {} as GuildMember;
let target = {} as GuildMember;

export const info: UserCommand = {
  data: new ContextMenuCommandBuilder()
    .setName('Profile')
    .setType(ApplicationCommandType.User),
  async execute(interaction) {
    actor = interaction.member as GuildMember;
    log.debug(`[${PREFIX}] actor: ${JSON.stringify(actor, null, 2)}`);
    target = interaction.targetMember as GuildMember;
    log.debug(`[${PREFIX}] target: ${JSON.stringify(target, null, 2)}`);

    const testInteraction = {
      options: {},
      guild: interaction.guild,
      user: interaction.user,
      channel: interaction.channel,
      reply: (content:string) => {
        return interaction.reply(content);
      },
    };

    const command = await interaction.client.commands.get('profile');
    await command.execute(testInteraction);

    return true;
  },
};
