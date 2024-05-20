const F = f(__filename); // eslint-disable-line

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
  // UPDATE WIN RATE
  const scores = await db.wordle_scores.findMany({
    where: {
      user_id: user.id,
    },
  });

  // Find the wordle_stats record for the user
  const wordleStats = await db.wordle_stats.findFirst({
    where: {
      user_id: user.id,
    },
  });

  if (!wordleStats) {
    // Create a new wordle_stats record for the user
    await db.wordle_stats.create({
      data: {
        user_id: user.id,
        win_rate: 0,
        games_played: 0,
        current_streak: 0,
        best_streak: 0,
      },
    });
  }

  if (!wordleStats) {
    throw new Error(`No wordle_stats record found for user: ${discordId}`);
  }

  const totalGames = scores.length;
  const wins = scores.filter(score => score.score > 0).length;
  const winRate = wins / totalGames;
  // Find the current streak
  const currentStreak = scores.reduce((acc, score) => {
    if (score.score === 0) {
      return 0;
    }
    return acc + 1;
  }, 0);
  // If the current streak is greater than the best streak, update the best streak
  const bestStreak = currentStreak > wordleStats.best_streak ? currentStreak : wordleStats.best_streak;

  // Update the user's stats
  await db.wordle_stats.update({
    where: {
      id: wordleStats.id,
    },
    data: {
      win_rate: winRate,
      games_played: totalGames,
      current_streak: currentStreak,
      best_streak: bestStreak,
    },
  });

  log.debug(F, `Games Played: ${totalGames}, Wins: ${wins}, Win rate: ${winRate}, Current Streak: ${currentStreak}, Best Streak: ${bestStreak}`);
}

export default async function processWordle(userId: string, messageContent: string): Promise<{ score: number, puzzleNumber: number } | null> {
  log.debug(F, `Processing message for Wordle score: ${messageContent}`);
  // Regular expression to match "Wordle", a number including commas, and a digit or 'X' /6
  const wordleScorePattern = /(Wordle\s([\d,]+)\s(\d|X)\/6)/;
  const match = messageContent.match(wordleScorePattern);

  if (match) {
    // VALIDATE THAT THE WORDLE MAKES SENSE AND IS NOT EDITED
    // Extract the score from the match
    const puzzleNumber = parseInt(match[2].replace(',', ''), 10);
    const score = match[3] === 'X' ? 0 : parseInt(match[3], 10);
    // Ensure the score is not more than 6
    if (score > 6) {
      log.debug(F, `Invalid Wordle score found (Score cannot be more than 6): ${match[1]}`);
      return null;
    }
    // Split the message content into lines
    const lines = messageContent.split('\n');
    // Filter the lines to only include those with squares
    const squareLines = lines.filter(line => /(⬛|🟨|🟩){5}/.test(line));
    // Stop counting lines as soon as you encounter a line that doesn't match the wordle pattern
    for (let i = 0; i < squareLines.length; i += 1) {
      // Ensure each line only contains 5 squares
      const squares = squareLines[i].match(/(⬛|🟨|🟩)/g);
      if (!squares || squares.length !== 5) {
        log.debug(F, `Invalid Wordle score found (Invalid squares per line): ${match[1]}`);
        return null;
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
        return null;
      }
      // Check that the last line of squares is all green (win line)
      if (!squareLines[squareLines.length - 1].includes('🟩🟩🟩🟩🟩')) { // eslint-disable-line
        log.debug(F, `Invalid Wordle score found (Game lost but listed as win): ${match[1]}`);
        return null;
      }
      // Check that there is only one "win" line
      const greenLines = squareLines.filter(line => line.includes('🟩🟩🟩🟩🟩'));
      if (greenLines.length > 1) {
        log.debug(F, `Invalid Wordle score found (Multiple win lines): ${match[1]}`);
        return null;
      }
    }
    // If the Wordle was failed
    if (score === 0) {
      // Check that there are 6 lines
      if (squareLines.length !== 6) {
        log.debug(F, `Invalid Wordle score found (Rows vs Failure): ${match[1]}`);
        return null;
      }
      // Check that there is no win line
      if (squareLines.includes('🟩🟩🟩🟩🟩')) {
        log.debug(F, `Invalid Wordle score found (Game won but listed as failure): ${match[1]}`);
        return null;
      }
    }
    log.debug(F, `Wordle score found: ${match[1]}`);
    await updateWordleStats(userId, { score, puzzle: puzzleNumber });
    return { score, puzzleNumber };
  }
  return null;
}
