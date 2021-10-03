import React, { createContext, useReducer } from "react";
import { reducer } from "./reducer";
import { DbAction, DbContextState, DbInitQueue, DbOpts } from "./types";
import { createDbWorker } from "./worker";

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
  const { dbWorkerFactory = createDbWorker } = opts;

  return {
    ...opts,
    queries: {},
    db: dbWorkerFactory(opts),
    isLoading: false,
    isReady: false,
    initQueue: [] as DbInitQueue,
  };
}
