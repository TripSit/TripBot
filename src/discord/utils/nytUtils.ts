// eslint-disable-line
import { format, parse } from 'date-fns';

const F = f(__filename);

// TODO: ADD namespaces for each game
// TODO: Store the full game result in the schema
// TODO: Be able to recall a user's last result in `/nyt user`

async function submissionPayout(userId: string, payout: number) {
  // Get the user's current personaData
  // Check get fresh persona data
  const userData = await db.users.upsert({
    where: {
      discord_id: userId,
    },
    create: {
      discord_id: userId,
    },
    update: {},
  });
  const personaData = await db.personas.upsert({
    where: {
      user_id: userData.id,
    },
    create: {
      user_id: userData.id,
    },
    update: {},
  });

  personaData.tokens += payout;
  await db.personas.upsert({
    where: {
      user_id: userData.id,
    },
    create: personaData,
    update: personaData,
  });
}

export namespace Wordle {
  export async function todaysPuzzles() {
  // Get the current date and time in UTC
    const currentDate = new Date();

    // Add 14 hours to the current UTC time to get the date in UTC+14
    currentDate.setUTCHours(currentDate.getUTCHours() + 14);

    // The start date of Wordle
    const startDate = new Date('2021-06-19T00:00:00Z');

    // The number of milliseconds in a day
    const millisecondsPerDay = 1000 * 60 * 60 * 24;

    // The valid puzzle number is the number of days since the start date
    const validPuzzleNumber = Math.floor((currentDate.getTime() - startDate.getTime()) / millisecondsPerDay);

    log.debug(F, `Valid Wordle puzzle numbers: ${validPuzzleNumber} (UTC+14 Newest Puzzle), ${validPuzzleNumber - 1} (Rest of World), ${validPuzzleNumber - 2} (Yesterday)`);
    return [validPuzzleNumber, validPuzzleNumber - 1, validPuzzleNumber - 2];
  }

  export async function getServerStats(puzzleNumber: number) {
  // Find all the scores for the given puzzle
    const scores = await db.wordle_scores.findMany({
      where: {
        puzzle: puzzleNumber,
      },
    });

    if (!scores || scores.length === 0) {
      return null;
    }

    // Initialize stats
    const stats = {
      gamesPlayed: 0,
      winRate: 0,
    };

    stats.gamesPlayed = scores.length;
    const wins = scores.filter(score => score.score > 0).length;
    stats.winRate = wins / stats.gamesPlayed;
    // Find the frequency of each score
    const scoreFrequency = scores.reduce((acc: { [key: number]: number }, score) => {
      if (!acc[score.score]) {
        acc[score.score] = 0;
      }
      acc[score.score] += 1;
      return acc;
    }, {} as { [key: number]: number });
    log.debug(F, `Wordle score frequency: ${JSON.stringify(scoreFrequency)}`);
    return { stats, scoreFrequency };
  }

  export async function getUserStats(discordId: string) {
  // Find the user with the given discordId
    const user = await db.users.findFirst({
      where: {
        discord_id: discordId,
      },
    });

    // If no user is found, throw an error
    if (!user) {
      throw new Error(`No user found with discordId: ${discordId}`);
    }

    // Find all the scores for the user
    const scores = await db.wordle_scores.findMany({
      where: {
        user_id: user.id,
      },
    });

    if (!scores || scores.length === 0) {
      return null;
    }

    // Initialize stats
    const stats = {
      gamesPlayed: 0,
      winRate: 0,
      currentStreak: 0,
      bestStreak: 0,
      submissionStreak: 0,
      lastPlayed: 0,
      lastGrid: '',
      lastScore: 0,
    };

    // Find the total number of games played by counting the number of scores
    stats.gamesPlayed = scores.length;
    // Find the number of win rate by counting the number of scores with a score greater than 0 and dividing by the total number of games played
    const wins = scores.filter(score => score.score > 0).length;
    stats.winRate = wins / stats.gamesPlayed;
    // Find the current streak by counting the number of consecutive wins (based off the puzzle number)
    // Sort the scores by puzzle number in ascending order
    scores.sort((a, b) => a.puzzle - b.puzzle);
    // Initialize current streak, max streak, and submission streak
    let currentStreak = 0;
    let maxStreak = 0;
    let submissionStreak = 0;

    // Iterate over the sorted scores
    for (let i = 0; i < scores.length; i += 1) {
      // If the score is greater than 0 and the puzzle numbers are consecutive or it's the first puzzle, increment the current streak
      if (scores[i].score > 0 && (i === 0 || scores[i].puzzle === scores[i - 1].puzzle + 1)) {
        currentStreak += 1;
      } else {
        // If the score is 0 or the puzzle numbers are not consecutive, reset the current streak
        currentStreak = 0;
      }

      // If the puzzle numbers are consecutive or it's the first puzzle, increment the submission streak
      if (i === 0 || scores[i].puzzle === scores[i - 1].puzzle + 1) {
        submissionStreak += 1;
      } else {
        // If the puzzle numbers are not consecutive, reset the submission streak
        submissionStreak = 0;
      }

      // If the current streak is greater than the max streak, update the max streak
      if (currentStreak > maxStreak) {
        maxStreak = currentStreak;
      }
    }

    // Set the current streak, best streak, and submission streak in the stats
    stats.currentStreak = currentStreak;
    stats.bestStreak = maxStreak;
    stats.submissionStreak = submissionStreak;

    // Find the last played puzzle number, grid and score
    stats.lastPlayed = scores[scores.length - 1].puzzle;
    stats.lastGrid = scores[scores.length - 1].grid;
    stats.lastScore = scores[scores.length - 1].score;

    // Find the frequency of each score
    const scoreFrequency = scores.reduce((acc: { [key: number]: number }, score) => {
      if (!acc[score.score]) {
        acc[score.score] = 0;
      }
      acc[score.score] += 1;
      return acc;
    }, {} as { [key: number]: number });
    log.debug(F, `Wordle score frequency: ${JSON.stringify(scoreFrequency)}`);
    return { stats, scoreFrequency };
  }

  export async function updateStats(discordId: string, newStats: { grid: string, score: number, puzzle: number }) {
  // Find the user with the given discordId
    const user = await db.users.findFirst({
      where: {
        discord_id: discordId,
      },
    });

    // If no user is found, throw an error
    if (!user) {
      throw new Error(`No user found with discordId: ${discordId}`);
    }

    const newPuzzles = await Wordle.todaysPuzzles();
    // Try to find an existing wordle_scores record for the given user and puzzle
    const existingScore = await db.wordle_scores.findFirst({
      where: {
        user_id: user.id,
        puzzle: newStats.puzzle,
      },
    });

    if (existingScore) {
    // If a record is found, update it with the new score
      await db.wordle_scores.update({
        where: {
          id: existingScore.id,
        },
        data: {
          score: newStats.score,
          grid: newStats.grid,
        },
      });
      log.debug(F, `Wordle score updated for user: ${discordId}`);
    } else {
    // If no record is found, create a new one
      await db.wordle_scores.create({
        data: {
          user_id: user.id,
          ...newStats,
        },
      });
      log.debug(F, `Wordle score created for user: ${discordId}`);
      // If the puzzle is new, reward with tokens
      if (newPuzzles.includes(newStats.puzzle)) {
        await submissionPayout(discordId, 25);
      }
    }
  }

  export async function process(userId: string, messageContent: string): Promise<boolean> {
    log.debug(F, `Processing message for Wordle score: ${messageContent}`);
    // Regular expression to match "Wordle", a number including commas, and a digit or 'X' /6
    const wordleScorePattern = /(Wordle\s([\d,]+)\s(\d|X)\/6)/;
    const match = messageContent.match(wordleScorePattern);

    if (match) {
    // VALIDATE THAT THE WORDLE MAKES SENSE AND IS NOT EDITED
    // Prevent users from submitting puzzles from the future
      const puzzleNumber = parseInt(match[2].replace(',', ''), 10);
      const validPuzzleNumbers = await Wordle.todaysPuzzles();
      if (!validPuzzleNumbers.includes(puzzleNumber)) {
        log.debug(F, `Invalid Wordle score found (Puzzle number is from the future): ${match[1]}`);
        return false;
      }
      // Ensure the score is not more than 6
      const score = match[3] === 'X' ? 0 : parseInt(match[3], 10);
      if (score > 6) {
        log.debug(F, `Invalid Wordle score found (Score cannot be more than 6): ${match[1]}`);
        return false;
      }
      // Split the message content into lines
      const lines = messageContent.split('\n');
      // Filter the lines to only include those with squares
      const squareLines = lines.filter(line => /(⬛|⬜|🟨|🟩){5}/.test(line));
      // Stop counting lines as soon as you encounter a line that doesn't match the wordle pattern
      for (let i = 0; i < squareLines.length; i += 1) {
      // Ensure each line only contains 5 squares
        const squares = squareLines[i].match(/(⬛|⬜|🟨|🟩)/g);
        if (!squares || squares.length !== 5) {
          log.debug(F, `Invalid Wordle score found (Invalid squares per line): ${match[1]}`);
          return false;
        }
        if (!/(⬛|⬜|🟨|🟩){5}/.test(squareLines[i])) {
          break;
        }
      }
      // If the Wordle is completed (Not X/6)
      if (score > 0) {
      // Check that the score matches the number of lines of squares
        if (score !== 0 && score !== squareLines.length) {
          log.debug(F, `Invalid Wordle score found (Invalid number of rows for score): ${match[1]}`);
          return false;
        }
        // Check that the last line of squares is all green (win line)
      if (!squareLines[squareLines.length - 1].includes('🟩🟩🟩🟩🟩')) { // eslint-disable-line
          log.debug(F, `Invalid Wordle score found (Game lost but listed as win): ${match[1]}`);
          return false;
        }
        // Check that there is only one "win" line
        const greenLines = squareLines.filter(line => line.includes('🟩🟩🟩🟩🟩'));
        if (greenLines.length > 1) {
          log.debug(F, `Invalid Wordle score found (Multiple win lines): ${match[1]}`);
          return false;
        }
      }
      // If the Wordle was failed
      if (score === 0) {
      // Check that there are 6 lines
        if (squareLines.length !== 6) {
          log.debug(F, `Invalid Wordle score found (Rows vs Failure): ${match[1]}`);
          return false;
        }
        // Check that there is no win line
        if (squareLines.includes('🟩🟩🟩🟩🟩')) {
          log.debug(F, `Invalid Wordle score found (Game won but listed as failure): ${match[1]}`);
          return false;
        }
      }
      log.debug(F, `Wordle score found: ${match[1]}`);
      // Get the game "grid" as a simple line of emojis
      const grid = squareLines.map(line => line.replace(/⬜/g, '⬛')).join('');
      await Wordle.updateStats(userId, { grid, score, puzzle: puzzleNumber });
      return true;
    }
    return false;
  }
}

export namespace Connections {
  export async function todaysPuzzles() {
  // Get the current date and time in UTC
    const currentDate = new Date();

    // Add 14 hours to the current UTC time to get the date in UTC+14
    currentDate.setUTCHours(currentDate.getUTCHours() + 14);

    // The start date of Wordle
    const startDate = new Date('2023-06-11T00:00:00Z');

    // The number of milliseconds in a day
    const millisecondsPerDay = 1000 * 60 * 60 * 24;

    // The valid puzzle number is the number of days since the start date
    const validPuzzleNumber = Math.floor((currentDate.getTime() - startDate.getTime()) / millisecondsPerDay);

    log.debug(F, `Valid Wordle puzzle numbers: ${validPuzzleNumber} (UTC+14 Newest Puzzle), ${validPuzzleNumber - 1} (Rest of World), ${validPuzzleNumber - 2} (Yesterday)`);
    return [validPuzzleNumber, validPuzzleNumber - 1, validPuzzleNumber - 2];
  }

  export async function getServerStats(puzzleNumber: number) {
  // Find all the scores for the given puzzle
    const scores = await db.connections_scores.findMany({
      where: {
        puzzle: puzzleNumber,
      },
    });

    if (!scores || scores.length === 0) {
      return null;
    }

    // Initialize stats
    const stats = {
      gamesPlayed: 0,
      winRate: 0,
    };

    stats.gamesPlayed = scores.length;
    const wins = scores.filter(score => score.score < 4).length;
    stats.winRate = wins / stats.gamesPlayed;
    // Find the frequency of each score
    const scoreFrequency = scores.reduce((acc: { [key: number]: number }, score) => {
      if (!acc[score.score]) {
        acc[score.score] = 0;
      }
      acc[score.score] += 1;
      return acc;
    }, {} as { [key: number]: number });

    return { stats, scoreFrequency };
  }

  export async function getUserStats(discordId: string) {
  // Find the user with the given discordId
    const user = await db.users.findFirst({
      where: {
        discord_id: discordId,
      },
    });

    // If no user is found, throw an error
    if (!user) {
      throw new Error(`No user found with discordId: ${discordId}`);
    }

    // Find all the scores for the user
    const scores = await db.connections_scores.findMany({
      where: {
        user_id: user.id,
      },
    });

    if (!scores || scores.length === 0) {
      return null;
    }

    // Initialize stats
    const stats = {
      gamesPlayed: 0,
      winRate: 0,
      currentStreak: 0,
      bestStreak: 0,
      submissionStreak: 0,
      lastPlayed: 0,
      lastGrid: '',
      lastScore: 0,
    };

    // Find the total number of games played by counting the number of scores
    stats.gamesPlayed = scores.length;
    // Find the number of win rate by counting the number of scores with a score greater than 0 and dividing by the total number of games played
    const wins = scores.filter(score => score.score < 4).length;
    stats.winRate = wins / stats.gamesPlayed;
    // Sort the scores by puzzle number in ascending order
    scores.sort((a, b) => a.puzzle - b.puzzle);
    // Initialize current streak and max streak
    let currentStreak = 0;
    let maxStreak = 0;
    let submissionStreak = 0;
    // Iterate over the sorted scores
    for (let i = 0; i < scores.length; i += 1) {
    // If the score is greater than 0 and the puzzle numbers are consecutive or it's the first puzzle, increment the current streak
      if (scores[i].score < 4 && (i === 0 || scores[i].puzzle === scores[i - 1].puzzle + 1)) {
        currentStreak += 1;
      } else {
      // If the score is 0 or the puzzle numbers are not consecutive, reset the current streak
        currentStreak = 0;
      }

      // If the puzzle numbers are consecutive or it's the first puzzle, increment the submission streak
      if (i === 0 || scores[i].puzzle === scores[i - 1].puzzle + 1) {
        submissionStreak += 1;
      } else {
        // If the puzzle numbers are not consecutive, reset the submission streak
        submissionStreak = 0;
      }

      // If the current streak is greater than the max streak, update the max streak
      if (currentStreak > maxStreak) {
        maxStreak = currentStreak;
      }
    }
    // Set the current streak and best streak in the stats
    stats.currentStreak = currentStreak;
    stats.bestStreak = maxStreak;
    stats.submissionStreak = submissionStreak;

    // Find the last played puzzle number, grid and score
    stats.lastPlayed = scores[scores.length - 1].puzzle;
    stats.lastGrid = scores[scores.length - 1].grid;
    stats.lastScore = scores[scores.length - 1].score;

    // Find the frequency of each score
    const scoreFrequency = scores.reduce((acc: { [key: number]: number }, score) => {
      if (!acc[score.score]) {
        acc[score.score] = 0;
      }
      acc[score.score] += 1;
      return acc;
    }, {} as { [key: number]: number });
    log.debug(F, `Connections score frequency: ${JSON.stringify(scoreFrequency)}`);
    return { stats, scoreFrequency };
  }

  export async function updateStats(discordId: string, newStats: { grid: string, score: number, puzzle: number }) {
  // Find the user with the given discordId
    const user = await db.users.findFirst({
      where: {
        discord_id: discordId,
      },
    });

    // If no user is found, throw an error
    if (!user) {
      throw new Error(`No user found with discordId: ${discordId}`);
    }

    const newPuzzles = await Connections.todaysPuzzles();

    // Try to find an existing connections_scores record for the given user and puzzle
    const existingScore = await db.connections_scores.findFirst({
      where: {
        user_id: user.id,
        puzzle: newStats.puzzle,
      },
    });

    if (existingScore) {
    // If a record is found, update it with the new score
      await db.connections_scores.update({
        where: {
          id: existingScore.id,
        },
        data: {
          score: newStats.score,
          grid: newStats.grid,
        },
      });
      log.debug(F, `Connections score updated for user: ${discordId}`);
    } else {
    // If no record is found, create a new one
      await db.connections_scores.create({
        data: {
          user_id: user.id,
          ...newStats,
        },
      });
      // If the puzzle is new, reward with tokens
      if (newPuzzles.includes(newStats.puzzle)) {
        await submissionPayout(discordId, 25);
      }
      log.debug(F, `Connections score created for user: ${discordId}`);
    }
  }

  export async function process(userId: string, messageContent: string) {
    const connectionsScorePattern = /(Connections\s*Puzzle\s*#\d+)((?:\n(?:🟩|🟨|🟪|🟦){4})+)/;
    const match = messageContent.match(connectionsScorePattern);
    if (match) {
      const puzzleNumber = parseInt(match[1].match(/\d+/)?.[0] ?? 'NaN', 10);
      const validPuzzleNumbers = await Connections.todaysPuzzles();
      if (!validPuzzleNumbers.includes(puzzleNumber)) {
        log.debug(F, `Invalid Connections puzzle found (Puzzle number is from the future): ${match[1]}`);
        return false;
      }

      // Split the game grid into lines
      const gameGrid = match[2].split('\n').filter(line => line.length > 0);
      const winLinesOrder = [];
      // Filter the game grid to only include valid lines
      const validSquares = ['🟩', '🟨', '🟪', '🟦'];
      const validGameGrid = gameGrid.filter(line => validSquares.some(square => line.includes(square)));
      const emojiToName = {
        '🟩': 'green',
        '🟨': 'yellow',
        '🟪': 'purple',
        '🟦': 'blue',
      };
      // Stop counting lines as soon as you encounter a line that doesn't match the connections pattern
      for (let i = 0; i < validGameGrid.length; i += 1) {
      // Ensure each line only contains 4 squares
        const squares = validGameGrid[i].match(/(🟩|🟨|🟪|🟦)/g);
        if (!squares || squares.length !== 4) {
          log.debug(F, `Invalid Connections puzzle found (Invalid squares per line): ${match[1]}`);
          return false;
        }

        // Check if a line contains exactly four squares of the same color
        const winLineMatch = validGameGrid[i].match(/(🟩🟩🟩🟩|🟨🟨🟨🟨|🟪🟪🟪🟪|🟦🟦🟦🟦)/);
        if (winLineMatch) {
        // If it does, convert the emoji to a name and add it to the winLinesOrder array
          const emoji = winLineMatch[0].substring(0, 2);
          log.debug(F, `Win Line: ${emoji}`);
          const name = emojiToName[emoji as keyof typeof emojiToName];
          if (name) {
            winLinesOrder.push(name.toString());
          }
        }
      }
      log.debug(F, `Win Lines Order: ${winLinesOrder.join(', ')}`);

      // Calculate the score
      let score = 0;
      validGameGrid.forEach(line => {
        if (!/^(\p{Emoji})\1{3}$/u.test(line)) {
          score += 1;
        }
      });
      log.debug(F, `Connections score: ${score}`);

      // Ensure the score is not more than 4
      if (score > 4) {
        log.debug(F, `Invalid Connections puzzle found (Score is more than 4): ${match[0]}`);
        return false;
      }
      // Get the game "grid" as a simple line of emojis
      const grid = validGameGrid.join('');
      log.debug(F, `Grid: ${grid}`);
      await Connections.updateStats(userId, {
        score,
        puzzle: puzzleNumber,
        grid,
      });
      return true;
    }
    return false;
  }
}

export namespace TheMini {
  export async function todaysPuzzles() {
  // Get the current date and time in UTC
    const currentDate = new Date();

    // Add 14 hours to the current UTC time to get the date in UTC+14
    currentDate.setUTCHours(currentDate.getUTCHours() + 14);

    // Get yesterday's date
    const yesterday = new Date(currentDate);
    yesterday.setUTCDate(currentDate.getUTCDate() - 1);

    // Get the day before yesterday's date
    const dayBeforeYesterday = new Date(currentDate);
    dayBeforeYesterday.setUTCDate(currentDate.getUTCDate() - 2);

    // List of the last 3 valid dates for Mini puzzles
    const validDates = [
      currentDate.toISOString().substring(0, 10), // UTC+14 Newest Puzzle
      yesterday.toISOString().substring(0, 10), // Rest of World
      dayBeforeYesterday.toISOString().substring(0, 10), // Yesterday
    ];

    log.debug(F, `Valid Mini puzzle dates: ${validDates[0]} (UTC+14 Newest Puzzle), ${validDates[1]} (Rest of World), ${validDates[2]} (Yesterday)`);
    return validDates;
  }

  export async function getServerStats(puzzleDate: string) {
  // Find all the scores for the given puzzle
    log.debug(F, `Getting Mini stats for puzzle: ${puzzleDate}`);
    const scores = await db.mini_scores.findMany({
      where: {
        puzzle: puzzleDate,
      },
    });

    if (!scores || scores.length === 0) {
      return null;
    }

    // Initialize stats
    const stats = {
      gamesPlayed: 0,
      bestTime: 0,
      averageTime: 0,
    };

    stats.gamesPlayed = scores.length;
    const bestTime = Math.min(...scores.map(score => score.score));
    stats.bestTime = bestTime;
    const averageTime = scores.reduce((acc, score) => acc + score.score, 0) / scores.length;
    stats.averageTime = averageTime;
    log.debug(F, `Mini stats: ${JSON.stringify(stats)}`);

    return { stats };
  }

  export async function getUserStats(discordId: string) {
  // Find the user with the given discordId
    const user = await db.users.findFirst({
      where: {
        discord_id: discordId,
      },
    });

    // If no user is found, throw an error
    if (!user) {
      throw new Error(`No user found with discordId: ${discordId}`);
    }

    // Find all the scores for the user
    const scores = await db.mini_scores.findMany({
      where: {
        user_id: user.id,
      },
    });

    if (!scores || scores.length === 0) {
      return null;
    }

    // Initialize stats
    const stats = {
      gamesPlayed: 0,
      bestTime: 0,
      averageTime: 0,
      currentStreak: 0,
      bestStreak: 0,
      submissionStreak: 0,
      lastPlayed: '',
      lastScore: 0,
    };

    // Find the total number of games played by counting the number of scores
    stats.gamesPlayed = scores.length;
    // Find the best time by finding the minimum score
    stats.bestTime = Math.min(...scores.map(score => score.score));
    // Find the average time by summing all the scores and dividing by the total number of games played
    stats.averageTime = scores.reduce((acc, score) => acc + score.score, 0) / stats.gamesPlayed;
    // Sort the scores by puzzle date in ascending order
    scores.sort((a, b) => a.puzzle.localeCompare(b.puzzle));

    // TODO: Change streak logic to just use the date string instead of date objects
    // Initialize current streak and max streak
    let currentStreak = 0;
    let maxStreak = 0;
    let submissionStreak = 0;

    function isNextDay(date1: string, date2: string) {
      const dateObj1 = new Date(date1);
      const dateObj2 = new Date(date2);
      return dateObj2.getTime() - dateObj1.getTime() === 86400000;
    }

    // Iterate over the sorted scores
    for (let i = 0; i < scores.length; i += 1) {
    // If the score is greater than 0 and the puzzle dates are consecutive or it's the first puzzle, increment the current streak
      if (scores[i].score > 0 && (i === 0 || isNextDay(scores[i - 1].puzzle, scores[i].puzzle))) {
        currentStreak += 1;
      } else {
      // If the score is 0 or the puzzle dates are not consecutive, reset the current streak
        currentStreak = 0;
      }

      // If the puzzle numbers are consecutive or it's the first puzzle, increment the submission streak
      if (i === 0 || scores[i].puzzle === scores[i - 1].puzzle + 1) {
        submissionStreak += 1;
      } else {
        // If the puzzle numbers are not consecutive, reset the submission streak
        submissionStreak = 0;
      }

      // If the current streak
      if (currentStreak > maxStreak) {
        maxStreak = currentStreak;
      }
    }
    // Set the current streak and best streak in the stats
    stats.currentStreak = currentStreak;
    stats.bestStreak = maxStreak;
    stats.submissionStreak = submissionStreak;

    // Find the last played puzzle date
    const puzzleDate = parse(scores[scores.length - 1].puzzle, 'yyyy-MM-dd', new Date());
    log.debug(F, `Last played puzzle date: ${puzzleDate}`);
    stats.lastPlayed = format(puzzleDate, 'EEEE, MMMM do, yyyy');
    stats.lastScore = scores[scores.length - 1].score;

    return { stats };
  }

  export async function updateStats(userId: string, newStats: { score: number, puzzle: string }) {
  // Find the user with the given discordId
    const user = await db.users.findFirst({
      where: {
        discord_id: userId,
      },
    });

    // If no user is found, throw an error
    if (!user) {
      throw new Error(`No user found with discordId: ${userId}`);
    }

    // Try to find an existing mini_scores record for the given user and date
    const existingScore = await db.mini_scores.findFirst({
      where: {
        user_id: user.id,
        puzzle: newStats.puzzle,
      },
    });

    if (existingScore) {
    // If a record is found, update it with the new score
      await db.mini_scores.update({
        where: {
          id: existingScore.id,
        },
        data: {
          score: newStats.score,
        },
      });
      log.debug(F, `Mini score updated for user: ${userId}`);
    } else {
    // If no record is found, create a new one
      await db.mini_scores.create({
        data: {
          user_id: user.id,
          ...newStats,
        },
      });
      log.debug(F, `Mini score created for user: ${userId}`);
    }
  }

  export async function process(userId: string, messageContent: string): Promise<boolean> {
    const theMiniScorePattern = /https:\/\/www\.nytimes\.com\/badges\/games\/mini\.html\?d=\d{4}-\d{2}-\d{2}&t=\d+&c=[a-f0-9]+&smid=url-share/;
    const match = messageContent.match(theMiniScorePattern);
    if (match) {
      const url = match[0];
      const urlParts = url.split('&');
      const dateString = urlParts[0].split('=')[1];
      const timeString = urlParts[1].split('=')[1];
      const date = dateString;
      log.debug(F, `dateString: ${dateString}, timeString: ${timeString}`);

      // Get the date from the date string and make it into a (YYYY, MM, DD) tuple

      // Convert time string to integer with radix parameter
      const time = parseInt(timeString, 10);

      // const validDates = await todaysMiniDates();
      // if (!validDates.includes(date.toISOString().substring(0, 10))) {
      //   log.debug(F, `Invalid Mini puzzle found (Date is from the future): ${url}`);
      //   return false;
      // }
      log.debug(F, `The Mini puzzle found: ${url}, Date: ${date}, Time: ${time}`);
      await TheMini.updateStats(userId, { score: time, puzzle: date });
      return true;
    }
    return false;
  }
}
