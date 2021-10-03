import { initDb } from "./init";
import { DbOpts } from "./types";
import Worker from "web-worker";
import { createDbWorker } from "./worker";

export const dbOpts: DbOpts = {
  sqlDataUrl: "src/test-db.sqlite",
  sqlJsWorkerPath: "src/test-worker.js",
  getDbFile,
};

async function getDbFile() {
  return new ArrayBuffer(0);
}

export function getTestWorker() {
  return new Worker(dbOpts.sqlJsWorkerPath);
}

export function createTestDbManager() {
  const worker = getTestWorker();
  const dbWorker = createDbWorker({ ...dbOpts, worker });
  const fn = jest.spyOn(worker, "postMessage");
  const dbInit = () => initDb(dbOpts, dbWorker);

  return { worker, dbInit, fn };
}
