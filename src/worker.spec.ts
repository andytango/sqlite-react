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

  it("terminates", async () => {
    const webWorker = new Worker(dbOpts.sqlJsWorkerPath);
    const fn = jest.spyOn(webWorker, "terminate");

    createDbWorker({ ...dbOpts, webWorker });
    webWorker.terminate();
    expect(fn).toHaveBeenCalled();
  });

  it("executes sql via worker", async () => {
    const { webWorker, dbWorker } = createTestDbWorker();
    const fn1 = jest.spyOn(webWorker, "postMessage");
    const fn2 = jest.spyOn(webWorker, "addEventListener");

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
});
