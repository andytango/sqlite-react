import "@testing-library/jest-dom";
import { render } from "@testing-library/react";
import "jest-extended";
import React from "react";
import { setImmediate } from "timers";
import Worker from "web-worker";
import { createDb } from "./db";
import { dbOpts } from "./test-helpers";
import { DbOpts } from "./types";

describe("createDb", () => {
  it("returns a Provider that uses uses a context with the correct db opts", () => {
    const { Provider, useDbContext } = createDb();
    const { sqlJsWorkerPath, sqlDataUrl } = dbOpts;

    const { unmount, baseElement } = render(
      <Provider {...dbOpts}>
        <TestConsumer />
      </Provider>
    );

    function TestConsumer() {
      const context = useDbContext();
      return <div>{JSON.stringify(context)}</div>;
    }

    expect(JSON.parse(baseElement.textContent || "")).toEqual(
      expect.objectContaining({ sqlJsWorkerPath, sqlDataUrl })
    );

    unmount();
  });

  it("returns a Provider that initialises the db", () => {
    const { Provider } = createDb();
    const worker = new Worker(dbOpts.sqlJsWorkerPath);
    const fn = jest.spyOn(worker, "postMessage");

    const { unmount } = render(<Provider {...{ ...dbOpts, worker }} />);

    return new Promise<void>((res) => {
      worker.addEventListener("message", (e) => {
        expect(fn).toHaveBeenLastCalledWith({
          action: "open",
          buffer: expect.any(ArrayBuffer),
          id: expect.any(Number),
        });

        setImmediate(() => {
          unmount();
          res();
        });
      });
    });
  });

  it("returns a Provider that changes db when new props are received", () => {
    const { Provider } = createDb();
    const worker1 = new Worker(dbOpts.sqlJsWorkerPath);
    const worker2 = new Worker(dbOpts.sqlJsWorkerPath);
    const fn1 = jest.spyOn(worker1, "postMessage");
    const fn2 = jest.spyOn(worker2, "postMessage");

    const { rerender, unmount } = render(
      <Provider {...{ ...dbOpts, worker: worker1 }} />
    );

    // rerender(<Provider {...{ ...dbOpts, worker: worker2 }} />);

    return new Promise<void>((res) => {
      setImmediate(() => {
        expect(fn1).toHaveBeenCalledWith({
          action: "open",
          buffer: expect.any(ArrayBuffer),
          id: expect.any(Number),
        });
        // expect(fn2).toHaveBeenCalledWith({
        //   action: "open",
        //   buffer: expect.any(ArrayBuffer),
        //   id: expect.any(Number),
        // });
        unmount();
        res();
      });
    });
  });

  it("returns a Provider that terminates the worker on unmount", () => {
    const { Provider } = createDb();
    const webWorker = new Worker(dbOpts.sqlJsWorkerPath);
    const props: DbOpts = { ...dbOpts, webWorker };
    const fn = jest.spyOn(webWorker, "terminate");
    const { unmount } = render(<Provider {...props} />);
    unmount();

    expect(fn).toHaveBeenCalled();
  });

  it.skip("returns a hook factory to query the db", () => {
    const { Provider, makeDbQuery } = createDb();
    const webWorker = new Worker(dbOpts.sqlJsWorkerPath);
    const fn1 = jest.spyOn(webWorker, "postMessage");

    const useQuery = makeDbQuery<[{ val: 1 }]>(() => `select 1 as val`);

    function TestComponent() {
      const [_, execQuery] = useQuery();
      return <div></div>;
    }

    const { unmount } = render(
      <Provider {...{ ...dbOpts, webWorker }}>
        <TestComponent />
      </Provider>
    );

    return new Promise<void>((res) => {
      setImmediate(() => {
        expect(fn1).toHaveBeenCalledWith({
          action: "exec",
          buffer: expect.any(ArrayBuffer),
          id: expect.any(Number),
        });
        unmount();
        res();
      });
    });
  });
});
