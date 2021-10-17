import Worker from "web-worker";
import { DbOpts, DbResponse } from "./types";

export type DbWorkerFactory = typeof createDbWorker;
export type DbWorker = ReturnType<DbWorkerFactory>;

type DbWorkerState = {
  worker: Worker;
  isReady: boolean;
  initQueue: PendingActions;
  terminateQueue: PendingActions;
  isTerminating: boolean;
  didTerminate: boolean;
};

type PendingActions = (() => Promise<void>)[];

export function createDbWorker(opts: DbOpts) {
  const state = createInitialState(opts);

  async function init() {
    return initDbWithCallbacks(state, opts);
  }

  async function exec(sql: string) {
    if (state.didTerminate) {
      throw new Error("[DB Worker] Cannot exec, worker was terminated");
    }

    return execWorker(state, sql);
  }

  async function terminate() {
    if (state.isTerminating) {
      throw new Error("[DB Worker] Already terminating");
    }

    if (state.didTerminate) {
      throw new Error("[DB Worker] Already terminated");
    }

    state.isTerminating = true;
    for (let i = 0; i < state.terminateQueue.length; i++) {
      await state.terminateQueue[i]();
    }
    state.terminateQueue = [];
    terminateWorker(state);
    state.isTerminating = false;
    state.didTerminate = true;
  }

  return { init, exec, terminate };
}

function createInitialState(opts: DbOpts) {
  return {
    worker: initWebWorker(opts),
    isReady: false,
    initQueue: [],
    isTerminating: false,
    didTerminate: false,
    terminateQueue: [],
  } as DbWorkerState;
}

async function initDbWithCallbacks(state: DbWorkerState, opts: DbOpts) {
  await openDbFile(state, opts);

  for (let i = 0; i < state.initQueue.length; i++) {
    await state.initQueue[i]();
  }

  state.isReady = true;
  state.initQueue = [];
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

async function openDbFile(state: DbWorkerState, opts: DbOpts) {
  const { sqlDataUrl, getDbFile = fetchDbFile } = opts;
  const buffer: ArrayBuffer = await getDbFile(sqlDataUrl);
  return performAction(state, "open", { buffer });
}

async function fetchDbFile(url: string) {
  const res = await fetch(url);
  return res.arrayBuffer();
}

type WorkerActionPayload = { sql: string } | { buffer: ArrayBuffer };

function execWorker(state: DbWorkerState, sql: string) {
  if (state.isReady) {
    return performQueryAction(state, sql);
  }

  return new Promise<DbResponse>((resolve) => {
    state.initQueue.push(async () => {
      const res = await performQueryAction(state, sql);
      resolve(res);
    });
  });
}

function performQueryAction(state: DbWorkerState, sql: string) {
  return performAction(state, "exec", { sql });
}

function performAction(
  state: DbWorkerState,
  action: string,
  payload: WorkerActionPayload
) {
  const { worker, terminateQueue } = state;
  const id = getNewMessageId();
  const message = { id, action, ...payload };

  return new Promise((resolve, reject) => {
    const handleTerminate = async () => {
      resolve({ type: "abort", id });
    };

    terminateQueue.push(handleTerminate);

    const handleResponse = (event: MessageEvent) => {
      if (event.data.id === id) {
        worker.removeEventListener("message", handleResponse);
        removePendingAction(terminateQueue, handleTerminate);
        resolve({ type: "result", ...event.data });
      }
    };

    worker.addEventListener("message", handleResponse);
    worker.postMessage(message);

    setTimeout(() => {
      worker.removeEventListener("message", handleResponse);
      console.error(`[DB-WORKER] Message timeout`, message);
      reject({ type: "error", error: "[DB-WORKER] Message timeout", id });
    }, 30e3);
  }) as Promise<DbResponse>;
}

let messageId = 0;

function removePendingAction(
  pending: PendingActions,
  action: () => Promise<void>
) {
  pending.splice(pending.indexOf(action));
}

function getNewMessageId() {
  return messageId++;
}

function terminateWorker(state: DbWorkerState) {
  const { worker } = state;
  worker.removeEventListener("error", handleError);
  worker.terminate();
  state.didTerminate = true;
}
