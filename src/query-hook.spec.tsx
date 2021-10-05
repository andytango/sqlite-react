import { renderHook } from "@testing-library/react-hooks";
import React from "react";
import { createDb } from "./db";
import { createDbQueryHook } from "./query-hook";
import { dbOpts } from "./test-helpers";

describe("createDbQueryHook", () => {
  it("returns a hook to query the db", () => {
    const { Provider, useDbContext } = createDb();
    const wrapper = ({ children }: React.PropsWithChildren<{}>) => (
      <Provider {...dbOpts}>{children}</Provider>
    );

    const useQuery = createDbQueryHook(
      useDbContext,
      () => `select 1 as val`,
      0
    );

    renderHook(
      () => {
        useQuery();
      },
      { wrapper }
    );
  });
});
