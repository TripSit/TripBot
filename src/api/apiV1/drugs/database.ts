/* eslint-disable @typescript-eslint/no-explicit-any */
import databank from 'databank';

// const F = f(__filename);

const { Databank } = databank;

class DatabaseDriver {
  config: any;

  databank: any;

  constructor() {
    this.databank = null;
  }

  createDB(name: any, driver: any, schema: any, callback: any) {
    // console.log(F, `name: ${name}, driver: ${driver}, schema: ${JSON.stringify(schema)}`);
    const params = {
      schema,
      host: '',
      dir: '',
    };

    if (driver === 'redis') params.host = 'tripbot_redis';
    if (driver === 'disk') params.dir = 'db';

    this.databank = Databank.get(driver, params);
    this.databank.connect({}, (err: Error) => {
      if (err) {
        // console.log(`Didn't manage to connect to the data source - ${err}`);
      } else {
        callback(this.databank);
      }
    });
  }
}

export default DatabaseDriver;
