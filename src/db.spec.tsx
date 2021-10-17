import "@testing-library/jest-dom";
import { render, waitFor } from "@testing-library/react";
import "jest-extended";
import React, { useEffect } from "react";
import { createDb } from "./db";
import { dbOpts } from "./test-helpers";

describe("createDb", () => {
  it("returns a Provider with a context with the correct db opts", () => {
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

  it("returns a hook factory for queries", () => {
    const { Provider, makeDbQuery } = createDb();
    const useQuery = makeDbQuery(() => `select 1 as val`);

    const { baseElement } = render(
      <Provider dbConfig={dbOpts}>
        <TestConsumer />
      </Provider>
    );

    function TestConsumer() {
      const [result, dispatch] = useQuery();
      useEffect(() => {
        dispatch();
      }, []);
      return <div>{JSON.stringify(result)}</div>;
    }

    expect(JSON.parse(baseElement.textContent || "")).toEqual({
      loading: true,
      results: [],
      sql: "select 1 as val",
    });

    return waitFor(() => {
      expect(JSON.parse(baseElement.textContent || "")).toEqual({
        loading: false,
        results: [[{ val: 1 }]],
        sql: "select 1 as val",
      });
    });
  });
});
