import "jest-extended";
import { DbOpts } from "./types";
import { createDbManager } from "./db-manager";
import { readFileSync } from "fs";

const opts: DbOpts = {
  sqlDataUrl: "src/test-db.sqlite",
  sqlJsWorkerPath: "src/test-worker.js",
  getDbFile,
};

async function getDbFile() {
  return new ArrayBuffer(0);
}

describe("createDbManager", () => {
  it("dispatches db init events", async () => {
    const dbManager = createDbManager(opts);
    const fn1 = jest.fn();
    const fn2 = jest.fn();

    dbManager.once("dbInit", fn1);
    dbManager.once("dbReady", fn2);
    await dbManager.getInstance();

    expect(fn1).toHaveBeenCalled();
    expect(fn2).toHaveBeenCalled();

    expect(fn1).toHaveBeenCalledBefore(fn2);

    dbManager.terminate();
  });

  it("initialises and resolves first promise when ready", async () => {
    const dbManager = createDbManager(opts);
    const fn1 = jest.fn();
    const fn2 = jest.fn();
    const fn3 = jest.fn();

    dbManager.once("dbInit", fn1);
    dbManager.once("dbReady", fn2);
    await dbManager.getInstance();
    fn3();

    expect(fn1).toHaveBeenCalledBefore(fn3);
    expect(fn2).toHaveBeenCalledBefore(fn3);

    dbManager.terminate();
  });

  it("enqueues promise resolutions for all callbacks", async () => {
    const dbManager = createDbManager(opts);
    const fn1 = jest.fn();
    const fn2 = jest.fn();
    const fn3 = jest.fn();
    const fn4 = jest.fn();

    dbManager.once("dbInit", fn1);
    dbManager.once("dbReady", fn2);

    await Promise.all([
      dbManager.getInstance(),
      dbManager.getInstance().then(fn3),
      dbManager.getInstance().then(fn4),
    ]);

    expect(fn1).toHaveBeenCalledBefore(fn2);
    expect(fn2).toHaveBeenCalledBefore(fn3);
    expect(fn3).toHaveBeenCalledBefore(fn4);

    dbManager.terminate();
  });

  it("execs queries", async () => {
    const dbManager = createDbManager(opts);
    const db = await dbManager.getInstance();
    const res = await db(`select 1 as val`);

    expect(res).toMatchSnapshot();

    dbManager.terminate();
  });

  it("loads the supplied database file url", async () => {
    const dbManager = createDbManager(opts);
    const db = await dbManager.getInstance();
    const res = await db(`select example_col from example_table`);

    expect(res).toMatchSnapshot();

    dbManager.terminate();
  });
});
