import { DbQueryState, DbResultObjects } from ".";
import { DbContextValue } from "./context";
import { mapResultsToObjects as mapResultsToObjects } from "./helpers";
import { DbAction, DbQueryFormatter, DbResponse, DbResult } from "./types";

export function createDbQueryHook<T extends DbResultObjects>(
  useDbContext: () => DbContextValue,
  formatter: DbQueryFormatter,
  queryId: number
): () => [
  DbQueryState,
  (...params: Parameters<typeof formatter>) => Promise<void>
] {
  return () => {
    const context = useDbContext();
    const dbQueryState = context.queries[queryId] || {
      loading: true,
      results: [],
    };

    return [
      dbQueryState,
      (...params: Parameters<typeof formatter>) =>
        performQuery<T>(context, formatter, params, queryId),
    ];
  };
}

export async function performQuery<T extends DbResultObjects>(
  dbContext: DbContextValue,
  formatter: DbQueryFormatter,
  params: Parameters<typeof formatter>,
  queryId: number
) {
  const { dispatch, db } = dbContext;
  const sql = formatter(params);

  dispatch({ type: "query_exec", sql, queryId });
  const res = await db.exec(sql);
  dispatch(getActionForDbResponse<T>(queryId, res));
}

function getActionForDbResponse<T extends DbResultObjects>(
  queryId: number,
  response: DbResponse
): DbAction<T> {
  const { type } = response;

  switch (type) {
    case "result": {
      const { results } = response as { results: DbResult[] };
      return {
        type: "query_result",
        queryId,
        results: mapResultsToObjects<T>(results),
      };
    }
    case "error": {
      const { error } = response as { error: string };
      return { type: "query_error", queryId, error };
    }
    case "abort": {
      console.error("Query aborted");
      return { type: "query_error", queryId, error: "Query aborted" };
    }
  }
}
