import { createEventEmitter } from "@andytango/ts-event-emitter";
import React, { Dispatch, useContext, useEffect, useMemo, useRef } from "react";
import { DbEventMap } from ".";
import {
  createDbContext,
  DbContextValue,
  initContext,
  useContextState,
} from "./context";
import { mapResultToObjects } from "./helpers";
import { initDb } from "./init";
import {
  DbAction,
  DbContextState,
  DbOpts,
  DbQueryFormatter,
  DbResponse,
} from "./types";
import { DbWorker } from "./worker";

export function createDb() {
  const context = createDbContext();
  const emitter = createEventEmitter<DbEventMap>();
  let queryIdSeq = 0;

  function Provider(props: React.PropsWithChildren<DbOpts>) {
    const { children, ...opts } = props;
    const [state, dispatch] = useContextState(opts);
    const contextValue = useMemo(
      () => ({ ...state, dispatch }),
      [state, dispatch]
    );
    const didMount = useDidMount();

    useEffect(() => {
      if (didMount) {
        dispatch({ type: "init", ...initContext(opts) });
      }
    }, [opts]);

    useEffect(() => {
      const { isReady, isLoading, db } = state;

      if (!isReady && !isLoading) {
        init(opts, db, dispatch);
        emitter.emit<"dbInit">("dbInit", opts);
      }
    }, [state.isReady, state.isLoading, state.db]);

    useEffect(() => {
      const { isReady, initQueue } = state;

      if (isReady) {
        emitter.emit<"dbReady">("dbReady");
        initQueue.forEach((sql) =>
          performQuery(contextValue, sql, nextQueryId())
        );
      }
    }, [state.isReady, state.isLoading, contextValue]);

    useDbUnmountEffect(state);

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
    return createDbQueryHook(useDbContext, formatter, nextQueryId());
  }

  function nextQueryId(): number {
    return queryIdSeq++;
  }

  return { Provider, useDbContext, makeDbQuery };
}

function useDidMount() {
  const mountRef = useRef(false);

  useEffect(() => {
    mountRef.current = true;
  }, []);

  return useMemo(() => mountRef.current, [mountRef]);
}

async function init(opts: DbOpts, db: DbWorker, dispatch: Dispatch<DbAction>) {
  dispatch({ type: "load" });
  await initDb(opts, db);
  dispatch({ type: "ready" });
}

function useDbUnmountEffect(state: DbContextState) {
  return useEffect(() => () => state.db.terminate(), [state.db.terminate]);
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
    const sql = formatter(...params);

    return [dbQueryState, () => performQuery<T>(context, sql, queryId)];
  };
}

async function performQuery<T>(
  dbContext: DbContextValue,
  sql: string,
  queryId: number
) {
  const { dispatch, db, isReady } = dbContext;

  if (isReady) {
    dispatch({ type: "query_exec", sql, queryId });
    const res = await db.exec(sql);
    return dispatch(getActionForDbResponse<T>(queryId, res));
  }

  dispatch({ type: "query_enqueue", sql });
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
