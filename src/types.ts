import { EventEmitter } from "@andytango/ts-event-emitter";

export type DbEventEmitter = EventEmitter<DbEventMap>;

export interface DbOpts {
  sqlDataUrl: string;
  sqlJsWorkerPath: string;
  worker?: Worker;
  getDbFile?: (s: string) => Promise<ArrayBuffer>;
}

export interface DbManager extends DbEventEmitter {
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

export interface DbQueryState<T> {
  loading: boolean;
  results: T[];
}

export type SetDbQueryState<T> = React.Dispatch<
  React.SetStateAction<DbQueryState<T>>
>;

export interface DbEvent extends DbOpts {}

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
  dbInit: DbEvent;
  dbReady: DbEvent;
  queryStart: QueryStartEvent;
  queryResult: QueryResultEvent;
  queryError: QueryErrorEvent;
};

export interface DbContextState {
  db: DbManager;
  queries: DbQueries;
  sqlDataUrl: string;
  sqlJsWorkerPath: string;
}

export type DbQueries = Record<number, DbQueryState<unknown>>;
export interface DbQueryState<T> {
  loading: boolean;
  results: T[];
  error?: string;
  sql: string;
}

export type DbAction =
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
      results: unknown[];
    };
