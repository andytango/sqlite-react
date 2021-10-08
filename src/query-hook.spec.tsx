import { act, renderHook } from "@testing-library/react-hooks";
import React from "react";
import { DbOpts } from ".";
import { createDb } from "./db";
import { createDbQueryHook } from "./query-hook";
import { createTestDbWorker, dbOpts } from "./test-helpers";

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

    const useQuery = createDbQueryHook(
      useDbContext,
      () => `select 1 as val`,
      0
    );

    const { result } = renderHook(() => useQuery(), { wrapper });

    const [state, exec] = result.current;

    expect(state).toEqual({ loading: true, results: [] });

    await act(() => exec());

    expect(fn).toHaveBeenCalledWith(`select 1 as val`);

    expect(result.current).toEqual([
      { loading: false, sql: "select 1 as val", results: [[{ val: 1 }]] },
      expect.any(Function),
    ]);
  });
});
