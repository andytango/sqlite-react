import { reducer } from "./reducer";
import { createMockDbWorker, createTestDbWorker } from "./test-helpers";
import { DbContextState } from "./types";

function createState() {
  return {
    db: createMockDbWorker(),
    queries: {},
    isReady: true,
    isLoading: false,
    initQueue: [],
    sqlDataUrl: "",
    sqlJsWorkerPath: "",
  };
}

describe("reducer", () => {
  it("reduces init action", () => {
    const oldState = createState();
    const newState = {
      ...oldState,
      db: createMockDbWorker(),
      sqlDataUrl: "new",
      sqlJsWorkerPath: "new",
    };

    expect(reducer(oldState, { type: "init", ...newState })).toEqual(newState);
  });

  it("reduces load action", () => {
    const oldState: DbContextState = createState();
    const newState: DbContextState = { ...oldState, isLoading: true };

    expect(reducer(oldState, { type: "load" })).toEqual(newState);
  });

  it("reduces ready action", () => {
    const oldState: DbContextState = createState();
    const newState: DbContextState = {
      ...oldState,
      isReady: true,
      isLoading: false,
    };

    expect(reducer(oldState, { type: "ready" })).toEqual(newState);
  });

  it("reduces query_enqueue", () => {
    const oldState: DbContextState = createState();
    const newState: DbContextState = {
      ...oldState,
      initQueue: ["select 1 as val"],
    };

    expect(
      reducer(oldState, { type: "query_enqueue", sql: "select 1 as val" })
    ).toEqual(newState);
  });

  it("reduces query_exec", () => {
    const oldState: DbContextState = createState();
    const newState: DbContextState = {
      ...oldState,
      queries: {
        1: {
          sql: "select 1 as val",
          loading: true,
          results: [],
        },
      },
    };

    expect(
      reducer(oldState, {
        type: "query_exec",
        queryId: 1,
        sql: "select 1 as val",
      })
    ).toEqual(newState);
  });

  it("reduces query_result", () => {
    const oldState: DbContextState = {
      ...createState(),
      queries: { 1: { sql: "select 1 as val", loading: true, results: [] } },
    };
    const newState: DbContextState = {
      ...oldState,
      queries: {
        1: { sql: "select 1 as val", loading: false, results: [[{ val: 1 }]] },
      },
    };

    expect(
      reducer(oldState, {
        type: "query_result",
        queryId: 1,
        results: [[{ val: 1 }]],
      })
    ).toEqual(newState);
  });

  it("reduces query_error", () => {
    const oldState: DbContextState = {
      ...createState(),
      queries: {
        1: { sql: "select 1 as val", loading: true, results: [] },
      },
    };

    const newState: DbContextState = {
      ...oldState,
      queries: {
        1: {
          sql: "select 1 as val",
          loading: false,
          results: [],
          error: "some error",
        },
      },
    };

    expect(
      reducer(oldState, {
        type: "query_error",
        queryId: 1,
        error: "some error",
      })
    ).toEqual(newState);
  });
});
