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
  it("returns a Provider and hook returning the correct db opts", () => {
    const { Provider, useDbContext } = createDb();
    const { sqlDataUrl, sqlJsWorkerPath } = dbOpts;

    function TestConsumer() {
      const { sqlDataUrl, sqlJsWorkerPath } = useDbContext();
      return <div>{JSON.stringify({ sqlDataUrl, sqlJsWorkerPath })}</div>;
    }

    const { unmount, baseElement } = render(
      <Provider {...dbOpts}>
        <TestConsumer />
      </Provider>
    );

    expect(JSON.parse(baseElement.textContent || "")).toEqual({
      sqlDataUrl,
      sqlJsWorkerPath,
    });

    unmount();
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

    rerender(<Provider {...{ ...dbOpts, worker: worker2 }} />);

    return new Promise<void>((res) => {
      setImmediate(() => {
        expect(fn1).toHaveBeenCalledWith({
          action: "open",
          buffer: expect.any(ArrayBuffer),
          id: expect.any(Number),
        });
        expect(fn2).toHaveBeenCalledWith({
          action: "open",
          buffer: expect.any(ArrayBuffer),
          id: expect.any(Number),
        });
        unmount();
        res();
      });
    });
  });

  it("returns a Provider that terminates the worker on unmount", () => {
    const { Provider } = createDb();
    const worker = new Worker(dbOpts.sqlJsWorkerPath);
    const props: DbOpts = { ...dbOpts, worker };
    const fn = jest.spyOn(worker, "terminate");
    const { unmount } = render(<Provider {...props} />);
    unmount();

    expect(fn).toHaveBeenCalled();
  });

  it("returns a hook factory to query the db", () => {
    const { Provider, makeDbQuery } = createDb();
    const worker = new Worker(dbOpts.sqlJsWorkerPath);
    const fn1 = jest.spyOn(worker, "postMessage");

    const useQuery = makeDbQuery<[{ val: 1 }]>(() => `select 1 as val`);

    function TestComponent() {
      const [_, execQuery] = useQuery();
      return <div></div>;
    }

    const { unmount } = render(
      <Provider {...{ ...dbOpts, worker }}>
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
