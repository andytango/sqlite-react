export interface DbOpts {
  sqlDataUrl: string;
  sqlJsWorkerPath: string;
  worker?: Worker;
}

export type DbInstanceGetter = () => Promise<DbExec>;

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
  completedAt: number;
}

export interface QueryErrorEvent extends QueryEvent {
  error: string;
  completedAt: number;
}

export type DbEventMap = {
  dbInit: DbEvent;
  dbReady: DbEvent;
  queryStart: QueryStartEvent;
  queryResult: QueryResultEvent;
  queryError: QueryErrorEvent;
};
