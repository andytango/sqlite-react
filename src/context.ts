import { createContext, useReducer } from "react";
import { DbInitQueue } from ".";
import { initDb } from "./init";
import { reducer } from "./reducer";
import { DbAction, DbContextState, DbOpts } from "./types";
import { createDbWorker, DbWorker } from "./worker";

export interface DbContextValue extends DbContextState {
  dispatch: React.Dispatch<DbAction>;
}

export function createDbContext() {
  const context = createContext<null | DbContextValue>(null);
  context.displayName = "DbContext";

  return context;
}

export function useContextState(props: DbOpts) {
  return useReducer(reducer, props, initContext);
}

export function initContext(opts: DbOpts): DbContextState {
  const db = createDbWorker(opts);
  const initQueue = [] as DbInitQueue;
  let isReady = false;

  async function getInstance() {
    return isReady ? db : enqeueueDbInitCallback(db, initQueue);
  }

  async function exec(sql: string) {
    const db = await getInstance();
    return db.exec(sql);
  }

  initDbWithCallbacks(opts, db, initQueue);

  return { ...opts, queries: {}, exec };
}

async function initDbWithCallbacks(
  opts: DbOpts,
  db: DbWorker,
  initQueue: DbInitQueue
) {
  await initDb(opts, db);
  initQueue.forEach((fn) => fn());
}

function enqeueueDbInitCallback(db: DbWorker, initQueue: DbInitQueue) {
  return new Promise<DbWorker>((res) => {
    initQueue.push(() => res(db));
  });
}
