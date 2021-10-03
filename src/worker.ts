import Worker from "web-worker";
import { DbOpts, DbResponse } from "./types";

export type DbWorkerFactory = typeof createDbWorker;
export type DbWorker = ReturnType<DbWorkerFactory>;

export function createDbWorker(opts: DbOpts) {
  const worker = initWebWorker(opts);

  async function init() {
    openDbFile(worker, opts);
  }

  function exec(sql: string) {
    return performAction(worker, "exec", { sql });
  }

  function terminate() {
    worker.terminate();
  }

  return { init, exec, terminate };
}

function initWebWorker(opts: DbOpts) {
  const worker = opts.webWorker || new Worker(opts.sqlJsWorkerPath);
  addEventListeners(worker);

  return worker;
}

function addEventListeners(worker: Worker) {
  worker.addEventListener("error", handleError);
}

function handleError(e: ErrorEvent) {
  console.error("[DB-WORKER] Error:", e.error);
}

async function openDbFile(worker: Worker, opts: DbOpts) {
  const { sqlDataUrl, getDbFile = fetchDbFile } = opts;
  const buffer: ArrayBuffer = await getDbFile(sqlDataUrl);
  return await performAction(worker, "open", { buffer });
}

async function fetchDbFile(url: string) {
  const res = await fetch(url);
  return res.arrayBuffer();
}

type WorkerActionPayload = { sql: string } | { buffer: ArrayBuffer };

function performAction(
  worker: Worker,
  action: string,
  payload: WorkerActionPayload
) {
  const id = getNewMessageId();
  const message = { id, action, ...payload };

  return Promise.race([
    new Promise((resolve) => {
      worker.postMessage(message);

      const handleResponse = (event: MessageEvent) => {
        if (event.data.id === id) {
          worker.removeEventListener("message", handleResponse);
          resolve(event.data);
        }
      };

      worker.addEventListener("message", handleResponse);
    }),
    new Promise<void>((_, rej) => {
      setTimeout(() => {
        console.error(`[DB-WORKER] Message timeout`, message);
        rej();
      }, 3e3);
    }),
  ]) as Promise<DbResponse>;
}

let messageId = 0;

function getNewMessageId() {
  return messageId++;
}
