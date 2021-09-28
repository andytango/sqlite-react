import "jest-extended";
import { DbOpts } from "./types";
import { createDbManager } from "./db-manager";

const opts: DbOpts = {
  sqlDataUrl: "",
  sqlJsWorkerPath: "src/test-worker.js",
};

describe("createDbManager", () => {
  it("dispatches db init events", async () => {
    const dbManager = createDbManager(opts);
    const fn1 = jest.fn();
    const fn2 = jest.fn();
    const fn3 = jest.fn();

    dbManager.once("dbInit", fn1);
    dbManager.once("dbReady", fn2);
    await dbManager.getInstance().then(fn3);

    expect(fn1).toHaveBeenCalled();
    expect(fn2).toHaveBeenCalled();
    expect(fn3).toHaveBeenCalled();

    expect(fn1).toHaveBeenCalledBefore(fn2);
    expect(fn2).toHaveBeenCalledBefore(fn3);
  });

  it("enqueues queries", async () => {
    const dbManager = createDbManager(opts);
    const fn1 = jest.fn();
    const fn2 = jest.fn();
    const fn3 = jest.fn();

    dbManager.once("dbInit", fn1);
    dbManager.once("dbReady", fn2);
    await dbManager.getInstance().then(fn3);

    expect(fn1).toHaveBeenCalled();
    expect(fn2).toHaveBeenCalled();
    expect(fn3).toHaveBeenCalled();

    expect(fn1).toHaveBeenCalledBefore(fn2);
    expect(fn2).toHaveBeenCalledBefore(fn3);
  });
});
