const topics = require('../assets/data/topics.json');

export async function topic():Promise<any> {
  return topics[Math.floor(Math.random() * Object.keys(topics).length).toString()];
};
