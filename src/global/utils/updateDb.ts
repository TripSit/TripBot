import axios from 'axios';
import fs from 'fs';
import { Drug } from 'tripsit_drug_db';
import path from 'path';
import { GraphQLClient } from 'graphql-request';
import { PwSubstance } from '../@types/psychonaut';

const F = f(__filename);

const useCache = false;

async function updateDb(): Promise<void> {
  // log.debug(F, 'Updating database');

  // log.debug(F, '[getTSData] Starting!');

  const tsFilePath = path.join(__dirname, '../../../assets/data', 'drug_db_tripsit.json');

  // Check if the cache exists, and if so, use it.
  if (useCache && fs.existsSync(tsFilePath)) {
    const rawData = fs.readFileSync(tsFilePath);
    const data = JSON.parse(rawData.toString());
    log.info(F, `Using ${Object.keys(data).length} drugs from TripSit Cache!`);
  }

  // log.debug(F, 'Getting data from TripSit API!');

  const data = await axios.get('https://raw.githubusercontent.com/TripSit/drugs/main/drugs.json');
  const tsDrugData = data.data as {
    [key: string]: Drug
  };

  log.info(F, `Got ${Object.values(tsDrugData).length} drugs from TripSit API!`);

  fs.writeFile(tsFilePath, JSON.stringify(tsDrugData, null, 2), err => {
    if (err) {
      log.debug(F, `${err}`);
    }
  });

  // log.debug(F, `Saved data to ${tsFilePath}!`);

  const pwFilePath = path.join(__dirname, '../../../assets/data', 'drug_db_psychonaut.json');

  if (useCache && fs.existsSync(pwFilePath)) {
    const rawData = fs.readFileSync(pwFilePath);
    const pwData = JSON.parse(rawData.toString());
    log.info(F, `Using ${Object.keys(pwData).length} drugs from Psychonaut Cache!`);
  }

  const pwResponse = await new GraphQLClient('https://api.psychonautwiki.org').request(`
  {
    substances(limit: 1000) {
      url
      name
      summary
      addictionPotential
      toxicity
      crossTolerances
      commonNames
      class {chemical psychoactive}
      tolerance {full half zero}
      uncertainInteractions {name}
      unsafeInteractions {name}
      dangerousInteractions {name}
      roa {oral {name dose {units threshold heavy common {min max} light {min max} strong {min max}} duration { afterglow {min max units} comeup {min max units} duration {min max units} offset {min max units} onset {min max units} peak {min max units} total {min max units}} bioavailability {min max}} sublingual {name dose {units threshold heavy common {min max} light {min max} strong {min max}} duration { afterglow {min max units} comeup {min max units} duration {min max units} offset {min max units} onset {min max units} peak {min max units} total {min max units}} bioavailability {min max}} buccal {name dose {units threshold heavy common {min max} light {min max} strong {min max}} duration { afterglow {min max units} comeup {min max units} duration {min max units} offset {min max units} onset {min max units} peak {min max units} total {min max units}} bioavailability {min max}} insufflated {name dose {units threshold heavy common {min max} light {min max} strong {min max}} duration { afterglow {min max units} comeup {min max units} duration {min max units} offset {min max units} onset {min max units} peak {min max units} total {min max units}} bioavailability {min max}} rectal {name dose {units threshold heavy common {min max} light {min max} strong {min max}} duration { afterglow {min max units} comeup {min max units} duration {min max units} offset {min max units} onset {min max units} peak {min max units} total {min max units}} bioavailability {min max}} transdermal {name dose {units threshold heavy common {min max} light {min max} strong {min max}} duration { afterglow {min max units} comeup {min max units} duration {min max units} offset {min max units} onset {min max units} peak {min max units} total {min max units}} bioavailability {min max}} subcutaneous {name dose {units threshold heavy common {min max} light {min max} strong {min max}} duration { afterglow {min max units} comeup {min max units} duration {min max units} offset {min max units} onset {min max units} peak {min max units} total {min max units}} bioavailability {min max}} intramuscular {name dose {units threshold heavy common {min max} light {min max} strong {min max}} duration { afterglow {min max units} comeup {min max units} duration {min max units} offset {min max units} onset {min max units} peak {min max units} total {min max units}} bioavailability {min max}} intravenous {name dose {units threshold heavy common {min max} light {min max} strong {min max}} duration { afterglow {min max units} comeup {min max units} duration {min max units} offset {min max units} onset {min max units} peak {min max units} total {min max units}} bioavailability {min max}} smoked {name dose {units threshold heavy common {min max} light {min max} strong {min max}} duration { afterglow {min max units} comeup {min max units} duration {min max units} offset {min max units} onset {min max units} peak {min max units} total {min max units}} bioavailability {min max}}}    }
  }
  `) as any;

  const pwDrugData = pwResponse.substances as PwSubstance[];

  log.info(F, `Using ${pwDrugData.length} drugs from Psychonaut API!`);

  fs.writeFile(pwFilePath, JSON.stringify(pwDrugData, null, 2), err => {
    if (err) {
      log.debug(F, `${err}`);
    }
  });

  // log.debug(F, `Saved data to ${pwFilePath}!`);
}

export default updateDb;
