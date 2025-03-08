import {
  Role,
  SlashCommandBuilder,
} from 'discord.js';
import { SlashCommand } from '../../@types/commandDef';
import commandContext from '../../utils/context';
import { embedTemplate } from '../../utils/embedTemplate';

const F = f(__filename);

export const dTemplate: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('audit')
    .setDescription('Will convert helpers into the new role'),
  async execute(interaction) {
    log.info(F, await commandContext(interaction));

    await interaction.reply({ content: 'okay' });

    // Get a list of people on the guild with the Helper role
    const helpers = await interaction.guild?.roles.fetch(env.ROLE_HELPER) as Role;

    // Send a message to the channel with a list of the helper username and IDs
    await interaction.channel?.send({
      embeds: [
        embedTemplate()
          .setTitle('Helpers')
          .setDescription(helpers?.members.map(member => `${member.user.username} (${member.id})`).join('\n')),
      ],
    });

    // Get a list of people on the guild with the Tripsitting 101 role
    const tripsitters = await interaction.guild?.roles.fetch(env.ROLE_TRIPSITTING_101) as Role;

    // Send a message to the channel with a list of the tripsitter101 username and IDs
    await interaction.channel?.send({
      embeds: [
        embedTemplate()
          .setTitle('Completed Course')
          .setDescription(tripsitters?.members.map(member => `${member.user.username} (${member.id})`).join('\n')),
      ],
    });

    // Get a list of people with both roles
    const both = helpers?.members.filter(member => tripsitters?.members.has(member.id));

    // Send a message to the channel with a list of the people with both roles
    await interaction.channel?.send({
      embeds: [
        embedTemplate()
          .setTitle('Helpers with Completed Course')
          .setDescription(both?.map(member => `${member.user.username} (${member.id})`).join('\n')),
      ],
    });

    // Give those people the Verified Helper role
    // This needs to be an async forEach because we're awaiting the addRole
    // eslint-disable-next-line no-restricted-syntax
    for (const member of both.values()) {
      log.debug(F, `Adding Verified Helper role to ${member.user.username} (${member.id})`);
      // eslint-disable-next-line no-await-in-loop
      await member.roles.add(env.ROLE_VERIFIED_HELPER);
      log.debug(F, `Added Verified Helper role to ${member.user.username} (${member.id})`);
    }

    // Send a message to the channel when this is completed
    await interaction.channel?.send({
      embeds: [
        embedTemplate()
          .setTitle('Completed')
          .setDescription('All helpers with the Tripsitting 101 role have been given the Verified Helper role.'),
      ],
    });

    // Do this, then remove the Helper role entirely
    // Then change the verified_helper to just helper and re-push the config file

    return true;
  },
};

export default dTemplate;
