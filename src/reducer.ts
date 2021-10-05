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
