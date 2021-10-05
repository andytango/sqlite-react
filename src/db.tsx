import { createEventEmitter } from "@andytango/ts-event-emitter";
import React, { useContext } from "react";
import { createDbContext } from "./context";
import { useDb } from "./db-hook";
import { createDbQueryHook } from "./query-hook";
import { DbEventMap, DbOpts, DbQueryFormatter } from "./types";

export function createDb() {
  const context = createDbContext();
  const emitter = createEventEmitter<DbEventMap>();
  let queryIdSeq = 0;

  function Provider(props: React.PropsWithChildren<DbOpts>) {
    const { children, ...opts } = props;
    const contextValue = useDb(opts);
    return <context.Provider value={contextValue} {...{ children }} />;
  }

  function useDbContext() {
    const value = useContext(context);

    if (!value) {
      throw new Error("Attempted to access uninitialised db context");
    }

    return value;
  }

  function makeDbQuery<T extends [...any]>(formatter: DbQueryFormatter) {
    return createDbQueryHook<T>(useDbContext, formatter, nextQueryId());
  }

  function nextQueryId(): number {
    return queryIdSeq++;
  }

  return { Provider, makeDbQuery, useDbContext, ...emitter };
}
