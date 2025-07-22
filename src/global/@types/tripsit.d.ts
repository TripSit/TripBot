import type { Drug, Status } from 'tripsit_drug_db';

export interface ComboDefinition {
  color: string;
  definition: string;
  emoji: string;
  status: Status;
  thumbnail: string;
}

export type DrugData = Record<string, Drug>;
