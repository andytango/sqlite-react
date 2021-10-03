import { DbWorker, DbWorkerFactory } from "./worker";

export interface DbOpts {
  sqlDataUrl: string;
  sqlJsWorkerPath: string;
  dbWorkerFactory?: DbWorkerFactory;
  getDbFile?: (s: string) => Promise<ArrayBuffer>;
  webWorker?: Worker;
}

interface QueryEvent extends DbOpts {
  queryId: string;
  sql: string;
}

export interface QueryStartEvent extends QueryEvent {
  startedAt: number;
}

export interface QueryResultEvent extends QueryEvent {
  results: DbResult[];
  startedAt: number;
  completedAt: number;
}

export interface QueryErrorEvent extends QueryEvent {
  error: string;
  startedAt: number;
  completedAt: number;
}

export type DbEventMap = {
  dbInit: DbOpts;
  dbReady: undefined;
  queryStart: QueryStartEvent;
  queryResult: QueryResultEvent;
  queryError: QueryErrorEvent;
};

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
  db: DbWorker;
  queries: DbQueries;
  isReady: boolean;
  isLoading: boolean;
  initQueue: DbInitQueue;
}

export type DbInitQueue = string[];

export type DbQueries = Record<number, DbQueryState>;
export interface DbQueryState<T = unknown> {
  loading: boolean;
  results: T;
  error?: string;
  sql: string;
}

export type DbAction<T = unknown> =
  | ({ type: "init" } & DbContextState)
  | { type: "load" }
  | { type: "ready" }
  | {
      type: "query_enqueue";
      sql: string;
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
