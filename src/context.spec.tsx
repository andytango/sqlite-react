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
  it("initialises with the db manager", () => {
    const worker = new Worker(dbOpts.sqlJsWorkerPath);
    const props = { ...dbOpts, worker };
    const fn = jest.spyOn(worker, "postMessage");

    function TestComponent() {
      const [state] = useContextState(props);
      return <div>{JSON.stringify(state)}</div>;
    }

    const { unmount } = render(<TestComponent />);

    return new Promise<void>((res) => {
      setImmediate(() => {
        expect(fn).toHaveBeenCalledWith({
          id: expect.any(Number),
          action: "open",
          buffer: expect.any(ArrayBuffer),
        });
        unmount();
        res();
      });
    });
  });
});
