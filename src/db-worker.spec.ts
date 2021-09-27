import Worker from "web-worker";
import { createDbWorker } from "./db-worker";
import { DbOpts } from "./types";

const opts: DbOpts = {
  sqlDataUrl: "",
  sqlJsWorkerPath: "src/test-worker.js",
};

describe("createDbWorker", () => {
  it("accepts db options and returns a promise", async () => {
    const worker = createDbWorker(opts);
    expect(worker).toBeInstanceOf(Promise);
    (await worker).terminate();
  });

  it("adds event listeners to the worker", async () => {
    const worker = new Worker(opts.sqlJsWorkerPath);
    const fn = jest.spyOn(worker, "addEventListener");

    await createDbWorker({ ...opts, worker });

    expect(fn).toHaveBeenCalledWith("message", expect.any(Function));
    expect(fn).toHaveBeenCalledWith("error", expect.any(Function));

    worker.terminate();
  });

  it("terminates", async () => {
    const worker = new Worker(opts.sqlJsWorkerPath);
    const fn = jest.spyOn(worker, "terminate");

    await createDbWorker({ ...opts, worker });
    worker.terminate();
    expect(fn).toHaveBeenCalled();
  });

  it("calls post message on exec", async () => {
    const worker = new Worker(opts.sqlJsWorkerPath);
    const fn1 = jest.spyOn(worker, "postMessage");
    const fn2 = jest.spyOn(worker, "addEventListener");

    const dbWorker = await createDbWorker({ ...opts, worker });
    const res = await dbWorker.exec("exec", { k: "v" });

    expect(fn1).toHaveBeenCalledWith({
      id: expect.any(Number),
      action: "exec",
      k: "v",
    });

    expect(fn2).toHaveBeenCalledWith("message", expect.any(Function));

    expect(res).toEqual({
      id: expect.any(Number),
      action: "exec",
      k: "v",
    });

    dbWorker.terminate();
  });
});
