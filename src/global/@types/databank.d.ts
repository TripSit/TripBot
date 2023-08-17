/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable max-classes-per-file */
declare module 'databank' {
  type Callback<T = void> = (err: Error | null, result?: T) => void;

  class Databank {
    constructor(params: any);

    static localDriver(driver: string): string;
    static register(name: string, cls: any): void;
    static deepProperty(object: any, property: string): any;
    static get(driver: string, params: any): Databank;

    connect(params: any, onCompletion: Callback): void;
    disconnect(onCompletion: Callback): void;
    create(type: string, id: any, value: any, onCompletion: Callback<any>): void;
    read(type: string, id: any, onCompletion: Callback<any>): void;
    update(type: string, id: any, value: any, onCompletion: Callback<any>): void;
    del(type: string, id: any, onCompletion: Callback): void;
    search(type: string, criteria: any, onResult: (value: any) => void, onCompletion: Callback): void;
    scan(type: string, onResult: (value: any) => void, onCompletion: Callback): void;
    save(type: string, id: any, value: any, onCompletion: Callback<any>): void;
    readAll(type: string, ids: any[], onCompletion: Callback<{ [key: string]: any }>): void;
    // ... add the rest of the methods
  }

  class DatabankError extends Error {
    constructor(message?: string);
  }

  class NotImplementedError extends DatabankError {
    constructor();
  }

  // ... add the rest of the error classes

  export {
    Databank,
    DatabankError,
    NotImplementedError,
    // ... export the rest of the error classes
  };
}
