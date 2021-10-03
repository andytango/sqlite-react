import { DbContextValue } from "./context";
import { mapResultToObjects } from "./helpers";
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
