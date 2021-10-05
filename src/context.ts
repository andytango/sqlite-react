import React, { createContext } from "react";
import { DbAction, DbContextState } from "./types";

export interface DbContextValue extends DbContextState {
  dispatch: React.Dispatch<DbAction>;
}

export function createDbContext() {
  const context = createContext<null | DbContextValue>(null);
  context.displayName = "DbContext";
  return context;
}
