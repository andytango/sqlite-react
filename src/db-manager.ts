import { createDbEventEmitter, DbEventEmitter } from "./db-event-emitter";
import { createDbWorker, DbWorker } from "./db-worker";
import { DbExec, DbOpts, DbResponse } from "./types";

interface DbManager extends DbEventEmitter {
  init: () => Promise<void>;
  exec: DbExec;
  terminate: DbWorker["terminate"];
}

interface Context extends DbOpts {
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
  const { terminate } = dbWorker;
  let queryIdSec = 0;

  async function init() {
    await getInstance(context);
  }

  function exec(sql: string) {
    return execQuery(context, sql, queryIdSec++);
  }

  return { ...emitter, init, exec, terminate };
}

function createInitialState(opts: DbOpts): Context {
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

function getInstance(context: Context) {
  const { dbInstance, isDbInitialising } = context;

  if (dbInstance) {
    return Promise.resolve(dbInstance);
  }

  if (isDbInitialising) {
    return new Promise(enqueueDbInitCallback(context));
  }

  return initDb(context);
}

function enqueueDbInitCallback(context: Context) {
  return (res: (dbExec: DbExec) => void) =>
    context.onInitialised.push((dbExec) => res(dbExec));
}

async function initDb(context: Context): Promise<DbExec> {
  setDbInitialising(context);
  await loadSqliteFile(context);
  setDbReady(context);

  return setupDbExec(context);
}

function setDbInitialising(context: Context) {
  const { emitter, sqlDataUrl, sqlJsWorkerPath } = context;
  context.isDbInitialising = true;
  emitter.emit<"dbInit">("dbInit", { sqlDataUrl, sqlJsWorkerPath });
}

function execDbInitCallbacks(context: Context, exec: DbExec) {
  context.onInitialised.forEach((fn) => fn(exec));
  context.onInitialised = [];
}

async function loadSqliteFile(context: Context) {
  const { dbWorker, sqlDataUrl, getDbFile } = context;
  const sqlFile: ArrayBuffer = await getDbFile(sqlDataUrl);
  await dbWorker.open(sqlFile);
}

function setDbReady(context: Context) {
  const { emitter, sqlDataUrl, sqlJsWorkerPath } = context;
  context.isDbInitialising = false;
  emitter.emit<"dbReady">("dbReady", { sqlDataUrl, sqlJsWorkerPath });
}

function setupDbExec(context: Context) {
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

async function execQuery(context: Context, sql: string, queryId: number) {
  const dbExec = await getInstance(context);
  const startedAt = performance.now();

  emitQueryStartEvent(context, sql, queryId, startedAt);
  const res = await dbExec(sql);
  emitQueryCompleteEvents(context, sql, queryId, startedAt, res);

  return res;
}

function emitQueryStartEvent(
  context: Context,
  sql: string,
  queryId: number,
  startedAt: number
) {
  const { emitter, sqlDataUrl, sqlJsWorkerPath, dbWorker } = context;
  emitter.emit<"queryStart">("queryStart", {
    sqlDataUrl,
    sqlJsWorkerPath,
    queryId: queryId.toString(),
    sql,
    startedAt,
  });
}

function emitQueryCompleteEvents(
  context: Context,
  sql: string,
  queryId: number,
  startedAt: number,
  res: DbResponse
) {
  const { emitter } = context;
  const { error, results } = res;
  const base = getQueryCompleteEventBase(context, queryId, sql, startedAt);

  if (error) {
    emitter.emit<"queryError">("queryError", { ...base, error });
  } else if (results) {
    emitter.emit<"queryResult">("queryResult", { ...base, results });
  }
}
function getQueryCompleteEventBase(
  context: Context,
  queryId: number,
  sql: string,
  startedAt: number
) {
  const { sqlDataUrl, sqlJsWorkerPath } = context;
  return {
    sqlDataUrl,
    sqlJsWorkerPath,
    queryId: queryId.toString(),
    sql,
    startedAt,
    completedAt: performance.now(),
  };
}
