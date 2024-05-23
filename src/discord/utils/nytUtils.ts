const F = f(__filename); // eslint-disable-line

// TODO: Determine if the submitted puzzle is "new" or the user is submitting a puzzle from the past
// TODO: If the puzzle is "new", reward with Trip Tokens

async function todaysWordleNumbers() {
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

export async function getServerWordleStats(puzzleNumber: number) {
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

export async function getUserWordleStats(discordId: string) {
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
    throw new Error(`No scores found for user: ${discordId}`);
  }

  // Initialize stats
  const stats = {
    gamesPlayed: 0,
    winRate: 0,
    currentStreak: 0,
    bestStreak: 0,
  };

  // Find the total number of games played by counting the number of scores
  stats.gamesPlayed = scores.length;
  // Find the number of win rate by counting the number of scores with a score greater than 0 and dividing by the total number of games played
  const wins = scores.filter(score => score.score > 0).length;
  stats.winRate = wins / stats.gamesPlayed;
  // Find the current streak by counting the number of consecutive wins (based off the puzzle number)
  // Sort the scores by puzzle number in ascending order
  scores.sort((a, b) => a.puzzle - b.puzzle);
  // Initialize current streak and max streak
  let currentStreak = 0;
  let maxStreak = 0;
  // Iterate over the sorted scores
  for (let i = 0; i < scores.length; i += 1) {
    // If the score is greater than 0 and the puzzle numbers are consecutive or it's the first puzzle, increment the current streak
    if (scores[i].score > 0 && (i === 0 || scores[i].puzzle === scores[i - 1].puzzle + 1)) {
      currentStreak += 1;
    } else {
      // If the score is 0 or the puzzle numbers are not consecutive, reset the current streak
      currentStreak = 0;
    }
    // If the current streak is greater than the max streak, update the max streak
    if (currentStreak > maxStreak) {
      maxStreak = currentStreak;
    }
  }
  // Set the current streak and best streak in the stats
  stats.currentStreak = currentStreak;
  stats.bestStreak = maxStreak;

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

async function updateWordleStats(discordId: string, newStats: { score: number, puzzle: number }) {
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
  }

  // UPDATE STORED STATS
  // const scores = await db.wordle_scores.findMany({
  //   where: {
  //     user_id: user.id,
  //   },
  // });
//
  // // Find the wordle_stats record for the user
  // const wordleStats = await db.wordle_stats.findFirst({
  //   where: {
  //     user_id: user.id,
  //   },
  // });
//
  // if (!wordleStats) {
  //   // Create a new wordle_stats record for the user
  //   await db.wordle_stats.create({
  //     data: {
  //       user_id: user.id,
  //       win_rate: 0,
  //       games_played: 0,
  //       current_streak: 0,
  //       best_streak: 0,
  //     },
  //   });
  // }
//
// if (!wordleStats) {
//   throw new Error(`No wordle_stats record found for user: ${discordId}`);
// }
//
// const totalGames = scores.length;
// const wins = scores.filter(score => score.score > 0).length;
// const winRate = wins / totalGames;
// // Find the current streak
// const currentStreak = scores.reduce((acc, score) => {
//   if (score.score === 0) {
//     return 0;
//   }
//   return acc + 1;
// }, 0);
// // If the current streak is greater than the best streak, update the best streak
// const bestStreak = currentStreak > wordleStats.best_streak ? currentStreak : wordleStats.best_streak;
//
// // Update the user's stats
// await db.wordle_stats.update({
//   where: {
//     id: wordleStats.id,
//   },
//   data: {
//     win_rate: winRate,
//     games_played: totalGames,
//     current_streak: currentStreak,
//     best_streak: bestStreak,
//   },
// });
//
// log.debug(F, `Games Played: ${totalGames}, Wins: ${wins}, Win rate: ${winRate}, Current Streak: ${currentStreak}, Best Streak: ${bestStreak}`);
}

export async function processWordle(userId: string, messageContent: string): Promise<boolean> {
  log.debug(F, `Processing message for Wordle score: ${messageContent}`);
  // Regular expression to match "Wordle", a number including commas, and a digit or 'X' /6
  const wordleScorePattern = /(Wordle\s([\d,]+)\s(\d|X)\/6)/;
  const match = messageContent.match(wordleScorePattern);

  if (match) {
    // VALIDATE THAT THE WORDLE MAKES SENSE AND IS NOT EDITED
    // Extract the score from the match
    const puzzleNumber = parseInt(match[2].replace(',', ''), 10);
    // Prevent users from submitting puzzles from the future
    const validPuzzleNumbers = await todaysWordleNumbers();
    if (!validPuzzleNumbers.includes(puzzleNumber)) {
      log.debug(F, `Invalid Wordle score found (Puzzle number is from the future): ${match[1]}`);
      return false;
    }
    const score = match[3] === 'X' ? 0 : parseInt(match[3], 10);
    // Ensure the score is not more than 6
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
      if (!/(⬛|🟨|🟩){5}/.test(squareLines[i])) {
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
    await updateWordleStats(userId, { score, puzzle: puzzleNumber });
    return true;
  }
  return false;
}

export async function processConnections(userId:String, messageContent: string) {
  const connectionsScorePattern = /(Connections\s*Puzzle\s*#\d+)/;
  const match = messageContent.match(connectionsScorePattern);
  if (match) {
    const connections = parseInt(match[1], 10);
    log.debug(F, `Connections found: ${connections}`);
    return true;
  }
  return false;
}
