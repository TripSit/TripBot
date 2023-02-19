// import { stripIndents } from 'common-tags';
import {
  experienceGetTop,
} from '../utils/knex';
// import { getTotalLevel } from '../utils/experience';
import {
  ExperienceCategory,
  ExperienceType,
} from '../@types/database';

export default getLeaderboard;

// const F = f(__filename);

type LeaderboardList = { discord_id: string, total_points: number }[];

type LeaderboardData = {
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
  leaderboard.TEXT.TOTAL = await experienceGetTop(10, undefined, 'TEXT' as ExperienceType);
  leaderboard.TEXT.TRIPSITTER = await experienceGetTop(10, 'TRIPSITTER' as ExperienceCategory, 'TEXT' as ExperienceType); // eslint-disable-line
  leaderboard.TEXT.GENERAL = await experienceGetTop(10, 'GENERAL' as ExperienceCategory, 'TEXT' as ExperienceType); // eslint-disable-line
  leaderboard.TEXT.DEVELOPER = await experienceGetTop(10, 'DEVELOPER' as ExperienceCategory, 'TEXT' as ExperienceType); // eslint-disable-line
  leaderboard.TEXT.TEAM = await experienceGetTop(10, 'TEAM' as ExperienceCategory, 'TEXT' as ExperienceType);
  leaderboard.TEXT.IGNORED = await experienceGetTop(10, 'IGNORED' as ExperienceCategory, 'TEXT' as ExperienceType); // eslint-disable-line
  leaderboard.VOICE.TOTAL = await experienceGetTop(10, undefined, 'VOICE' as ExperienceType);
  leaderboard.VOICE.TRIPSITTER = await experienceGetTop(10, 'TRIPSITTER' as ExperienceCategory, 'VOICE' as ExperienceType); // eslint-disable-line
  leaderboard.VOICE.GENERAL = await experienceGetTop(10, 'GENERAL' as ExperienceCategory, 'VOICE' as ExperienceType); // eslint-disable-line
  leaderboard.VOICE.DEVELOPER = await experienceGetTop(10, 'DEVELOPER' as ExperienceCategory, 'VOICE' as ExperienceType); // eslint-disable-line
  leaderboard.VOICE.TEAM = await experienceGetTop(10, 'TEAM' as ExperienceCategory, 'VOICE' as ExperienceType);
  leaderboard.VOICE.IGNORED = await experienceGetTop(10, 'IGNORED' as ExperienceCategory, 'VOICE' as ExperienceType); // eslint-disable-line

  // log.info(F, `leaderboard.TEXT.TOTAL: ${JSON.stringify(leaderboard.TEXT.TOTAL, null, 2)}`);
  return leaderboard;
}
