import { Counting } from '../@types/database';
import { countingGet, countingSet } from '../utils/knex';

const F = f(__filename); // eslint-disable-line

// type CountingData = {
//   channelId: string;
//   hardcore: boolean;

//   currentNumber: number;
//   currentNumberMessageID: string;
//   currentNumberMessageDate: Date;
//   currentNumberMessageAuthor: string;

//   lastNumber: number | undefined;
//   lastNumberMessageID: string | undefined;
//   lastNumberMessageDate: Date | undefined;
//   lastNumberMessageAuthor: string | undefined;
//   lastNumberBrokenBy: string | undefined;
//   lastNumberBrokenDate: Date | undefined;

//   recordNumber: number;
//   recordNumberMessageID: string | undefined;
//   recordNumberMessageDate: Date | undefined;
//   recordNumberMessageAuthor: string | undefined;
//   recordNumberBrokenBy: string | undefined;
//   recordNumberBrokenDate: Date | undefined;
// };

// const countingData = [] as Counting[];

export async function countingGetG(
  channelID:string,
):Promise<Counting | undefined> {
  return countingGet(channelID);
}

export async function countingSetG(
  data: Counting,
):Promise<void> {
  await countingSet(data);
}
