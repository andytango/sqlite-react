export interface DbOpts {
  sqlDataUrl: string;
  sqlJsWorkerPath: string;
  worker?: Worker;
  getDbFile?: (s: string) => Promise<ArrayBuffer>;
}

export interface DbManager {
  init: () => Promise<void>;
  exec: DbExec;
  terminate: DbWorker["terminate"];
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

export type DbWorker = Worker;

export type DbQueryFormatter = (...a: any[]) => string;

export type SetDbQueryState<T> = React.Dispatch<
  React.SetStateAction<DbQueryState<T>>
>;

export interface DbContextState {
  db: DbManager;
  queries: DbQueries;
  sqlDataUrl: string;
  sqlJsWorkerPath: string;
}

export type DbQueries = Record<number, DbQueryState>;
export interface DbQueryState<T = unknown> {
  loading: boolean;
  results: T;
  error?: string;
  sql: string;
}

export type DbAction<T = unknown> =
  | {
      type: "init";
      db: DbManager;
      sqlDataUrl: string;
      sqlJsWorkerPath: string;
    }
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
