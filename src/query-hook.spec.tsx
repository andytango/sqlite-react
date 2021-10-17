import { createEventEmitter } from "@andytango/ts-event-emitter";
import { act, renderHook } from "@testing-library/react-hooks";
import React from "react";
import { DbEventMap, DbOpts } from "./types";
import { createDb } from "./db";
import { createDbQueryHook } from "./query-hook";
import { addMockListener, createTestDbWorker, dbOpts } from "./test-helpers";

describe("createDbQueryHook", () => {
  it("returns a hook to query the db", async () => {
    const { Provider, useDbContext } = createDb();
    const { dbWorker } = createTestDbWorker();
    const dbWorkerFactory = (opts: DbOpts) => dbWorker;
    const opts = { ...dbOpts, dbWorkerFactory };
    const wrapper = ({ children }: React.PropsWithChildren<{}>) => (
      <Provider dbConfig={opts}>{children}</Provider>
    );
    const fn = jest.spyOn(dbWorker, "exec");

    const emitter = createEventEmitter<DbEventMap>();
    const onQueryStart = addMockListener(emitter, "queryStart");
    const onQueryError = addMockListener(emitter, "queryError");
    const onQueryResult = addMockListener(emitter, "queryResult");

    const useQuery = createDbQueryHook(
      useDbContext,
      () => `select 1 as val`,
      0,
      emitter
    );

    const { result } = renderHook(() => useQuery(), { wrapper });

    const [state, exec] = result.current;
    expect(state).toEqual({ loading: true, results: [] });
    expect(onQueryStart).not.toHaveBeenCalled();

    await act(() => exec());
    expect(onQueryStart).toHaveBeenCalledWith({
      queryId: 0,
      sql: "select 1 as val",
      sqlDataUrl: "example-db-file-path.sqlite",
      sqlJsWorkerPath: "src/test-web-worker.js",
      startedAt: expect.any(Number),
    });
    expect(fn).toHaveBeenCalledWith(`select 1 as val`);

    expect(result.current).toEqual([
      { loading: false, sql: "select 1 as val", results: [[{ val: 1 }]] },
      expect.any(Function),
    ]);
    expect(onQueryResult).toHaveBeenCalledWith({
      queryId: 0,
      sql: "select 1 as val",
      sqlDataUrl: "example-db-file-path.sqlite",
      sqlJsWorkerPath: "src/test-web-worker.js",
      startedAt: expect.any(Number),
      completedAt: expect.any(Number),
      results: [{ columns: ["val"], values: [[1]] }],
    });
    expect(onQueryError).not.toHaveBeenCalled();
  });
});
