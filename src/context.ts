import { createContext, useReducer } from "react";
import { initDb } from "./init";
import { reducer } from "./reducer";
import { DbAction, DbContextState, DbOpts } from "./types";

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
  const db = initDb(opts);

  db.init();

  return { sqlDataUrl, sqlJsWorkerPath, db, queries: {} };
}
