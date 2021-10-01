import React, { useContext, useEffect } from "react";
import { DbAction, DbContextState, DbQueryFormatter, DbResponse } from ".";
import { createDbContext, DbContextValue, useContextState } from "./context";
import { mapResultToObjects } from "./helpers";
import { DbOpts } from "./types";

export function createDb() {
  const context = createDbContext();
  let queryIdSeq = 0;

  function Provider(props: React.PropsWithChildren<DbOpts>) {
    const { children, ...opts } = props;
    const [state, dispatch] = useContextState(opts);

    useDbUnmountEffect(state);

    return (
      <context.Provider value={{ ...state, dispatch }} {...{ children }} />
    );
  }

  function useDbContext() {
    const value = useContext(context);

    if (!value) {
      throw new Error("Attempted to access uninitialised db context");
    }

    return value;
  }

  function makeDbQuery<T extends [...any]>(formatter: DbQueryFormatter) {
    return createDbQueryHook(useDbContext, formatter, queryIdSeq++);
  }

  return { Provider, useDbContext, makeDbQuery };
}

function useDbUnmountEffect(state: DbContextState) {
  return useEffect(() => () => state.db.terminate(), [state.db]);
}

function createDbQueryHook<T extends []>(
  useDbContext: () => DbContextValue,
  formatter: DbQueryFormatter,
  queryId: number
) {
  return (...params: Parameters<typeof formatter>) => {
    const context = useDbContext();
    const dbQueryState = context.queries[queryId] || {
      loading: true,
      results: [] as T,
    };

    return [
      dbQueryState,
      () => performQuery<T>(context, formatter, params, queryId),
    ];
  };
}

async function performQuery<T>(
  dbContext: DbContextValue,
  formatter: DbQueryFormatter,
  params: Parameters<typeof formatter>,
  queryId: number
) {
  const { dispatch, db, queries } = dbContext;
  const sql = formatter(...params);

  dispatch({ type: "query_exec", sql, queryId });

  const res = await db.exec(sql);

  dispatch(getActionForDbResponse<T>(queryId, res));
}

function getActionForDbResponse<T>(
  queryId: number,
  response: DbResponse
): DbAction<T> {
  const { results, error } = response;

  if (error) {
    return { type: "query_error", queryId, error };
  }

  if (results) {
    return {
      type: "query_result",
      queryId,
      results: mapResultToObjects(results) as T,
    };
  }

  console.error(response);

  throw new Error(`Unexpected db response for query id ${queryId}`);
}
