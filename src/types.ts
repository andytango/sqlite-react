import { EventEmitter } from "@andytango/ts-event-emitter";
import { Dispatch } from "react";
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

export type DbEventEmitter = EventEmitter<DbEventMap>;

export type DbEventMap = {
  dbInit: DbOpts;
  dbReady: undefined;
  queryStart: QueryStartEvent;
  queryResult: QueryResultEvent;
  queryError: QueryErrorEvent;
};

export type DbResponse =
  | { type: "result"; results: DbResult[]; id: number }
  | { type: "error"; error: string; id: number }
  | { type: "abort"; id: number };

export interface DbResult {
  columns: string[];
  values: [][];
}

export type DbResultObjects = Record<string, unknown>[];

export type DbExec = (sql: string) => Promise<DbResponse>;

export type DbQueryFormatter = (...a: any[]) => string;

export type SetDbQueryState<T> = React.Dispatch<
  React.SetStateAction<DbQueryState<T>>
>;

export interface DbContextState extends DbOpts {
  db: DbWorker;
  queries: DbQueries;
}

export type DbInitQueue = string[];

export type DbQueries = Record<number, DbQueryState>;
export interface DbQueryState<T = unknown> {
  loading: boolean;
  results: T;
  error?: string;
  sql: string;
}

export type DispatchDbAction = Dispatch<DbAction>;

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
