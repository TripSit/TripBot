/* eslint-disable max-len */
import { DateTime } from 'luxon';
import tripbotDb from '../../prisma/tripbot/client';
import moodleDb from '../../prisma/moodle/client';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const F = f(__filename);

type MoodleProfile = {
  fullName: string,
  institution: string | null,
  department: string | null,
  completedCourses: string[],
  incompleteCourses: string[],
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function bigIntSanitize(key: any, value: any) {
  if (typeof value === 'bigint') {
    return value.toString(); // or alternatively `Number(value)` if the value is within the safe integer range for JavaScript
  }
  return value; // return the unchanged property value.
}

type MoodleInfo = {
  title: string,
  description: string,
  url: string,
  footer: string,
};

export async function help():Promise<MoodleInfo> {
  return {
    title: '',
    description: '',
    url: env.MOODLE_URL,
    footer: '',
  };
}

type LinkResult =
  | { type: 'noDiscordUser' }
  | { type: 'noEmail' }
  | { type: 'success'; email: string; username: string; discordId: string };

export async function link(
  email:string,
  discordId:string,
):Promise<LinkResult> {
  const userData = await tripbotDb.users.findUnique({
    where: {
      discord_id: discordId,
    },
  });

  log.debug(F, `userData: ${JSON.stringify(userData)}`);

  if (!userData) {
    return { type: 'noDiscordUser' };
  }

  const moodleUserData = await moodleDb.mdl_user.findFirst({
    where: {
      email,
    },
  });

  if (!moodleUserData) {
    return { type: 'noEmail' };
  }

  log.debug(F, `moodleUserData: ${JSON.stringify(moodleUserData.username)}`);

  const result = await tripbotDb.users.update({
    where: {
      id: userData.id,
    },
    data: {
      moodle_id: moodleUserData.username,
    },
  });

  log.debug(F, `result: ${JSON.stringify(result)}`);

  return {
    type: 'success', email, username: moodleUserData.username, discordId,
  };
}

type UnlinkResult =
  | { type: 'noUser' }
  | { type: 'success' };

export async function unlink(
  discordId?:string,
  matrixId?:string,
):Promise<UnlinkResult> {
  const userData = discordId
    ? await tripbotDb.users.findUnique({
      where: {
        discord_id: discordId,
      },
    })
    : await tripbotDb.users.findFirst({
      where: {
        matrix_id: matrixId as string,
      },
    });

  if (!userData) {
    return { type: 'noUser' };
  }

  tripbotDb.users.update({
    where: {
      id: userData.id,
    },
    data: {
      moodle_id: null,
    },
  });

  return { type: 'success' };
}

export async function profile(
  discordId?:string,
  matrixId?:string,
):Promise<MoodleProfile> {
  // log.debug(F, `Profile started with discordId: ${discordId}, matrixId: ${matrixId}`);

  let moodleProfile = {} as MoodleProfile;

  const userData = discordId
    ? await tripbotDb.users.findUnique({
      where: {
        discord_id: discordId,
      },
    })
    : await tripbotDb.users.findFirst({
      where: {
        matrix_id: matrixId as string,
      },
    });

  // log.debug(F, `userData: ${JSON.stringify(userData, null, 2)}`);

  if (!userData || !userData.moodle_id) {
    return moodleProfile;
  }

  try {
    await moodleDb.mdl_user.findMany();
  } catch (err) {
    global.moodleConnection = {
      status: false,
      date: DateTime.now(),
    };
    return moodleProfile;
  }

  const moodleUserData = await moodleDb.mdl_user.findUnique({
    where: {
      mnethostid_username: {
        username: userData.moodle_id,
        mnethostid: 1,
      },
    },
  });

  if (!moodleUserData) {
    return moodleProfile;
  }

  // log.debug(F, `moodleUserData: ${JSON.stringify(moodleUserData, bigIntSanitize, 2)}`);

  const moodleEnrollments = await moodleDb.mdl_user_enrolments.findMany({
    where: {
      userid: moodleUserData.id,
    },
    include: {
      enrol: {
        include: {
          course: {
            include: {
              completions: {
                where: {
                  userid: moodleUserData.id,
                },
              },
            },
          },
        },
      },
    },
  });

  let completedCourses:string[] = [];
  let incompleteCourses:string[] = [];
  if (moodleEnrollments.length > 0) {
    // log.debug(F, `moodleEnrollments: ${JSON.stringify(moodleEnrollments, null, 2)}`);
    // log.debug(F, `moodleCourseCompletionData: ${JSON.stringify(moodleCourseCompletionData, null, 2)}`);

    // Get an array of courses the user has completed
    completedCourses = moodleEnrollments
      .filter(enrollment => enrollment.enrol.course.completions.length > 0 && enrollment.enrol.course.completions[0].timecompleted !== null)
      .map(enrollment => enrollment.enrol.course.fullname);

    incompleteCourses = moodleEnrollments
      .filter(enrollment => enrollment.enrol.course.completions.length === 0 || enrollment.enrol.course.completions[0].timecompleted === null)
      .map(enrollment => enrollment.enrol.course.fullname);
  }

  moodleProfile = {
    fullName: `${moodleUserData.firstname} ${moodleUserData.lastname}`,
    institution: moodleUserData.institution,
    department: moodleUserData.department,
    completedCourses,
    incompleteCourses,
  };

  // log.debug(F, `moodleProfile: ${JSON.stringify(moodleProfile, null, 2)}`);
  return moodleProfile;
}
