import topics from '../assets/data/topics.json';

/**
 *
 * @return {string}
 */
export async function topic():Promise<any> {
  return topics[Math.floor(Math.random() * Object.keys(topics).length).toString() as keyof typeof topics];
};
