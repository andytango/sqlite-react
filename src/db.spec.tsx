import "@testing-library/jest-dom";
import { render } from "@testing-library/react";
import React from "react";
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

  it.todo("returns a Provider that initialises on mount");

  it.todo("returns a Provider that changes db when new props are received");

  it("returns a Provider that terminates the worker on unmount", async () => {
    const { Provider } = createDb();
    const worker = new Worker(dbOpts.sqlJsWorkerPath);
    const props: DbOpts = { ...dbOpts, worker };
    const fn = jest.spyOn(worker, "terminate");
    const { unmount } = render(<Provider {...props} />);
    unmount();

    expect(fn).toHaveBeenCalled();
  });

  it.todo("returns a hook that can query the db");
});
