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
  getDbFile: (s: string) => Promise<ArrayBuffer>;
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
  const { getDbFile = fetchDbFile } = opts;

  return {
    ...opts,
    dbWorker,
    emitter,
    dbInstance: null,
    isDbInitialising: false,
    onInitialised: [],
    getDbFile,
  };
}

async function fetchDbFile(url: string) {
  const res = await fetch(url);
  return res.arrayBuffer();
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
  setDbInitialising(context);
  await loadSqliteFile(context);
  setDbReady(context);
  return setupDbExec(context);
}

function setDbInitialising(context: DbManagerContext) {
  const { emitter, sqlDataUrl, sqlJsWorkerPath } = context;
  context.isDbInitialising = true;
  emitter.emit("dbInit", { sqlDataUrl, sqlJsWorkerPath });
}

function execDbInitCallbacks(context: DbManagerContext, exec: DbExec) {
  context.onInitialised.forEach((fn) => fn(exec));
  context.onInitialised = [];
}

async function loadSqliteFile(context: DbManagerContext) {
  const { dbWorker, sqlDataUrl, getDbFile } = context;
  const sqlFile: ArrayBuffer = await getDbFile(sqlDataUrl);
  await dbWorker.open(sqlFile);
}

function setDbReady(context: DbManagerContext) {
  const { emitter, sqlDataUrl, sqlJsWorkerPath } = context;
  context.isDbInitialising = false;
  emitter.emit("dbReady", { sqlDataUrl, sqlJsWorkerPath });
}

function setupDbExec(context: DbManagerContext) {
  const { dbWorker } = context;
  const exec = createDbExec(dbWorker);

  context.dbInstance = exec;
  execDbInitCallbacks(context, exec);

  return exec;
}

function createDbExec(worker: DbWorker) {
  return async (sql: string) => {
    const { error, results } = await worker.exec(sql);
    return { error, results };
  };
}
