import Worker from "web-worker";
import { DbOpts, DbResponse } from "./types";
import { createDbWorker, DbWorker } from "./worker";

export const dbOpts: DbOpts = {
  sqlDataUrl: "example-db-file-path.sqlite",
  sqlJsWorkerPath: "src/test-web-worker.js",
  getDbFile,
};

async function getDbFile() {
  return new ArrayBuffer(0);
}

export function createTestDbWorker() {
  const webWorker = new Worker(dbOpts.sqlJsWorkerPath);
  const dbWorker = createDbWorker({ ...dbOpts, webWorker });

  return { dbWorker, webWorker };
}

export function createMockDbWorker(): DbWorker {
  const init = jest.fn(() => Promise.resolve<void>(undefined));
  const exec = jest.fn(() => Promise.resolve({ results: [] } as DbResponse));
  const terminate = jest.fn(() => null);

  return { init, exec, terminate };
}
