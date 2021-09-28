import Worker from "web-worker";
import { DbResponse } from ".";
import { DbOpts } from "./types";

export type DbWorker = ReturnType<typeof createDbWorker>;

export function createDbWorker(opts: DbOpts) {
  const worker = initWebWorker(opts);

  function exec(sql: string) {
    return performAction(worker, "exec", { sql });
  }

  function open(buffer: ArrayBuffer) {
    return performAction(worker, "open", { buffer });
  }

  function terminate() {
    worker.terminate();
  }

  return { exec, terminate, open };
}

function initWebWorker(opts: DbOpts) {
  const { worker = new Worker(opts.sqlJsWorkerPath) } = opts;
  addEventListeners(worker);

  return worker;
}

function addEventListeners(worker: Worker) {
  worker.addEventListener("error", handleError);
}

function handleError(e: ErrorEvent) {
  console.error("[DB-WORKER] Error:", e.error);
}

function performAction(worker: Worker, action: string, payload: {}) {
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
