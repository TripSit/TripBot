export default getLeaderboard;

type LeaderboardList = { discord_id: string, total_points: number }[];

type LeaderboardData = {
  ALL: {
    TOTAL: LeaderboardList,
    TRIPSITTER: LeaderboardList,
    GENERAL: LeaderboardList,
    DEVELOPER: LeaderboardList,
    TEAM: LeaderboardList,
    IGNORED: LeaderboardList,
  },
  TEXT: {
    TOTAL: LeaderboardList,
    TRIPSITTER: LeaderboardList,
    GENERAL: LeaderboardList,
    DEVELOPER: LeaderboardList,
    TEAM: LeaderboardList,
    IGNORED: LeaderboardList,
  },
  VOICE: {
    TOTAL: LeaderboardList,
    TRIPSITTER: LeaderboardList,
    GENERAL: LeaderboardList,
    DEVELOPER: LeaderboardList,
    TEAM: LeaderboardList,
    IGNORED: LeaderboardList,
  },
};

export async function getLeaderboard():Promise<LeaderboardData> {
  const leaderboard = {
    ALL: {
      TOTAL: [],
      TRIPSITTER: [],
      GENERAL: [],
      DEVELOPER: [],
      TEAM: [],
      IGNORED: [],
    },
    TEXT: {
      TOTAL: [],
      TRIPSITTER: [],
      GENERAL: [],
      DEVELOPER: [],
      TEAM: [],
      IGNORED: [],
    },
    VOICE: {
      TOTAL: [],
      TRIPSITTER: [],
      GENERAL: [],
      DEVELOPER: [],
      TEAM: [],
      IGNORED: [],
    },
  } as LeaderboardData;

  // Grab all the user experience from the database
  leaderboard.ALL.TOTAL = await experienceGetTop();
  leaderboard.ALL.TRIPSITTER = await experienceGetTop(undefined, 'TRIPSITTER' as ExperienceCategory);
  leaderboard.ALL.GENERAL = await experienceGetTop(undefined, 'GENERAL' as ExperienceCategory);
  leaderboard.ALL.DEVELOPER = await experienceGetTop(undefined, 'DEVELOPER' as ExperienceCategory);
  leaderboard.ALL.TEAM = await experienceGetTop(undefined, 'TEAM' as ExperienceCategory);
  leaderboard.ALL.IGNORED = await experienceGetTop(undefined, 'IGNORED' as ExperienceCategory);

  leaderboard.TEXT.TOTAL = await experienceGetTop(undefined, undefined, 'TEXT' as ExperienceType);
  leaderboard.TEXT.TRIPSITTER = await experienceGetTop(undefined, 'TRIPSITTER' as ExperienceCategory, 'TEXT' as ExperienceType); // eslint-disable-line
  leaderboard.TEXT.GENERAL = await experienceGetTop(undefined, 'GENERAL' as ExperienceCategory, 'TEXT' as ExperienceType); // eslint-disable-line
  leaderboard.TEXT.DEVELOPER = await experienceGetTop(undefined, 'DEVELOPER' as ExperienceCategory, 'TEXT' as ExperienceType); // eslint-disable-line
  leaderboard.TEXT.TEAM = await experienceGetTop(undefined, 'TEAM' as ExperienceCategory, 'TEXT' as ExperienceType);
  leaderboard.TEXT.IGNORED = await experienceGetTop(undefined, 'IGNORED' as ExperienceCategory, 'TEXT' as ExperienceType); // eslint-disable-line

  leaderboard.VOICE.TOTAL = await experienceGetTop(undefined, undefined, 'VOICE' as ExperienceType);
  leaderboard.VOICE.TRIPSITTER = await experienceGetTop(undefined, 'TRIPSITTER' as ExperienceCategory, 'VOICE' as ExperienceType); // eslint-disable-line
  leaderboard.VOICE.GENERAL = await experienceGetTop(undefined, 'GENERAL' as ExperienceCategory, 'VOICE' as ExperienceType); // eslint-disable-line
  leaderboard.VOICE.DEVELOPER = await experienceGetTop(undefined, 'DEVELOPER' as ExperienceCategory, 'VOICE' as ExperienceType); // eslint-disable-line
  leaderboard.VOICE.TEAM = await experienceGetTop(undefined, 'TEAM' as ExperienceCategory, 'VOICE' as ExperienceType);
  leaderboard.VOICE.IGNORED = await experienceGetTop(undefined, 'IGNORED' as ExperienceCategory, 'VOICE' as ExperienceType); // eslint-disable-line

  return leaderboard;
}
