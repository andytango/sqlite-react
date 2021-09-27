import { DbOpts } from "./types";
import Worker from "web-worker";

export async function createDbWorker(opts: DbOpts) {
  const worker = initWebWorker(opts);

  function exec(action: string, payload = {}) {
    return execWorker(worker, action, payload);
  }

  function terminate() {
    worker.terminate();
  }

  return { exec, terminate };
}

function initWebWorker(opts: DbOpts) {
  const { worker = new Worker(opts.sqlJsWorkerPath) } = opts;
  addEventListeners(worker);

  return worker;
}

function addEventListeners(worker: Worker) {
  worker.addEventListener("message", handleMessage);
  worker.addEventListener("error", handleError);
}

function handleMessage(e: MessageEvent) {
  console.debug("[DB-WORKER]", e.data);
}

function handleError(e: ErrorEvent) {
  console.error("[DB-WORKER]", e.error);
}

function execWorker(worker: Worker, action: string, payload: {}) {
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
    new Promise<void>((res) => {
      setTimeout(() => {
        console.error(`DB Message Timeout`, message);
        res();
      }, 1e3);
    }),
  ]);
}

let messageId = 0;

function getNewMessageId() {
  return messageId++;
}
