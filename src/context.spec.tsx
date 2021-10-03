import "@testing-library/jest-dom";
import { render } from "@testing-library/react";
import React from "react";
import Worker from "web-worker";
import { createDbContext, useContextState } from "./context";
import { dbOpts } from "./test-helpers";
import { setImmediate } from "timers";

describe("createDbContext", () => {
  it("initialises with null value", () => {
    const fn = jest.spyOn(React, "createContext");
    const context = createDbContext();
    expect(fn).toHaveBeenLastCalledWith(null);
    expect(context.displayName).toEqual("DbContext");
  });
});

describe("useContextState", () => {
  it("initialises with empty context", () => {
    const worker = new Worker(dbOpts.sqlJsWorkerPath);
    const props = { ...dbOpts, worker };

    function TestComponent() {
      const [state] = useContextState(props);
      return <div>{JSON.stringify(state)}</div>;
    }

    const { unmount, baseElement } = render(<TestComponent />);

    return new Promise<void>((res) => {
      setImmediate(() => {
        expect(JSON.parse(baseElement.textContent || "")).toEqual({
          db: expect.anything(),
          initQueue: [],
          isLoading: false,
          isReady: false,
          queries: {},
          sqlDataUrl: dbOpts.sqlDataUrl,
          sqlJsWorkerPath: dbOpts.sqlJsWorkerPath,
          worker: expect.anything(),
        });
        unmount();
        res();
      });
    });
  });
});
