import { DbOpts } from "./types";
import { createDbWorker, DbWorker } from "./worker";

interface Context extends DbOpts {
  dbWorker: DbWorker;
  getDbFile: (s: string) => Promise<ArrayBuffer>;
}

export async function initDb(opts: DbOpts): Promise<DbWorker> {
  const context = createInitContext(opts);
  await loadSqliteFile(context);
  return context.dbWorker;
}

function createInitContext(opts: DbOpts): Context {
  const dbWorker = createDbWorker(opts);
  const { getDbFile = fetchDbFile } = opts;

  return { ...opts, dbWorker, getDbFile };
}

async function fetchDbFile(url: string) {
  const res = await fetch(url);
  return res.arrayBuffer();
}

async function loadSqliteFile(context: Context) {
  const { dbWorker, sqlDataUrl, getDbFile } = context;
  const sqlFile: ArrayBuffer = await getDbFile(sqlDataUrl);
  await dbWorker.open(sqlFile);
}
