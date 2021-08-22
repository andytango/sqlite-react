import { last, pipe } from "ramda";
import { useCallback, useState } from "react";
import { mapResultToObjects } from "./helpers";
import {
  DbInstanceGetter,
  DbQueryFormatter,
  DbResult,
  DbQueryState,
  SetDbQueryState,
} from "./types";

type Parameters<T> = T extends (...args: infer T) => any ? T : never;

const initialState = {
  loading: false,
  results: [],
};

export function makeDbQueryFactory(getDbInstance: DbInstanceGetter) {
  return function makeDbQuery<T>(formatter: DbQueryFormatter) {
    return () => {
      const [state, setState] = useState(initialState as DbQueryState<T>);
      const execQuery = useCallback(
        (...args: Parameters<typeof formatter>) => {
          setState({ loading: true, results: [] });
          performQuery({ formatter, setState, getDbInstance }, args);
        },
        [state, setState]
      ) as (...args: Parameters<typeof formatter>) => void;

      return [state, execQuery] as [DbQueryState<T>, typeof execQuery];
    };
  };
}

interface QueryParams<T> {
  formatter: DbQueryFormatter;
  setState: SetDbQueryState<T>;
  getDbInstance: DbInstanceGetter;
}

async function performQuery<T>(
  { formatter, setState, getDbInstance }: QueryParams<T>,
  args: any[]
) {
  const dbExec = await getDbInstance();
  const res = await dbExec(formatter(...args));
  const { results } = res;

  if (results && results.length > 0) {
    setState({
      results: processResults(results),
      loading: false,
    });
  } else {
    setState({
      results: [],
      loading: false,
    });
  }
}

const processResults = pipe(last, mapResultToObjects) as <T>(
  a: DbResult[]
) => T[];
