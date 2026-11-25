import type { Message, PartialMessage } from 'discord.js';
import { deleteBestOfMessages, deleteChannelMessages } from './privacyDeletion';

const F = f(__filename);

/** Deletes the Best Of channel copy of a deleted message, then its record. */
async function removeBestOfCopy(messageId: string): Promise<void> {
  const entry = await db.best_of.findUnique({ where: { message_id: messageId } });
  if (!entry) return;
  // The record is how the copy is found, so it is only removed once the copy is gone.
  await deleteBestOfMessages([messageId]);
  await db.best_of.delete({ where: { message_id: messageId } });
}

/** Deletes saved quotes of a deleted message and their copies in the quote log. */
async function removeQuoteCopies(messageId: string): Promise<void> {
  const quotes = await db.quotes.findMany({
    where: { url: { endsWith: `/${messageId}` } },
    select: { id: true, url: true },
  });
  if (quotes.length === 0) return;
  const urls = quotes.map(quote => quote.url);
  await deleteChannelMessages(
    env.CHANNEL_QUOTE_LOG,
    logged => urls.some(url => JSON.stringify(logged.embeds ?? []).includes(url)),
  );
  await db.quotes.deleteMany({ where: { id: { in: quotes.map(quote => quote.id) } } });
}

/**
 * When a message is deleted on Discord, TripBot deletes the copies it made: the Best Of post and its record, and saved
 * quotes with their quote-log posts. Each kind is attempted separately so one failure does not block the other.
 */
export async function removeDeletedMessageCopies(message: Message | PartialMessage): Promise<void> {
  try {
    await removeBestOfCopy(message.id);
  } catch (error) {
    log.error(F, `Could not remove the Best Of copy of deleted message ${message.id}: ${error}`);
  }
  try {
    await removeQuoteCopies(message.id);
  } catch (error) {
    log.error(F, `Could not remove saved quotes of deleted message ${message.id}: ${error}`);
  }
}

export default removeDeletedMessageCopies;
