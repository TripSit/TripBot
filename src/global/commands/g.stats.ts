import { DateTime } from 'luxon';

const F = f(__filename);

/* This command will be used to interact with the database regarding statistics
 Ideas for statistics:
 - How many times each command is used, and by whom
 - How many times people have broken the token game
 - Tripsit Threads
   - How long threads last
   - Who talked in the thread
   - Logs of threads put into #tripsitters
   - Record the survey score
   - Update survey?
 - Experience
   - New people to reach X milestone this day/week/month
   - How many people have reached X milestone
   - Changes since last snapshot
   - Send messages when people hit milestones, not just for #vip-lounge
*/

export default stats;

export async function stats():Promise<void> {
  log.debug(F, `stats started at ${DateTime.now().toISOTime()}`);
}
