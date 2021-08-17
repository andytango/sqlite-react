import { map } from "ramda";
import { useCallback, useState } from "react";
import { DbResult, DbInstanceGetter, DbQueryFormatter } from "./types";
import { mapResultToObjects } from "./helpers";

interface QueryState<T> {
  loading: boolean;
  results: T[];
}

type SetQueryState<T> = React.Dispatch<React.SetStateAction<QueryState<T>>>;

type Parameters<T> = T extends (...args: infer T) => any ? T : never;

const initialState = {
  loading: false,
  results: [],
};

export function makeDbQueryFactory(getDbInstance: DbInstanceGetter) {
  return function makeDbQuery<T>(formatter: DbQueryFormatter) {
    return () => {
      const [state, setState] = useState(initialState as QueryState<T>);
      const execQuery = useCallback(
        (...args: Parameters<typeof formatter>) => {
          setState({ loading: true, results: [] });
          performQuery({ formatter, setState, getDbInstance }, args);
        },
        [state, setState]
      ) as (...args: Parameters<typeof formatter>) => void;

      return [state, execQuery] as [QueryState<T>, typeof execQuery];
    };
  };
}

interface QueryParams<T> {
  formatter: DbQueryFormatter;
  setState: SetQueryState<T>;
  getDbInstance: DbInstanceGetter;
}

async function performQuery<T>(
  { formatter, setState, getDbInstance }: QueryParams<T>,
  args: any[]
) {
  const dbExec = await getDbInstance();
  const res = await dbExec(formatter(...args));
  const { results } = res;

  if (results) {
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

const processResults = map(mapResultToObjects) as <T>(a: DbResult[]) => T[];
