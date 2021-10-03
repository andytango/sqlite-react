import { DbAction, DbContextState } from "./types";

export function reducer(
  state: DbContextState,
  action: DbAction
): DbContextState {
  switch (action.type) {
    case "init": {
      const { type, ...newState } = action;
      return newState;
    }
    case "load": {
      return { ...state, isLoading: true };
    }
    case "ready": {
      return { ...state, isReady: true, isLoading: false };
    }
    case "query_enqueue": {
      return { ...state, initQueue: state.initQueue.concat(action.sql) };
    }
    case "query_exec": {
      const { queryId, sql } = action;
      return {
        ...state,
        queries: {
          ...state.queries,
          [queryId]: { loading: true, results: [], sql },
        },
      };
    }
    case "query_result": {
      const { queryId, results } = action;
      const { sql } = state.queries[queryId];
      return {
        ...state,
        queries: {
          ...state.queries,
          [queryId]: { loading: false, results, sql },
        },
      };
    }
    case "query_error": {
      const { queryId, error } = action;
      const { sql } = state.queries[queryId];
      return {
        ...state,
        queries: {
          ...state.queries,
          [queryId]: { loading: false, results: [], error, sql },
        },
      };
    }
  }
}
