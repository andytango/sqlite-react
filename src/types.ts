import { DbWorker } from "./worker";

export interface DbOpts {
  sqlDataUrl: string;
  sqlJsWorkerPath: string;
  worker?: Worker;
  getDbFile?: (s: string) => Promise<ArrayBuffer>;
}

export interface DbResponse {
  error?: string;
  results?: DbResult[];
}

export interface DbResult {
  columns: string[];
  values: [][];
}

export type DbExec = (sql: string) => Promise<DbResponse>;

export type DbQueryFormatter = (...a: any[]) => string;

export type SetDbQueryState<T> = React.Dispatch<
  React.SetStateAction<DbQueryState<T>>
>;

export interface DbContextState extends DbOpts {
  queries: DbQueries;
  exec: DbExec;
}

export type DbInitQueue = DbIinitCallback[];

export type DbIinitCallback = () => void;

export type DbQueries = Record<number, DbQueryState>;
export interface DbQueryState<T = unknown> {
  loading: boolean;
  results: T;
  error?: string;
  sql: string;
}

export type DbAction<T = unknown> =
  | ({ type: "init" } & DbContextState)
  | {
      type: "query_exec";
      queryId: number;
      sql: string;
    }
  | {
      type: "query_error";
      queryId: number;
      error: string;
    }
  | {
      type: "query_result";
      queryId: number;
      results: T;
    };
