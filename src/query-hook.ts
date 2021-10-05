import { DbContextValue } from "./context";
import { mapResultToObjects as mapResultsToObjects } from "./helpers";
import { DbQueryFormatter, DbResponse, DbAction } from "./types";

export function createDbQueryHook<T extends [...any]>(
  useDbContext: () => DbContextValue,
  formatter: DbQueryFormatter,
  queryId: number
) {
  return (...params: Parameters<typeof formatter>) => {
    const context = useDbContext();
    const dbQueryState = context.queries[queryId] || {
      loading: true,
      results: [],
    };
    const sql = formatter(...params);

    return [dbQueryState, () => performQuery<T>(context, sql, queryId)];
  };
}

export async function performQuery<T>(
  dbContext: DbContextValue,
  sql: string,
  queryId: number
) {
  const { dispatch, db } = dbContext;

  dispatch({ type: "query_exec", sql, queryId });
  const res = await db.exec(sql);
  return dispatch(getActionForDbResponse<T>(queryId, res));
}

function getActionForDbResponse<T>(
  queryId: number,
  response: DbResponse
): DbAction<T> {
  const { type } = response;

  switch (type) {
    case "result": {
      return {
        type: "query_result",
        queryId,
        results: mapResultsToObjects(response.results) as T,
      };
    }
    case "error": {
      const { error } = response;
      return { type: "query_error", queryId, error };
    }
    case "abort": {
      console.error("Query aborted");
      return { type: "query_error", queryId, error: "Query aborted" };
    }
  }
}
