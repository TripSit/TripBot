/* eslint-disable @typescript-eslint/no-use-before-define */
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  Colors,
  EmbedBuilder,
  InteractionEditReplyOptions,
  Message,
  ModalBuilder,
  ModalSubmitInteraction,
  SlashCommandBuilder,
  TextChannel,
  TextInputBuilder,
  TextInputStyle,
  time,
} from 'discord.js';
import { stripIndents } from 'common-tags';
import { DateTime } from 'luxon';
import { SlashCommand } from '../../@types/commandDef';
import commandContext from '../../utils/context';

const F = f(__filename);

/* TODO notes:
Add seer role
Add hunter role
Add timers to each phase
*/

/* How to play the werewolf game

    We use two channels: #town and #wolves.
    The #town channel is where everyone can talk.
    The #wolves channel is where the wolves can talk.
    The #wolves channel is hidden from everyone except the wolves.
    This game does not use roles, because that would be obvious who the wolves are.
    Instead, the bot will change permissions on the channel manually

    The game is played in different phases:

    0.  lobby / start
    In this phase we're looking for players to join the game.
    Someone uses the /werewolf start to initialize the game.
    This posts a message in the channel with various buttons:
    - Join the game
    - Leave the game
    - Start the game

    Anyone can start the game once there are at least 4 players.
    When the game starts the bot records who is playing and sends a DM to each player with their role.
    The bot will change the permissions on an existing #wolves channel to only allow the wolf players to see it.
    Then we move into the night phase.

    1.  night
    The bot posts a message in the #town channel that it's night time, no one can talk, and a timer of 1 minute.
    The bot posts a message in the #wolves channel with a button for each user who can be killed.
    The wolves have 1 minute to decide to to kill.
    At the end of 1 minute, we move into the day phase.

    2.  morning
    Tally up the votes and determine who is killed by the wolves.
    The bot posts a message in the #town channel that day has come and that <user> was killed in the night,
    and that they can now vote on who should be hung as a wolf.
    The message includes a timer of 4 minutes and says they can now discuss and pick who they think is the wolf.
    The message includes buttons of each person playing the game.
    The bot changes permissions on the #town channel so that everyone but those killed in previous rounds
    can speak in it.
    After 4 minutes:
      The bot posts a message that it's getting late and if we're going to hang someone we need to make a decision now.
      The message includes a timer of 1 minute.
      The message includes buttons of each person playing the game.
      The bot changes permissions on the #town channel so that no one can speak in it.
    The morning phase ends after 5 minutes, or everyone has cast their vote for a single person.

    3. afternoon
    Whoever was given the most votes in the previous round is hung.
    The bot posts a message in the #town channel that <user> was hung, and that they were a <role>.
    The message contains a 30 second countdown timer.
    If the hung person was a wolf (and there are no other wolves), the game goes to the End phase.
    If the hung person was a person, and there are no other persons, the game goes to the End phase.
    Otherwise, the game goes back to the night phase.

    5.  end
    The wolves win if there are no persons left.
    The town wins if there are no wolves left.
    The bot posts a message in the #town channel that the game is over and who won.

    # Commands

    The bot will utilize the following commands:

    /werewolf restart
    This will show the werewolf message in the channel.
    This should only need to be done once, otherwise the previous game will have a "new game" button.

    /werewolf debug
    This will show the werewolf message in the channel, but with debug buttons for Moonbear to use.
    */

const debug = true;

// Set the phase end time to 1 minute from now
let phaseLength = 1;
if (debug) {
  phaseLength = 0.2;
}

type GameState = {
  players: string[];
  wolves: string[];
  killed: string[];
  hung: string[];
  phase: {
    name: 'lobby' | 'night' | 'morning' | 'afternoon' | 'end',
    endTime: Date,
  },
  // message: {
  //   town: InteractionResponse<boolean>;
  //   wolves: Message<boolean>;
  // },
  diaryEntries: Record<string, string[]>;
  day: number;
  votes: Record<string, number>;

};

// Initialize a temporary database that will be used to store the game state for each channel
const gameStates = {} as Record<string, GameState>;

const requiredPlayers = debug ? 2 : 3;

async function phaseLobby(
  message:Message<boolean>,
):Promise<InteractionEditReplyOptions> {
  // Get the current game state for this channel
  const gameState = gameStates[message.channelId];

  log.debug(F, `phaseLobby: ${JSON.stringify(gameState, null, 2)}`);

  const buttons = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('werewolfJoin')
        .setLabel('Join')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('werewolfLeave')
        .setLabel('Leave')
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId('werewolfHow')
        .setLabel('How To Play')
        .setStyle(ButtonStyle.Secondary),
    );

  if (gameState.players.length >= requiredPlayers) {
    buttons.addComponents(
      new ButtonBuilder()
        .setCustomId('werewolfStart')
        .setLabel('Start')
        .setStyle(ButtonStyle.Success),
    );
  }

  // For each player, get the discord member info, and make a list of discord nicknames
  const playerNames = gameState.players.map(player => {
    const member = message.guild?.members.cache.get(player);
    if (member) {
      return member.displayName;
    }
    return player;
  });
  playerNames.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
  const playerNamesString = `:\n* ${playerNames.join('\n * ')}`;

  const players = `There are currently ${gameState.players.length} players in the \
  game${gameState.players.length > 0 ? playerNamesString : '.'}`;

  const gameStatus = gameState.players.length >= requiredPlayers
    ? 'You can start the game now!'
    : `You need at least ${requiredPlayers} players to start the game.`;

  return {
    embeds: [
      new EmbedBuilder()
        .setTitle('Werewolf Lobby')
        .setColor(Colors.Blurple)
        .setDescription(stripIndents`
          Welcome to the werewolf game lobby.

          ${players}

          ${gameStatus}
        `),
    ],
    components: [buttons],
  };
}

async function phaseNight(
  message:Message<boolean>,
):Promise<void> {
  // Get the current game state for this channel
  const gameState = gameStates[message.channelId];

  log.debug(F, `phaseNight: ${JSON.stringify(gameState)}`);

  const buttons = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('werewolfDiary')
        .setLabel('Diary')
        .setStyle(ButtonStyle.Primary),
    );

  await message.edit({
    embeds: [new EmbedBuilder()
      .setTitle('Is is now nighttime.')
      .setColor(Colors.Blurple)
      .setDescription(`
      The town is now sleeping peacefully. 
      
      You can write in your diary, but otherwise you cannot talk.

      Morning will come in ${time(gameState.phase.endTime, 'R')}.
      `)],
    components: [buttons],
  });

  const wolfMentions = gameState.wolves.map(wolf => `<@${wolf}>`).join(' ');
  const wolfPack = gameState.wolves.length > 1 ? 'wolves' : 'wolf';
  const wolfEmbed = new EmbedBuilder()
    .setTitle('Wolf Den')
    .setColor(Colors.Blurple)
    .setDescription(stripIndents`
      You are the ${wolfPack}.
      You can talk in this channel with other wolves.
      Use the buttons below to decide who to kill.
      Only the user with the most votes will be killed.
      If there is a tie, no one is killed.
      If there are no votes, no one is killed.

      Morning will come in ${time(gameState.phase.endTime, 'R')}.
    `);

  // Get a list of gameState.players that are not gameState.wolves
  const townsfolk = gameState.players.filter(player => !gameState.wolves.includes(player));
  log.debug(F, `Townsfolk: ${townsfolk}`);

  const wolfButtons = new ActionRowBuilder<ButtonBuilder>();
  if (townsfolk.length > 0) {
    // For each of those townsfolk, add a button to wolfButtons
    const addButtons = townsfolk.map(async player => {
      const member = await message.guild?.members.fetch(player);
      wolfButtons.addComponents(
        new ButtonBuilder()
          .setCustomId(`werewolfKill~${player}`)
          .setLabel(`Kill ${member?.displayName}`)
          .setStyle(ButtonStyle.Danger),
      );
    });
    await Promise.all(addButtons);
  }

  // Get the Wolf Den channel
  const wolfDen = await message.guild?.channels.fetch(env.CHANNEL_WOLFDEN) as TextChannel;

  // Send a message to the channel and ping the wolves
  const wolfMessage = await wolfDen.send({
    content: `${wolfMentions}`,
    embeds: [wolfEmbed],
    components: [wolfButtons],
  });

  setTimeout(async () => {
    gameState.phase.endTime = DateTime.now().plus({ minutes: phaseLength }).toJSDate();
    await phaseMorning(message);
    const wolfMorningEmbed = new EmbedBuilder()
      .setTitle('Wolf Den')
      .setColor(Colors.Blurple)
      .setDescription(stripIndents`
      It is now morning, and you retreat to the safety of home to pretend to be a normal villager.

      Afternoon will come ${time(gameState.phase.endTime, 'R')}.
    `);
    await wolfMessage.edit({
      content: '',
      embeds: [wolfMorningEmbed],
    });
  }, gameState.phase.endTime.getTime() - DateTime.now().toJSDate().getTime());
}

async function phaseMorning(
  message:Message<boolean>,
):Promise<void> {
  // Get the current game state for this channel
  const gameState = gameStates[message.channelId];

  const diaryEntries = gameState.diaryEntries['177537158419054592'];
  gameState.killed.push('177537158419054592');
  const victim = gameState.killed[gameState.killed.length - 1];
  const victimMember = await message.guild?.members.fetch(victim);
  if (!victimMember) {
    log.error(F, `Could not find member ${victim}`);
    return;
  }

  const buttons = new ActionRowBuilder<ButtonBuilder>();
  // For each of those townsfolk, add a button to wolfButtons
  const addButtons = gameState.players.map(async player => {
    const member = await message.guild?.members.fetch(player);
    buttons.addComponents(
      new ButtonBuilder()
        .setCustomId(`werewolfHang~${player}`)
        .setLabel(`Hang ${member?.displayName}`)
        .setStyle(ButtonStyle.Danger),
    );
  });
  await Promise.all(addButtons);

  await message.edit({
    embeds: [new EmbedBuilder()
      .setTitle('Morning')
      .setColor(Colors.Blurple)
      .setDescription(`The town awakens to find out that ${victimMember.displayName} was killed in the night.
      
      Their diary contained:

      ${diaryEntries?.join('\n * ')}

      Discuss among the town who you think the wolf is, and then vote on who to hang.

      The debate will end ${time(gameState.phase.endTime, 'R')}.
        
      If there is no agreement, the person with the most votes will be hung.

      If there is a tie, or there are no votes, no one will be hung.
      `)],
    components: [buttons],
  });

  setTimeout(async () => {
    gameState.phase.endTime = DateTime.now().plus({ minutes: phaseLength }).toJSDate();
    await phaseAfternoon(message);
  }, gameState.phase.endTime.getTime() - DateTime.now().toJSDate().getTime());
}

async function phaseAfternoon(
  message:Message<boolean>,
):Promise<void> {
  // Get the current game state for this channel
  const gameState = gameStates[message.channelId];

  log.debug(F, `phaseAfternoon: ${JSON.stringify(gameState, null, 2)}`);

  const buttons = new ActionRowBuilder<ButtonBuilder>();
  // For each of those townsfolk, add a button to wolfButtons
  const addButtons = gameState.players.map(async player => {
    const member = await message.guild?.members.fetch(player);
    buttons.addComponents(
      new ButtonBuilder()
        .setCustomId(`werewolfHang~${player}`)
        .setLabel(`Hang ${member?.displayName}`)
        .setStyle(ButtonStyle.Danger),
    );
  });
  await Promise.all(addButtons);

  const newMessage = await message.channel.send({
    embeds: [
      new EmbedBuilder()
        .setTitle('Afternoon')
        .setColor(Colors.Blurple)
        .setDescription(`The sun is setting.

        Voting will end ${time(gameState.phase.endTime, 'R')}.
        
        If there is no agreement, the person with the most votes will be hung.

        If there is a tie, or there are no votes, no one will be hung.
        `),
    ],
    components: [buttons],
  });

  setTimeout(async () => {
    gameState.phase.endTime = DateTime.now().plus({ minutes: phaseLength }).toJSDate();
    await phaseEvening(newMessage);
  }, gameState.phase.endTime.getTime() - DateTime.now().toJSDate().getTime());
}

async function phaseEvening(
  message:Message<boolean>,
):Promise<void> {
  // Get the current game state for this channel
  const gameState = gameStates[message.channelId];

  log.debug(F, `phaseEvening: ${JSON.stringify(gameState, null, 2)}`);
  const diaryEntries = gameState.diaryEntries['177537158419054592'];

  gameState.killed.push('177537158419054592');
  const suspect = gameState.hung[gameState.hung.length - 1];
  const suspectMember = await message.guild?.members.fetch(suspect);
  if (!suspectMember) {
    log.error(F, `Could not find member ${suspect}`);
    return;
  }

  await message.edit({
    embeds: [new EmbedBuilder()
      .setTitle('Evening')
      .setColor(Colors.Blurple)
      .setDescription(`The town solemnly takes ${suspectMember.displayName} to the gallows.

      ${gameState.wolves.includes(suspect) ? 'They were a wolf!' : 'They were a person.'}
      
      Their diary contained:

      ${diaryEntries?.join('\n * ')}

      Night will come ${time(gameState.phase.endTime, 'R')}.
      `)],
    components: [],
  });

  setTimeout(async () => {
    gameState.phase.endTime = DateTime.now().plus({ minutes: phaseLength }).toJSDate();
    if (gameState.players.length === 1) {
      await phaseEnd(message);
    } else {
      await phaseNight(message);
    }
  }, gameState.phase.endTime.getTime() - DateTime.now().toJSDate().getTime());
}

async function phaseEnd(
  message:Message<boolean>,
):Promise<void> {
  // Get the current game state for this channel
  const gameState = gameStates[message.channelId];

  log.debug(F, `phaseEnd: ${JSON.stringify(gameState)}`);

  await message.edit({
    embeds: [
      new EmbedBuilder()
        .setTitle('Werewolf')
        .setColor(Colors.Blurple)
        .setDescription(`The game is over and someone has won!

        This page will contain stats about the game. For now, it's just a placeholder.
        
        A new lobby will be created ${time(gameState.phase.endTime, 'R')}.
        `),
    ],
    components: [],
  });

  setTimeout(async () => {
    gameState.phase.endTime = DateTime.now().plus({ minutes: phaseLength }).toJSDate();
    await phaseLobby(message);
  }, gameState.phase.endTime.getTime() - DateTime.now().toJSDate().getTime());
}

export async function werewolfJoin(
  interaction:ButtonInteraction,
):Promise<InteractionEditReplyOptions> {
  log.debug(F, 'werewolfJoin');

  // Get the current game state for this channel
  let gameState = gameStates[interaction.channelId];

  // If there is no game state, initialize it
  if (!gameState) {
    gameStates[interaction.channelId] = {
      players: [],
      wolves: [],
      killed: [],
      hung: [],
      phase: {
        name: 'lobby',
        endTime: DateTime.now().toJSDate(),
      },
      // message: {
      //   town: message,
      //   wolves: {} as Message<true>,
      // },
      diaryEntries: {},
      day: 0,
      votes: {},
    };
    gameState = gameStates[interaction.channelId];
  }

  // Add player to the game, if they aren't already in it
  if (!gameState.players.includes(interaction.user.id)) {
    gameState.players.push(interaction.user.id);
  }

  return phaseLobby(interaction.message);
}

export async function werewolfLeave(
  interaction:ButtonInteraction,
):Promise<InteractionEditReplyOptions> {
  log.debug(F, 'werewolfLeave');

  // Get the current game state for this channel
  let gameState = gameStates[interaction.channelId];

  // If there is no game state, initialize it
  if (!gameState) {
    gameStates[interaction.channelId] = {
      players: [],
      wolves: [],
      killed: [],
      hung: [],
      phase: {
        name: 'lobby',
        endTime: DateTime.now().toJSDate(),
      },
      // message: {
      //   town: message,
      //   wolves: {} as Message<true>,
      // },
      diaryEntries: {},
      day: 0,
      votes: {},
    };
    gameState = gameStates[interaction.channelId];
  }

  // Remove player from the game, if they are already in it
  if (gameState.players.includes(interaction.user.id)) {
    gameState.players = gameState.players.filter(player => player !== interaction.user.id);
  }

  log.debug(F, `gameState: ${JSON.stringify(gameState, null, 2)}`);
  return phaseLobby(interaction.message);
}

export async function werewolfHow(
  interaction:ButtonInteraction,
):Promise<void> {
  log.debug(F, 'werewolfHow');

  const embed = new EmbedBuilder()
    .setTitle('Werewolf')
    .setColor(Colors.Blurple)
    .setDescription(stripIndents`
      The werewolf game is a game of deception and deduction.
      The goal of the game is for the town to kill all the wolves, and for the wolves to kill all the town.
      The game is played in rounds, and each round has two phases: night and day.

      During the night phase, the wolves will decide who to kill.
      During the day phase, the town will decide who to hang.

      The game ends when either all the wolves are dead, or all the town is dead.
    `);

  interaction.reply({
    embeds: [embed],
    ephemeral: true,
  });
}

export async function werewolfStart(
  interaction:ButtonInteraction,
):Promise<void> {
  log.debug(F, 'werewolfStart');

  await interaction.deferUpdate();

  // Get the current game state for this channel
  const gameState = gameStates[interaction.channelId];

  // Generate wolves from the players
  // The rules are: 1 wolf for every 3 players, and 2 wolves for 6 players
  const numWolves = gameState.players.length > 6 ? 2 : 1;
  log.debug(F, `numWolves: ${numWolves}`);

  // Shuffle the players
  const shuffledPlayers = [...gameState.players];
  shuffledPlayers.sort(() => Math.random() - 0.5);

  // Assign roles to the players
  const wolves = shuffledPlayers.slice(0, numWolves);
  log.debug(F, `wolves: ${wolves}`);

  // Save the wolves to the game state
  gameState.wolves = wolves;

  // Get the Wolf Den channel
  const wolfDen = await interaction.guild?.channels.fetch(env.CHANNEL_WOLFDEN) as TextChannel;

  // Clear the messages in the wolfden channel, if they were not already cleared
  const wolfDenMessages = await wolfDen.messages.fetch();
  await wolfDen.bulkDelete(wolfDenMessages);

  // Set the gameState phase to 'night'
  gameState.phase.name = 'night';

  // Transition into the night phase

  gameState.phase.endTime = DateTime.now().plus({ minutes: phaseLength }).toJSDate();

  gameStates[interaction.channelId] = gameState;

  await phaseNight(interaction.message);
}

export async function werewolfDiary(
  interaction:ButtonInteraction,
) {
  log.debug(F, 'werewolfDiary');

  if (!interaction.channel) return;

  // Get the current game state for this channel
  const gameState = gameStates[interaction.channelId];

  // Display a modal to the user asking them for their diary entry.

  // Create the modal
  const modal = new ModalBuilder()
    .setCustomId(`werewolfDiary}~${interaction.id}`)
    .setTitle(`My Diary on Night ${gameState.day + 1}`)
    .addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder()
      .setLabel('Dear Diary,')
      .setStyle(TextInputStyle.Paragraph)
      .setCustomId('werewolfDiaryEntry')
      .setRequired(true)));

  // Show the modal to the user
  await interaction.showModal(modal);

  // Collect a modal submit interaction
  const filter = (i:ModalSubmitInteraction) => i.customId.includes('werewolfDiary');
  interaction.awaitModalSubmit({ filter, time: 0 })
    .then(async i => {
      if (i.customId.split('~')[1] !== interaction.id) return;
      // Get whatever they sent in the modal
      const diaryEntry = i.fields.getTextInputValue('werewolfDiaryEntry');
      log.debug(F, `diaryEntry: ${diaryEntry}`);

      // Add the diary entry to the gameState
      const diaryEntries = gameState.diaryEntries[interaction.user.id];
      if (!diaryEntries) {
        gameState.diaryEntries[interaction.user.id] = [diaryEntry];
      } else {
        gameState.diaryEntries[interaction.user.id].push(diaryEntry);
      }

      log.debug(F, `gameState: ${JSON.stringify(gameState, null, 2)}`);

      await i.reply({
        content: 'You have written in your diary, others will be able to read it if something happens to you.',
        ephemeral: true,
      });
    });
}

export const werewolf: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('werewolf')
    .setDescription('Werewolf game!'),
  async execute(interaction) {
    log.info(F, await commandContext(interaction));
    await interaction.deferReply();
    if (!interaction.channel) {
      await interaction.editReply({ content: 'This command must be used in a channel.' });
      return false;
    }

    // Get the current game state for this channel
    let gameState = gameStates[interaction.channel.id];

    // If there is no game state, initialize it
    if (!gameState) {
      gameStates[interaction.channel.id] = {
        players: [],
        wolves: [],
        killed: [],
        hung: [],
        phase: {
          name: 'lobby',
          endTime: DateTime.now().toJSDate(),
        },
        diaryEntries: {},
        day: 0,
        votes: {},
      };
      gameState = gameStates[interaction.channel.id];
    }

    if (gameState.phase.name === 'lobby') {
      await interaction.editReply(await phaseLobby(await interaction.fetchReply()));
    } else {
      await interaction.editReply({ content: 'A game is already in progress!' });
    }
    return true;
  },
};

export default werewolf;
