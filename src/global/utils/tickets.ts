import { user_tickets } from '@db/tripbot';
import { DateTime } from 'luxon';

/** Returns a user's open (non-closed/resolved/deleted) tripsit ticket, if any. */
export async function getOpenTicket(userId: string): Promise<user_tickets | null> {
  return db.user_tickets.findFirst({
    where: {
      user_id: userId,
      status: {
        not: {
          in: ['CLOSED', 'RESOLVED', 'DELETED'],
        },
      },
    },
  });
}

/** Computes ticket archive/delete timestamps: prod uses days, dev uses minutes. */
export function ticketExpiryDates(): { archivedAt: Date; deletedAt: Date } {
  const archivedAt = env.NODE_ENV === 'production'
    ? DateTime.local().plus({ days: 3 }).toJSDate()
    : DateTime.local().plus({ minutes: 1 }).toJSDate();

  const deletedAt = env.NODE_ENV === 'production'
    ? DateTime.local().plus({ days: 5 }).toJSDate()
    : DateTime.local().plus({ minutes: 2 }).toJSDate();

  return { archivedAt, deletedAt };
}
