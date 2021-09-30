import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";
import Worker from "web-worker";
import { createDb } from "./db";
import { DbOpts } from "./types";

const opts: DbOpts = {
  sqlDataUrl: "src/test-db.sqlite",
  sqlJsWorkerPath: "src/test-worker.js",
  getDbFile,
};

async function getDbFile() {
  return new ArrayBuffer(0);
}

describe("createDb", () => {
  it("returns a Provider and hook returning the correct db opts", () => {
    const { Provider, useDbContext } = createDb();
    const { sqlDataUrl, sqlJsWorkerPath } = opts;

    function TextConsumer() {
      const { sqlDataUrl, sqlJsWorkerPath } = useDbContext();
      return <div>{JSON.stringify({ sqlDataUrl, sqlJsWorkerPath })}</div>;
    }

    const { unmount, baseElement } = render(
      <Provider {...opts}>
        <TextConsumer />
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
    const worker = new Worker(opts.sqlJsWorkerPath);
    const props: DbOpts = { ...opts, worker };
    const fn = jest.spyOn(worker, "terminate");
    const { unmount } = render(<Provider {...props} />);
    unmount();

    expect(fn).toHaveBeenCalled();
  });

  it.todo("returns a hook that can query the db");
});
