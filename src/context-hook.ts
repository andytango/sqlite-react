import { useEffect, useMemo, useRef } from "react";
import { DbContextValue, initContext, useContextState } from "./context";
import { performQuery } from "./query-hook";
import {
  DbContextState,
  DbEventEmitter,
  DbOpts,
  DispatchDbAction,
} from "./types";
import { DbWorker } from "./worker";

export function useDbState(
  opts: DbOpts,
  emitter: DbEventEmitter,
  nextQueryId: () => number
) {
  const [state, dispatch] = useContextState(opts);
  const contextValue = useMemo(
    () => ({ ...state, dispatch }),
    [state, dispatch]
  );

  useDbChangeEffect(opts, dispatch);
  useDbInitEffect(opts, state, dispatch, emitter);
  useDbReadyEffect(contextValue, emitter, nextQueryId);
  useDbTerminateEffect(state);

  return contextValue;
}

function useDbChangeEffect(opts: DbOpts, dispatch: DispatchDbAction) {
  const didMount = useDidMount();

  return useEffect(() => {
    if (didMount) {
      dispatch({ type: "init", ...initContext(opts) });
    }
  }, [opts]);
}

function useDidMount() {
  const mountRef = useRef(false);

  useEffect(() => {
    mountRef.current = true;
  }, []);

  return useMemo(() => mountRef.current, [mountRef]);
}

function useDbInitEffect(
  opts: DbOpts,
  state: DbContextState,
  dispatch: DispatchDbAction,
  emitter: DbEventEmitter
) {
  return useEffect(() => {
    const { isReady, isLoading, db } = state;

    if (!isReady && !isLoading) {
      init(db, dispatch);
      emitter.emit<"dbInit">("dbInit", opts);
    }
  }, [state.isReady, state.isLoading, state.db, dispatch]);
}

async function init(db: DbWorker, dispatch: DispatchDbAction) {
  dispatch({ type: "load" });
  await db.init();
  dispatch({ type: "ready" });
}

function useDbReadyEffect(
  contextValue: DbContextValue,
  emitter: DbEventEmitter,
  nextQueryId: () => number
) {
  useEffect(() => {
    const { isReady, initQueue } = contextValue;

    if (isReady) {
      emitter.emit<"dbReady">("dbReady");
      initQueue.forEach((sql) =>
        performQuery(contextValue, sql, nextQueryId())
      );
    }
  }, [contextValue, emitter, nextQueryId]);
}

function useDbTerminateEffect(state: DbContextState) {
  return useEffect(() => () => state.db.terminate(), [state.db.terminate]);
}
