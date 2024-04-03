/* eslint-disable max-len */
import { stripIndents } from 'common-tags';
import { PrismaClient as PrismaClientTripbot } from '@prisma/client';
// eslint-disable-next-line import/no-extraneous-dependencies
import { PrismaClient as PrismaClientMoodle } from '@prisma-moodle/client';
import { DateTime } from 'luxon';

const moodleDb = new PrismaClientMoodle();
const tripbotDb = new PrismaClientTripbot();

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
    title: 'TripSitLearn Info',
    description: stripIndents`[TripSit Learn: Your Gateway to Harm Reduction Knowledge](${env.MOODLE_URL})

    Join us on a transformative journey of learning and growth! At TripSit, we're committed to fostering a responsible understanding of drug use. With this in mind, we're excited to present our pioneering course—"How to Be a TripSitter", which is entirely free and open for everyone.

    With the /learn profile command, you can proudly display your educational journey, featuring the courses you've triumphantly completed
    
    **As the beauty of learning knows no bounds, your learn profile is available discord-wide, wherever TripBot is present.**
    
    Therefore, you can take your learning profile anywhere on the Discord platform, showcasing your commitment to harm reduction wherever you go!

    Simply use the /learn command to pair your TripSit Learn account with your Discord account. Don't worry, your email is solely for account validation, guaranteeing that it won't be stored in the bot or shared anywhere else.

    (In fact: If you've hidden your email on the moodle, the bot won't be able to verify your account. Make sure to make your email public for the bot to be able to verify your account, and then you can make it private again!)
    
    We heartily welcome other communities to join hands with TripSit and contribute their unique learning courses to our thriving platform. If this sounds exciting to you, we would love to hear from you. Please, don't hesitate to reach out!
    `,
    url: env.MOODLE_URL,
    footer: 'Thanks for your interest!',
  };
}

export async function link(
  email:string,
  discordId:string,
):Promise<string> {
  // log.debug(F, `Link started with moodleUsername: ${moodleUsername}, \
  // discordId: ${discordId}, matrixId: ${matrixId}`);

  const userData = await tripbotDb.users.findUnique({
    where: {
      discord_id: discordId,
    },
  });

  log.debug(F, `userData: ${JSON.stringify(userData)}`);

  if (!userData) {
    return 'No user found with that Discord or Matrix ID.';
  }

  const moodleUserData = await moodleDb.mdl_user.findFirst({
    where: {
      email,
    },
  });

  if (!moodleUserData) {
    return 'No user found with that email address.';
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

  return stripIndents`You have linked the moodle account - ${email} (${moodleUserData.username}) - with Discord account ${discordId}
  Use the /learn profile command to see the profile!`;
}

export async function unlink(
  discordId?:string,
  matrixId?:string,
):Promise<string> {
  // log.debug(F, `Unlink started with discordId: ${discordId}, matrixId: ${matrixId}`);

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
    return 'No user found with that Discord or Matrix ID.';
  }

  tripbotDb.users.update({
    where: {
      id: userData.id,
    },
    data: {
      moodle_id: null,
    },
  });

  return stripIndents`You have unlinked your Discord account with TripSitLearn!
  Use the /learn link command if you ever want to link your account again!`;
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
