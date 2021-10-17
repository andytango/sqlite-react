import { useEffect, useMemo, useReducer, useRef } from "react";
import { DbEventEmitter } from ".";
import { reducer } from "./reducer";
import { DbContextState, DbOpts, DispatchDbAction } from "./types";
import { createDbWorker } from "./worker";

export function useDb(opts: DbOpts, emitter: DbEventEmitter) {
  const [state, dispatch] = useDbState(opts, emitter);
  const contextValue = useMemo(
    () => ({ ...state, dispatch }),
    [state, dispatch]
  );

  useDbTerminateEffect(state, emitter);
  useDbChangeEffect(opts, dispatch, emitter);

  return contextValue;
}

function useDbState(props: DbOpts, emitter: DbEventEmitter) {
  return useReducer(reducer, props, initContext(emitter));
}

export function initContext(emitter: DbEventEmitter) {
  return (opts: DbOpts) => {
    const { dbWorkerFactory = createDbWorker } = opts;
    const db = dbWorkerFactory(opts);

    emitter.emit("dbInit", opts);

    db.init().then(() => {
      emitter.emit("dbReady");
    });

    return { ...opts, queries: {}, db } as DbContextState;
  };
}

function useDbTerminateEffect(state: DbContextState, emitter: DbEventEmitter) {
  return useEffect(
    () => () => {
      state.db.terminate();
      emitter.emit("dbTerminate");
    },
    [state.db]
  );
}

function useDbChangeEffect(
  opts: DbOpts,
  dispatch: DispatchDbAction,
  emitter: DbEventEmitter
) {
  const didMount = useDidMount();

  return useEffect(() => {
    if (didMount) {
      dispatch({ type: "init", ...initContext(emitter)(opts) });
    }
  }, [opts]);
}

function useDidMount() {
  const mountRef = useRef(false);

  useEffect(() => {
    mountRef.current = true;
  }, []);

  return mountRef.current;
}
