import Worker from "web-worker";
import { createDbWorker } from "./db-worker";
import { DbOpts } from "./types";

const opts: DbOpts = {
  sqlDataUrl: "",
  sqlJsWorkerPath: "src/test-worker.js",
};

describe("createDbWorker", () => {
  it("adds event listeners to the worker", async () => {
    const webWorker = new Worker(opts.sqlJsWorkerPath);
    const fn = jest.spyOn(webWorker, "addEventListener");

    createDbWorker({ ...opts, worker: webWorker });

    expect(fn).toHaveBeenCalledWith("error", expect.any(Function));

    webWorker.terminate();
  });

  it("terminates", async () => {
    const webWorker = new Worker(opts.sqlJsWorkerPath);
    const fn = jest.spyOn(webWorker, "terminate");

    createDbWorker({ ...opts, worker: webWorker });
    webWorker.terminate();
    expect(fn).toHaveBeenCalled();
  });

  it("executes sql via worker", async () => {
    const worker = new Worker(opts.sqlJsWorkerPath);
    const fn1 = jest.spyOn(worker, "postMessage");
    const fn2 = jest.spyOn(worker, "addEventListener");

    const dbWorker = createDbWorker({ ...opts, worker });
    const res = await dbWorker.exec("select 1 as val");

    expect(fn1).toHaveBeenCalledWith({
      id: expect.any(Number),
      action: "exec",
      sql: "select 1 as val",
    });

    expect(fn2).toHaveBeenCalledWith("message", expect.any(Function));

    expect(res).toMatchSnapshot();

    dbWorker.terminate();
  });

  it("opens sqlite file via worker", async () => {
    const worker = new Worker(opts.sqlJsWorkerPath);
    const fn1 = jest.spyOn(worker, "postMessage");
    const fn2 = jest.spyOn(worker, "addEventListener");

    const dbWorker = createDbWorker({ ...opts, worker });
    const res = await dbWorker.open(new ArrayBuffer(1));

    expect(fn1).toHaveBeenCalledWith({
      id: expect.any(Number),
      action: "open",
      buffer: expect.any(ArrayBuffer),
    });

    expect(fn2).toHaveBeenCalledWith("message", expect.any(Function));

    expect(res).toEqual({ id: expect.any(Number) });

    dbWorker.terminate();
  });
});
