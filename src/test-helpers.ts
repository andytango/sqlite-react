import { DbResponse } from ".";
import { DbOpts } from "./types";
import { DbWorker } from "./worker";

export const dbOpts: DbOpts = {
  sqlDataUrl: "src/test-db.sqlite",
  sqlJsWorkerPath: "src/test-worker.js",
  getDbFile,
};

async function getDbFile() {
  return new ArrayBuffer(0);
}

export function createTestDbWorker(): DbWorker {
  const exec = jest.fn(() => Promise.resolve({ results: [] } as DbResponse));
  const open = jest.fn(() => Promise.resolve({} as DbResponse));
  const terminate = jest.fn(() => null);

  return { exec, open, terminate };
}
