import { initDb } from "./init";
import { DbOpts } from "./types";
import Worker from "web-worker";

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
  const fn = jest.spyOn(worker, "postMessage");
  const dbInit = () => initDb({ ...dbOpts, worker });

  return { worker, dbInit, fn };
}
