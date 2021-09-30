import { createContext, useReducer } from "react";
import { DbOpts } from ".";
import { createDbManager } from "./db-manager";
import { reducer } from "./reducer";
import { DbAction, DbContextState } from "./types";

export interface DbContextValue extends DbContextState {
  dispatch: React.Dispatch<DbAction>;
}

export function createDbContext() {
  const context = createContext<null | DbContextValue>(null);
  context.displayName = "DbContext";

  return context;
}

export function useContextState(props: DbOpts) {
  return useReducer(reducer, createInitialContextState(props));
}

export function createInitialContextState(opts: DbOpts): DbContextState {
  const { sqlDataUrl, sqlJsWorkerPath } = opts;
  return {
    sqlDataUrl,
    sqlJsWorkerPath,
    db: createDbManager(opts),
    queries: {},
  };
}
