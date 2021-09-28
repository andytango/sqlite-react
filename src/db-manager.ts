import { DbInstanceGetter } from ".";
import { createDbEventEmitter, DbEventEmitter } from "./db-event-emitter";
import { createDbWorker, DbWorker } from "./db-worker";
import { DbExec, DbOpts } from "./types";

interface DbManager extends DbWorker, DbEventEmitter {
  getInstance: DbInstanceGetter;
}

interface DbManagerContext extends DbOpts {
  dbWorker: DbWorker;
  emitter: DbEventEmitter;
  dbInstance: DbExec | null;
  isDbInitialising: boolean;
  onInitialised: ((dbExec: DbExec) => void)[];
}

export function createDbManager(opts: DbOpts): DbManager {
  const context = createInitialState(opts);
  const { dbWorker, emitter } = context;

  function getInstance() {
    return getDbInstance(context);
  }

  return { ...dbWorker, ...emitter, getInstance };
}

function createInitialState(opts: DbOpts): DbManagerContext {
  const dbWorker = createDbWorker(opts);
  const emitter = createDbEventEmitter();
  return {
    ...opts,
    dbWorker,
    emitter,
    dbInstance: null,
    isDbInitialising: false,
    onInitialised: [],
  };
}

function getDbInstance(context: DbManagerContext) {
  const { dbInstance, isDbInitialising } = context;

  if (dbInstance) {
    return Promise.resolve(dbInstance);
  }

  if (isDbInitialising) {
    return new Promise(enqueueDbInitCallback(context));
  }

  return initDb(context);
}

function enqueueDbInitCallback(context: DbManagerContext) {
  return (res: (dbExec: DbExec) => void) =>
    context.onInitialised.push((dbExec) => res(dbExec));
}

async function initDb(context: DbManagerContext): Promise<DbExec> {
  const { emitter, dbWorker, sqlDataUrl, sqlJsWorkerPath } = context;
  emitter.emit("dbInit", { sqlDataUrl, sqlJsWorkerPath });
  context.isDbInitialising = true;

  // await loadSqliteFile(worker, context.sqlDataUrl);
  // console.log("[DB] Loaded file");
  context.isDbInitialising = false;
  emitter.emit("dbReady", { sqlDataUrl, sqlJsWorkerPath });

  const newInstance = createDbInterface(dbWorker);
  context.dbInstance = newInstance;
  context.onInitialised.forEach((fn) => fn(newInstance));
  context.onInitialised = [];

  return context.dbInstance;
}

function createDbInterface(worker: DbWorker) {
  return async (sql: string) => {
    console.debug("[DB] Performing query", sql);
    const { error, results } = await worker.exec(sql);
    return { error, results };
  };
}
