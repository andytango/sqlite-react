export interface DbOpts {
  sqlDataUrl: string;
  sqlJsWorkerPath: string;
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
