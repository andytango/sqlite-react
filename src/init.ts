import { DbInitQueue, DbOpts } from "./types";
import { DbWorker } from "./worker";

export async function initDb(opts: DbOpts, worker: DbWorker) {
  const { sqlDataUrl, getDbFile = fetchDbFile } = opts;
  const sqlFile: ArrayBuffer = await getDbFile(sqlDataUrl);
  await worker.open(sqlFile);
}

async function fetchDbFile(url: string) {
  const res = await fetch(url);
  return res.arrayBuffer();
}
