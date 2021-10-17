import Worker from "web-worker";
import { createTestDbWorker, dbOpts } from "./test-helpers";
import { createDbWorker } from "./worker";

describe("createDbWorker", () => {
  it("adds event listeners to the worker", async () => {
    const webWorker = new Worker(dbOpts.sqlJsWorkerPath);
    const fn = jest.spyOn(webWorker, "addEventListener");

    createDbWorker({ ...dbOpts, webWorker });

    expect(fn).toHaveBeenCalledWith("error", expect.any(Function));

    webWorker.terminate();
  });

  it("terminates worker and aborts queries", async () => {
    const webWorker = new Worker(dbOpts.sqlJsWorkerPath);
    const fn = jest.spyOn(webWorker, "terminate");

    const dbWorker = createDbWorker({ ...dbOpts, webWorker });
    await dbWorker.init();

    const promise = dbWorker.exec("select example_col from example_slow_table");
    await dbWorker.terminate();

    expect(fn).toHaveBeenCalled();

    const res = await promise;
    expect(res).toEqual({ type: "abort", id: expect.any(Number) });

    await expect(dbWorker.exec("some val")).rejects.toEqual(
      new Error("[DB Worker] Cannot exec, worker was terminated")
    );
  });

  it("throws error if terminate called while already terminating", async () => {
    const webWorker = new Worker(dbOpts.sqlJsWorkerPath);

    const dbWorker = createDbWorker({ ...dbOpts, webWorker });
    await dbWorker.init();

    const promise1 = dbWorker.exec(
      "select example_col from example_slow_table"
    );
    const promise2 = dbWorker.terminate();

    expect(dbWorker.terminate()).rejects.toEqual(
      new Error("[DB Worker] Already terminating")
    );

    await promise1;
    await promise2;
  });

  it("throws error if terminate called after worker has terminated", async () => {
    const webWorker = new Worker(dbOpts.sqlJsWorkerPath);

    const dbWorker = createDbWorker({ ...dbOpts, webWorker });
    await dbWorker.init();

    const promise1 = dbWorker.exec(
      "select example_col from example_slow_table"
    );
    const promise2 = dbWorker.terminate();

    await promise1;
    await promise2;

    expect(dbWorker.terminate()).rejects.toEqual(
      new Error("[DB Worker] Already terminated")
    );
  });

  it("executes sql via worker", async () => {
    const { webWorker, dbWorker } = createTestDbWorker();
    const fn1 = jest.spyOn(webWorker, "postMessage");
    const fn2 = jest.spyOn(webWorker, "addEventListener");

    await dbWorker.init();
    const res = await dbWorker.exec("select 1 as val");

    expect(fn1).toHaveBeenCalledWith({
      id: expect.any(Number),
      action: "exec",
      sql: "select 1 as val",
    });

    expect(fn2).toHaveBeenCalledWith("message", expect.any(Function));

    expect(res).toEqual({
      type: "result",
      id: expect.any(Number),
      results: [{ columns: ["val"], values: [[1]] }],
    });

    dbWorker.terminate();
  });

  it("opens sqlite file via worker", async () => {
    const { webWorker, dbWorker } = createTestDbWorker();
    const fn1 = jest.spyOn(webWorker, "postMessage");
    await dbWorker.init();

    expect(fn1).toHaveBeenCalledWith({
      id: expect.any(Number),
      action: "open",
      buffer: expect.any(ArrayBuffer),
    });

    dbWorker.terminate();
  });

  it("queues up queries will initialising", async () => {
    const { webWorker, dbWorker } = createTestDbWorker();
    const fn1 = jest.spyOn(webWorker, "postMessage");

    await Promise.all([dbWorker.exec("select 1 as val"), dbWorker.init()]);

    expect(fn1).toHaveBeenNthCalledWith(1, {
      id: expect.any(Number),
      action: "open",
      buffer: expect.any(ArrayBuffer),
    });

    expect(fn1).toHaveBeenNthCalledWith(2, {
      id: expect.any(Number),
      action: "exec",
      sql: "select 1 as val",
    });

    dbWorker.terminate();
  });
});
