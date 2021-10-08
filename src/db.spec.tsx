import "@testing-library/jest-dom";
import { render } from "@testing-library/react";
import "jest-extended";
import React from "react";
import { createDb } from "./db";
import { dbOpts } from "./test-helpers";

describe("createDb", () => {
  it("returns a Provider that uses uses a context with the correct db opts", () => {
    const { Provider, useDbContext } = createDb();
    const { sqlJsWorkerPath, sqlDataUrl } = dbOpts;

    const { unmount, baseElement } = render(
      <Provider dbConfig={dbOpts}>
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
});
