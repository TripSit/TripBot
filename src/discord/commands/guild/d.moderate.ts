import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  // Colors,
  GuildMember,
  ModalBuilder,
  TextInputBuilder,
  ActionRowBuilder,
  ModalSubmitInteraction,
  Colors,
  User,
} from 'discord.js';
import {
  TextInputStyle,
} from 'discord-api-types/v10';
import { stripIndents } from 'common-tags';
import { SlashCommand } from '../../@types/commandDef';
// import {embedTemplate} from '../../utils/embedTemplate';
import { parseDuration } from '../../../global/utils/parseDuration';
import { moderate, linkThread } from '../../../global/commands/g.moderate';
import commandContext from '../../utils/context'; // eslint-disable-line
import { UserActionType } from '../../../global/@types/database';
import { getDiscordMember, getDiscordUser } from '../../utils/guildMemberLookup';
import { getUser } from '../../../global/utils/knex';
import { embedTemplate } from '../../utils/embedTemplate';

const F = f(__filename);

type ModAction = 'INFO' | 'BAN' | 'WARNING' | 'REPORT' | 'NOTE' | 'TIMEOUT' | 'UN-CONTRIBUTOR_BAN' | 'UN-HELPER_BAN' |
'FULL_BAN' | 'TICKET_BAN' | 'DISCORD_BOT_BAN' | 'BAN_EVASION' | 'UNDERBAN' | 'HELPER_BAN' | 'CONTRIBUTOR_BAN' | 'LINK' |
'UN-FULL_BAN' | 'UN-TICKET_BAN' | 'UN-DISCORD_BOT_BAN' | 'UN-BAN_EVASION' | 'UN-UNDERBAN' | 'UN-TIMEOUT' | 'KICK';

export const mod: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('mod')
    .setDescription('Moderation actions!')
    .addSubcommand(subcommand => subcommand
      .setDescription('Info on a user')
      .addStringOption(option => option
        .setName('target')
        .setDescription('User to get info on!')
        .setRequired(true))
      .setName('info'))
    .addSubcommand(subcommand => subcommand
      .setDescription('Ban a user')
      .addStringOption(option => option
        .setName('target')
        .setDescription('User to ban!')
        .setRequired(true))
      .addStringOption(option => option
        .setName('type')
        .setDescription('Type of ban')
        .setRequired(true)
        .addChoices(
          { name: 'Full Ban', value: 'FULL_BAN' },
          { name: 'Ticket Ban', value: 'TICKET_BAN' },
          { name: 'Discord Bot Ban', value: 'DISCORD_BOT_BAN' },
          { name: 'Ban Evasion', value: 'BAN_EVASION' },
          { name: 'Underban', value: 'UNDERBAN' },
          { name: 'Helper Ban', value: 'HELPER_BAN' },
          { name: 'Contributor Ban', value: 'CONTRIBUTOR_BAN' },
        ))
      .addStringOption(option => option
        .setName('toggle')
        .setDescription('On or off? (Default: ON)')
        .addChoices(
          { name: 'On', value: 'ON' },
          { name: 'Off', value: 'OFF' },
        ))
      .setName('ban'))
    .addSubcommand(subcommand => subcommand
      .setDescription('Warn a user')
      .addStringOption(option => option
        .setName('target')
        .setDescription('User to warn!')
        .setRequired(true))
      .setName('warning'))
    .addSubcommand(subcommand => subcommand
      .setDescription('Report a user')
      .addStringOption(option => option
        .setName('target')
        .setDescription('User to report!')
        .setRequired(true))
      .setName('report'))
    .addSubcommand(subcommand => subcommand
      .setDescription('Create a note about a user')
      .addStringOption(option => option
        .setName('target')
        .setDescription('User to note about!')
        .setRequired(true))
      .setName('note'))
    .addSubcommand(subcommand => subcommand
      .setDescription('Timeout a user')
      .addStringOption(option => option
        .setName('target')
        .setDescription('User to timeout!')
        .setRequired(true))
      .addStringOption(option => option
        .setName('toggle')
        .setDescription('On or off? (Default: ON)')
        .addChoices(
          { name: 'On', value: 'ON' },
          { name: 'Off', value: 'OFF' },
        ))
      .setName('timeout'))
    .addSubcommand(subcommand => subcommand
      .setDescription('Kick a user')
      .addStringOption(option => option
        .setName('target')
        .setDescription('User to kick!')
        .setRequired(true))
      .setName('kick'))
    .addSubcommand(subcommand => subcommand
      .setDescription('Link user to an existing thread')
      .addStringOption(option => option
        .setName('target')
        .setDescription('User to link!')
        .setRequired(true))
      .addBooleanOption(option => option
        .setName('override')
        .setDescription('Override existing threads in the DB'))
      .setName('link')),
  async execute(interaction:ChatInputCommandInteraction) {
    log.info(F, await commandContext(interaction));

    const actor = interaction.member as GuildMember;
    const targetString = interaction.options.getString('target', true);
    const targets = await getDiscordMember(interaction, targetString) as GuildMember[];

    if (targets.length > 1) {
      const embed = embedTemplate()
        .setColor(Colors.Red)
        .setTitle('Found more than one user with with that value!')
        .setDescription(stripIndents`
        "${targetString}" returned ${targets.length} results!

        Be more specific:
        > **Mention:** @Moonbear
        > **Tag:** moonbear#1234
        > **ID:** 9876581237
        > **Nickname:** MoonBear`);
      await interaction.reply({
        embeds: [embed],
        ephemeral: true,
      });
      return false;
    }

    if (targets.length === 0) {
      const embed = embedTemplate()
        .setColor(Colors.Red)
        .setTitle('Found no users with that value!')
        .setDescription(stripIndents`
          "${interaction.options.getString('user', true)}" returned no results!
  
          Be more specific:
          > **Mention:** @Moonbear
          > **Tag:** moonbear#1234
          > **ID:** 9876581237
          > **Nickname:** MoonBear`);
      await interaction.reply({
        embeds: [embed],
        ephemeral: true,
      });
      return false;
    }

    // This needs to also be a User because we can ban users who are not in the guild
    let target = targets[0] as GuildMember | User;

    let command = interaction.options.getSubcommand().toUpperCase() as ModAction;
    if (command === 'BAN') {
      command = interaction.options.getString('type', true) as ModAction;
    }

    if (command === 'LINK') {
      if (!interaction.channel?.isThread()
      || !interaction.channel.parentId
      || interaction.channel.parentId !== env.CHANNEL_MODERATORS) {
        await interaction.reply({
          content: 'This command can only be run inside of a mod thread!',
          ephemeral: true,
        });
        return false;
      }

      const override = interaction.options.getBoolean('override');

      let result: string | null;
      if (!target) {
        const userData = await getUser(targetString, null, null);
        if (!userData) {
          await interaction.reply({
            content: stripIndents`Failed to link thread, I could not find this user in the guild, \
and they do not exist in the database!`,
            ephemeral: true,
          }); // eslint-disable-line max-len
          return false;
        }
        result = await linkThread(targetString, interaction.channelId, override);
      } else {
        result = await linkThread(target.id, interaction.channelId, override);
      }

      if (result === null) {
        await interaction.editReply({ content: 'Successfully linked thread!' });
      } else {
        const existingThread = await interaction.client.channels.fetch(result);
        await interaction.reply({
          content: stripIndents`Failed to link thread, this user has an existing thread: ${existingThread}
          Use the override parameter if you're sure!`,
          ephemeral: true,
        });
      }

      return true;
    }

    if (!target && command !== 'FULL_BAN') {
      const embed = embedTemplate()
        .setColor(Colors.Red)
        .setTitle('Could not find that member/user!')
        .setDescription(stripIndents`
        "${targetString}" returned no results!

        Try again with:
        > **Mention:** @Moonbear
        > **Tag:** moonbear#1234
        > **ID:** 9876581237
        > **Nickname:** MoonBear`);
      await interaction.reply({
        embeds: [embed],
        ephemeral: true,
      });
      return false;
    }

    if (!target && command === 'FULL_BAN') {
      // Look up the user and use that as the target
      const discordUserData = await getDiscordUser(targetString);
      if (!discordUserData) {
        const embed = embedTemplate()
          .setColor(Colors.Red)
          .setTitle('Could not find that member/user!')
          .setDescription(stripIndents`
        "${targetString}" returned no results!

        Try again with:
        > **Mention:** @Moonbear
        > **Tag:** moonbear#1234
        > **ID:** 9876581237
        > **Nickname:** MoonBear`);
        await interaction.reply({
          embeds: [embed],
          ephemeral: true,
        });
        return false;
      }
      target = discordUserData;
    }

    const toggleCommands = 'FULL_BAN, TICKET_BAN, DISCORD_BOT_BAN, BAN_EVASION, UNDERBAN, TIMEOUT';
    // If the command is ban or timeout, get the value of toggle. If it's null, set it to 'ON'
    const toggle = toggleCommands.includes(command)
      ? interaction.options.getString('toggle') ?? 'ON'
      : null;

    if (toggle === 'OFF' && toggleCommands.includes(command)) {
      command = `UN-${command}` as ModAction;
    }

    log.debug(F, `${actor} ran ${command} on ${target}`);

    // log.debug(F, `${actor} ran ${command} on ${target}`);

    let verb = '';
    if (command === 'NOTE') verb = 'noting';
    // else if (command === 'REPORT') verb = 'reporting';
    else if (command === 'INFO') verb = 'getting info on';
    else if (command === 'WARNING') verb = 'warning';
    else if (command === 'KICK') verb = 'kicking';
    else if (command === 'TIMEOUT') verb = 'timing out';
    else if (command === 'FULL_BAN') verb = 'banning';
    else if (command === 'TICKET_BAN') verb = 'ticket banning';
    else if (command === 'DISCORD_BOT_BAN') verb = 'discord bot banning';
    else if (command === 'BAN_EVASION') verb = 'evasion banning';
    else if (command === 'UNDERBAN') verb = 'underbanning';
    else if (command === 'CONTRIBUTOR_BAN') verb = 'banning from Contributor on';
    else if (command === 'HELPER_BAN') verb = 'banning from Helper on';
    else if (command === 'UN-HELPER_BAN') verb = 'allowing Helper on ';
    else if (command === 'UN-CONTRIBUTOR_BAN') verb = 'allowing Contributor on ';
    else if (command === 'UN-TIMEOUT') verb = 'removing timeout on';
    else if (command === 'UN-FULL_BAN') verb = 'removing ban on';
    else if (command === 'UN-TICKET_BAN') verb = 'removing ticket ban on';
    else if (command === 'UN-DISCORD_BOT_BAN') verb = 'removing bot ban on';
    else if (command === 'UN-BAN_EVASION') verb = 'removing ban evasion on';
    else if (command === 'UN-UNDERBAN') verb = 'removing underban on';

    // log.debug(F, `Verb: ${verb}`);

    if (command === 'INFO') {
      log.debug(F, 'INFO command, deferring reply (ephemeral)');
      await interaction.deferReply({ ephemeral: true });
      await interaction.editReply(await moderate(
        actor,
        'INFO',
        target,
        null,
        null,
        null,
      ));
      return true;
    }

    const modal = new ModalBuilder()
      .setCustomId(`modModal~${command}~${interaction.id}`)
      .setTitle(`Tripbot ${command}`)
      .addComponents(new ActionRowBuilder<TextInputBuilder>()
        .addComponents(new TextInputBuilder()
          .setLabel(`Why are you ${verb} this user?`)
          .setStyle(TextInputStyle.Paragraph)
          .setPlaceholder('Tell other moderators why you\'re doing this')
          .setRequired(true)
          .setCustomId('internalNote')));

    // All commands except INFO, NOTE and REPORT can have a public reason sent to the user
    if (!'INFO NOTE REPORT'.includes(command)) {
      modal.addComponents(new ActionRowBuilder<TextInputBuilder>()
        .addComponents(new TextInputBuilder()
          .setLabel('What should we tell the user?')
          .setStyle(TextInputStyle.Paragraph)
          .setPlaceholder('Tell the user why you\'re doing this')
          .setRequired(command === 'WARNING')
          .setCustomId('description')));
    }
    // Only timeout and full ban can have a duration, but they're different, so separate.
    if (command === 'TIMEOUT') {
      modal.addComponents(new ActionRowBuilder<TextInputBuilder>()
        .addComponents(new TextInputBuilder()
          .setLabel('Timeout for how long?')
          .setStyle(TextInputStyle.Short)
          .setPlaceholder('4 days 3hrs 2 mins 30 seconds (Max 7 days, Default 7 days)')
          .setRequired(false)
          .setCustomId('duration')));
    }
    if (command === 'FULL_BAN') {
      modal.addComponents(new ActionRowBuilder<TextInputBuilder>()
        .addComponents(new TextInputBuilder()
          .setLabel('How many days of msg to remove?')
          .setStyle(TextInputStyle.Short)
          .setPlaceholder('4 days 3hrs 2 mins 30 seconds (Max 7 days, Default 0 days)')
          .setRequired(false)
          .setCustomId('days')));
    }

    await interaction.showModal(modal);

    const filter = (i:ModalSubmitInteraction) => i.customId.startsWith('modModal');
    interaction.awaitModalSubmit({ filter, time: 0 })
      .then(async i => {
        if (i.customId.split('~')[2] !== interaction.id) return;
        await i.deferReply({ ephemeral: true });
        const internalNote = i.fields.getTextInputValue('internalNote'); // eslint-disable-line

        // Only these commands actually have the description input, so only pull it if it exists
        const description = 'WARNING, KICK, TIMEOUT, FULL_BAN'.includes(command)  // eslint-disable-line
          ? i.fields.getTextInputValue('description')
          : null;

        let duration = null;
        if ('FULL_BAN, BAN_EVASION, UNDERBAN'.includes(command)) {
          // If the command is ban, then the input value exists, so pull that and try to parse it as an int
          let dayInput = parseInt(i.fields.getTextInputValue('days'), 10);

          // If no input was provided, default to 0 days
          if (Number.isNaN(dayInput)) dayInput = 0;

          // If the input is a string, or outside the bounds, tell the user and return
          if (dayInput && (dayInput < 0 || dayInput > 7)) {
            await i.editReply({ content: 'Ban days must be at least 0 and at most 7!' });
            return;
          }

          // Get the millisecond value of the input
          const days = await parseDuration(`${dayInput} days`);
          // log.debug(F, `days: ${days}`);
          duration = days;
        }

        if (command === 'TIMEOUT') {
          // If the command is timeout get the value
          let timeoutInput = i.fields.getTextInputValue('duration');

          // If the value is blank, set it to 7 days, the maximum
          if (timeoutInput === '') timeoutInput = '7 days';

          if (timeoutInput.length === 1) {
            // If the input is a single number, assume it's days
            const numberInput = parseInt(timeoutInput, 10);
            if (Number.isNaN(numberInput)) {
              await i.editReply({ content: 'Timeout must be a number!' });
              return;
            }
            if (numberInput < 0 || numberInput > 7) {
              await i.editReply({ content: 'Timeout must be between 0 and 7 days' });
              return;
            }
            timeoutInput = `${timeoutInput} days`;
          }

          // log.debug(F, `timeoutInput: ${timeoutInput}`);

          const timeout = timeoutInput !== null
            ? await parseDuration(timeoutInput)
            : null;

          // If timeout is not null, but is outside the bounds, tell the user and return
          if (timeout && (timeout < 0 || timeout > 7 * 24 * 60 * 60 * 1000)) {
            await i.editReply({ content: 'Timeout must be between 0 and 7 days' });
            return;
          }

          // log.debug(F, `timeout: ${timeout}`);
          duration = timeout;
        }

        await i.editReply(await moderate(
          actor,
          i.customId.split('~')[1] as UserActionType,
          target,
          internalNote,
          description,
          duration,
        ));
        // i.editReply({ embeds: [embedTemplate()] }); // For testing
      });

    return false;
  },
};

export default mod;
