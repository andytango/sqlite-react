import { useEffect, useMemo, useReducer, useRef } from "react";
import { reducer } from "./reducer";
import { DbContextState, DbOpts, DispatchDbAction } from "./types";
import { createDbWorker } from "./worker";

export function useDb(opts: DbOpts) {
  const [state, dispatch] = useDbState(opts);
  const contextValue = useMemo(
    () => ({ ...state, dispatch }),
    [state, dispatch]
  );

  useDbTerminateEffect(state);
  useDbChangeEffect(opts, dispatch);

  return contextValue;
}

function useDbState(props: DbOpts) {
  return useReducer(reducer, props, initContext);
}

export function initContext(opts: DbOpts): DbContextState {
  const { dbWorkerFactory = createDbWorker } = opts;
  const db = dbWorkerFactory(opts);

  db.init();

  return { ...opts, queries: {}, db };
}

function useDbTerminateEffect(state: DbContextState) {
  return useEffect(
    () => () => {
      state.db.terminate();
    },
    [state.db.terminate]
  );
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

  return mountRef.current;
}
