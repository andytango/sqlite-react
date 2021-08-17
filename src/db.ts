import {
  DbExec,
  DbInstanceGetter,
  DbOpts,
  DbResponse,
  DbWorker,
} from "./types";

type SqliteFile = ArrayBuffer;

interface DbContext extends DbOpts {
  dbInstance: DbExec | null;
  isDbInitialising: boolean;
  onInitialised: ((dbExec: DbExec) => void)[];
}

export function createDbInstance(opts: DbOpts): DbInstanceGetter {
  const context = createDbInstanceContext(opts) as DbContext;
  return () => getDbInstance(context);
}

function createDbInstanceContext(opts: DbOpts): DbContext {
  const { sqlDataUrl, sqlJsWorkerPath } = opts;
  return {
    dbInstance: null,
    isDbInitialising: false,
    onInitialised: [],
    sqlDataUrl,
    sqlJsWorkerPath,
  };
}

function getDbInstance(context: DbContext): Promise<DbExec> {
  const { dbInstance, isDbInitialising } = context;

  if (dbInstance) {
    return Promise.resolve(dbInstance);
  }

  if (isDbInitialising) {
    return new Promise(enqueueDbInitCallback(context));
  }

  return initDb(context);
}

function enqueueDbInitCallback(context: DbContext) {
  return (res: (dbExec: DbExec) => void) =>
    context.onInitialised.push((dbExec) => res(dbExec));
}

async function initDb(context: DbContext): Promise<DbExec> {
  context.isDbInitialising = true;
  const worker = initWorker(context.sqlJsWorkerPath);
  await loadSqliteFile(worker, context.sqlDataUrl);
  console.log("[DB] Loaded file");
  context.isDbInitialising = false;

  const newInstance = createDbInterface(worker);
  context.dbInstance = newInstance;
  context.onInitialised.forEach((fn) => fn(newInstance));
  context.onInitialised = [];

  return context.dbInstance;
}

function initWorker(workerPath: string) {
  const worker = new Worker(workerPath) as DbWorker;

  worker.addEventListener("message", handleworkerMessage);
  worker.addEventListener("error", handleWorkerError);

  return worker;
}

function handleworkerMessage(e: MessageEvent) {
  console.debug("[DB]", e.data);
}

function handleWorkerError(e: ErrorEvent) {
  console.error("[DB]", e.error);
}

async function loadSqliteFile(worker: DbWorker, sqlDataUrl: string) {
  const t0 = performance.now();
  const res = await fetch(sqlDataUrl);
  const sqlFile: SqliteFile = await res.arrayBuffer();
  console.info(`[DB] Database downloaded in ${getMsElapsedSince(t0)}`);

  console.info(`Database size: ${(sqlFile.byteLength / 1e6).toPrecision(4)}MB`);
  const t1 = performance.now();
  await openDb(worker, sqlFile);
  console.info(`[DB] Database loaded in ${getMsElapsedSince(t1)}`);
}

function openDb(worker: DbWorker, sqlFile: SqliteFile) {
  return performWorkerAction(worker, "open", { buffer: sqlFile });
}

function createDbInterface(worker: DbWorker) {
  return async (sql: string) => {
    console.debug("[DB] Performing query", sql);
    const { error, results } = await performWorkerAction(worker, "exec", {
      sql,
    });
    return { error, results };
  };
}

function performWorkerAction(
  worker: DbWorker,
  action: string,
  payload = {}
): Promise<DbResponse> {
  const id = getNewMessageId();
  return new Promise((resolve) => {
    const t0 = performance.now();
    worker.postMessage({ id, action, ...payload });

    const handleResponse = (event: MessageEvent) => {
      if (event.data.id === id) {
        console.info(`[DB] Query execution: ${getMsElapsedSince(t0)}`);
        worker.removeEventListener("message", handleResponse);
        resolve(event.data);
      }
    };

    worker.addEventListener("message", handleResponse);
  });
}

let messageId = 0;

function getNewMessageId() {
  return messageId++;
}

function getMsElapsedSince(since: number) {
  return formatTimeMs(performance.now() - since);
}

function formatTimeMs(ms: number) {
  return `${Math.round(ms)}ms`;
}
