import { stripIndents } from 'common-tags';
import https from 'https';
import { database } from '../utils/knex';

const F = f(__filename);

type MoodleProfile = {
  fullName: string,
  institution: string | null,
  department: string | null,
  profileImage: string,
  completedCourses: string[],
  incompleteCourses: string[],
};

type MoodleUser = {
  id: number,
  username: string,
  firstname: string,
  lastname: string,
  fullname: string,
  email: string,
  department: string,
  institution: string,
  firstAccess: number,
  lastAccess: number,
  auth: string,
  suspended: boolean,
  confirmed: boolean,
  lang: string,
  theme: string,
  timezone: string,
  mailFormat: number,
  description: string,
  descriptionFormat: number,
  city: string,
  country: string,
  profileimageurlsmall: string,
  profileimageurl: string,
};

type MoodleFile = {
  filename: string,
  filepath: string,
  filesize: number,
  fileurl: string,
  timemodified: number,
  mimetype: string,
};

type MoodleCourse = {
  id: string,
  shortname: string,
  fullname: string,
  displayname: string,
  enrolledusercount: number,
  idnumber: string,
  visible: number,
  summary: string,
  summaryformat: number,
  format: string,
  showgrades: boolean,
  lang: string,
  enablecompletion: boolean,
  completionhascriteria: boolean,
  completionusertracked: boolean,
  category: number,
  progress: number,
  completed: boolean,
  startdate: number,
  enddate: number,
  marker: number,
  lastaccess: number,
  isfavourite: boolean,
  hidden: boolean,
  overviewfiles: MoodleFile[],
  showactivitydates: boolean,
  showcompletionconditions: boolean,
  timemodified: number,
};

type MoodleActivityInfo = {
  type: string,
  criteria: string,
  requirement: string,
  status: string,
};

type MoodleActivityCompletion = {
  type: number,
  title: string,
  status: string,
  complete: boolean,
  timecompleted: number,
  details: MoodleActivityInfo,
};

type MoodleCompletionInfo = {
  completed: boolean,
  aggregation: number,
  completions: Array<MoodleActivityCompletion>,
};

type MoodleCompletionStatus = {
  completionstatus: MoodleCompletionInfo,
  warnings: Array<string>,
};

type MoodleInfo = {
  title: string,
  description: string,
  url: string,
  footer: string,
};

type MoodleCourseCompletion = {
  course:MoodleCourse,
  completion:MoodleCompletionStatus,
};

async function getMoodleUser(
  username?:string,
  email?:string,
):Promise<MoodleUser> {
  // log.debug(F, `getMoodleUser | username: ${username} | email: ${email}`);

  let url = `${env.MOODLE_URL}/webservice/rest/server.php?wstoken=${env.MOODLE_TOKEN}\
&wsfunction=core_user_get_users_by_field\
&moodlewsrestformat=json`;

  if (username) {
    url += `&field=username&values[]=${username}`;
  } else if (email) {
    url += `&field=email&values[]=${email}`;
  } else {
    log.error(F, 'No user ID or email provided.');
    throw new Error('No user ID or email provided.');
  }

  // log.debug(F, `url: ${url}`);

  return new Promise((resolve, reject) => {
    https.get(url, response => {
      let data = '';

      response.on('data', chunk => {
        data += chunk;
      });

      response.on('end', () => {
        let result = [] as MoodleUser[];
        try {
          result = JSON.parse(data) as MoodleUser[];
        } catch (error:unknown) {
          // log.error(F, `Error: ${(error as Error).message}`);
          log.debug(F, 'Improper JSON returned from Moodle, is it alive?');
          return;
        }
        // log.debug(F, `Result: ${JSON.stringify(result, null, 2)}`);
        if (result.length > 1) {
          log.error(F, `Multiple users with email ${email} found.`);
          reject(new Error(`Multiple users with email ${email} found.`));
        } else if (result.length === 1) {
          // log.debug(F, `moodleUser: ${JSON.stringify(result, null, 2)}`);
          resolve(result[0]);
        } else {
          // log.debug(F, `User with email ${email} or username ${username} not found.`);
          reject(new Error(`User with email ${email} or username ${username} not found.`));
        }
      });
    }).on('error', error => {
      log.error(F, `Error: ${error.message}`);
      reject(error);
    });
  });
}

async function getMoodleEnrollments(
  moodleUser:MoodleUser,
):Promise<MoodleCourse[]> {
  const url = `${env.MOODLE_URL}/webservice/rest/server.php?wstoken=${env.MOODLE_TOKEN}\
&wsfunction=core_enrol_get_users_courses\
&userid=${moodleUser.id}\
&moodlewsrestformat=json`;
  // log.debug(F, `url: ${url}`);

  return new Promise((resolve, reject) => {
    https.get(url, response => {
      let data = '';

      response.on('data', chunk => {
        data += chunk;
      });

      response.on('end', () => {
        const result = JSON.parse(data);
        // log.debug(F, `Result: ${JSON.stringify(result, null, 2)}`);
        resolve(result);
      });
    }).on('error', error => {
      // log.debug(F, `Error: ${error.message}`);
      reject(error);
    });
  });
}

async function getMoodleCourseCompletion(
  moodleUser:MoodleUser,
  moodleEnrollments:MoodleCourse[],
):Promise<MoodleCourseCompletion[]> {
  // log.debug(F, `getMoodleCourses | moodleUser: ${JSON.stringify(moodleUser, null, 2)}`);
  // log.debug(F, `getMoodleCourses | moodleEnrollments: ${JSON.stringify(moodleEnrollments, null, 2)}`);

  const completionStatuses = [] as MoodleCourseCompletion[];
  // For each moodle course, get the course info. This needs to be async so that we can return the results
  // once all the promises have been resolved.
  const promises = moodleEnrollments.map(async (moodleCourse:MoodleCourse) => {
    const url = `${env.MOODLE_URL}/webservice/rest/server.php?wstoken=${env.MOODLE_TOKEN}\
&wsfunction=core_completion_get_course_completion_status\
&userid=${moodleUser.id}\
&courseid=${moodleCourse.id}\
&moodlewsrestformat=json`;

    // log.debug(F, `url: ${url}`);

    return new Promise((resolve, reject) => {
      https.get(url, response => {
        let data = '';

        response.on('data', chunk => {
          data += chunk;
        });

        response.on('end', () => {
          const result = JSON.parse(data) as MoodleCompletionStatus;
          // log.debug(F, `Result: ${JSON.stringify(result, null, 2)}`);
          completionStatuses.push({
            course: moodleCourse,
            completion: result,
          });
          resolve(result);
        });
      }).on('error', error => {
        // log.debug(F, `Error: ${error.message}`);
        reject(error);
      });
    });
  });

  return new Promise((resolve, reject) => {
    Promise.all(promises).then(() => {
      // log.debug(F, `completionStatuses: ${JSON.stringify(completionStatuses, null, 2)}`);
      resolve(completionStatuses);
    }).catch(error => {
      log.error(F, `Error: ${error.message}`);
      reject(error);
    });
  });
}

export async function help():Promise<MoodleInfo> {
  return {
    title: 'TripSitLearn Info',
    description: stripIndents`TripSitLearn is TripSit's learning portal where we host courses for our members.

    These are free courses that anyone is allowed to take, and we encourage you to do so!

    You can use /learn link to link your TripSitLearn account with your Discord account.
    Note: Your email is only used to verify your account, and is not stored in the bot or posted anywhere.

    Then you can use /learn profile to show your learning profile, including which courses you've completed!
    Note: This will make your "full name" from the learn site public.

    This works discord-wide, anywhere that TripBot is, so you can take your learning profile with you anywhere! 
    
    Other communities are welcome to talk with TripSit and add their own learning courses to our platform:
    If you're interested in that, please reach out to us!
    `,
    url: env.MOODLE_URL,
    footer: 'Thanks for your interest!',
  };
}

export async function link(
  email?:string,
  moodleUsername?:string,
  discordId?:string,
  matrixId?:string,
):Promise<string> {
  // log.debug(F, `Link started with moodleUsername: ${moodleUsername}, discordId: ${discordId}, matrixId: ${matrixId}`);
  const userData = discordId
    ? await database.users.get(discordId, null, null)
    : await database.users.get(null, matrixId as string, null);
  // log.debug(F, `userData: ${JSON.stringify(userData)}`);

  const moodleUserData = email
    ? await getMoodleUser(undefined, email).catch(() => ({} as MoodleUser))
    : await getMoodleUser(moodleUsername, undefined).catch(() => ({} as MoodleUser));

  // log.debug(F, `moodleUserData: ${JSON.stringify(moodleUserData)}`);

  if (!moodleUserData.username) {
    return 'No user found with that email address.';
  }

  userData.moodle_id = moodleUserData.username;
  await database.users.set(userData);

  if (moodleUsername) {
    return stripIndents`You have linked this Discord account with TripSitLearn!
    Use the /learn profile command to see their profile!`;
  }

  return stripIndents`You have linked your Discord account with TripSitLearn!
  Use the /learn profile command to see your profile!`;
}

export async function unlink(
  discordId?:string,
  matrixId?:string,
):Promise<string> {
  // log.debug(F, `Unlink started with discordId: ${discordId}, matrixId: ${matrixId}`);
  const userData = discordId
    ? await database.users.get(discordId, null, null)
    : await database.users.get(null, matrixId as string, null);
  userData.moodle_id = null;
  await database.users.set(userData);
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
    ? await database.users.get(discordId, null, null)
    : await database.users.get(null, matrixId as string, null);

  if (!userData.moodle_id) {
    return moodleProfile;
  }

  const moodleUserData = await getMoodleUser(userData.moodle_id);
  // log.debug(F, `moodleUserData: ${JSON.stringify(moodleUserData, null, 2)}`);
  const moodleEnrollments = await getMoodleEnrollments(moodleUserData);

  let completedCourses:string[] = [];
  let incompleteCourses:string[] = [];
  if (moodleEnrollments.length > 0) {
    // log.debug(F, `moodleEnrollments: ${JSON.stringify(moodleEnrollments, null, 2)}`);
    const moodleCourseCompletionData = await getMoodleCourseCompletion(moodleUserData, moodleEnrollments);
    // log.debug(F, `moodleCourseCompletionData: ${JSON.stringify(moodleCourseCompletionData, null, 2)}`);

    // Get an array of courses the user has completed
    completedCourses = moodleCourseCompletionData
      .filter(ccData => ccData.completion.completionstatus.completed)
      .map(course => course.course.fullname);

    // Get an array of courses the user has NOT completed
    incompleteCourses = moodleCourseCompletionData
      .filter(ccData => !ccData.completion.completionstatus.completed)
      .map(course => course.course.fullname);
  }

  moodleProfile = {
    fullName: `${moodleUserData.firstname} ${moodleUserData.lastname}`,
    institution: moodleUserData.institution,
    department: moodleUserData.department,
    profileImage: moodleUserData.profileimageurl,
    completedCourses,
    incompleteCourses,
  };
  return moodleProfile;
}
