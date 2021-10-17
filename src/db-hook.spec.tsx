import { createEventEmitter } from "@andytango/ts-event-emitter";
import { waitFor } from "@testing-library/dom";
import { renderHook } from "@testing-library/react-hooks";
import { DbEventEmitter } from ".";
import { useDb } from "./db-hook";
import { dbOpts } from "./test-helpers";
import { DbEventMap } from "./types";

describe("useDb", () => {
  it("initialises with empty context", async () => {
    const emitter = createEventEmitter<DbEventMap>();
    const onDbInit = addMockListener(emitter, "dbInit");
    const onDbTerminate = addMockListener(emitter, "dbTerminate");

    const { result } = renderHook(() => useDb(dbOpts, emitter));

    expect(result.current).toEqual({
      db: expect.anything(),
      dispatch: expect.any(Function),
      getDbFile: dbOpts.getDbFile,
      queries: {},
      sqlDataUrl: dbOpts.sqlDataUrl,
      sqlJsWorkerPath: dbOpts.sqlJsWorkerPath,
    });
    const fn = jest.spyOn(result.current.db, "terminate");
    expect(fn).not.toHaveBeenCalled();

    expect(onDbInit).toHaveBeenCalledWith(dbOpts);
    expect(onDbTerminate).not.toHaveBeenCalled();
  });

  it("initialises the db", async () => {
    const emitter = createEventEmitter<DbEventMap>();
    const onDbInit = addMockListener(emitter, "dbInit");
    const onDbReady = addMockListener(emitter, "dbReady");
    const onDbTerminate = addMockListener(emitter, "dbTerminate");

    renderHook(() => useDb(dbOpts, emitter));

    expect(onDbInit).toHaveBeenCalledWith(dbOpts);
    await waitFor(() => {
      expect(onDbReady).toHaveBeenCalled();
    });
    expect(onDbTerminate).not.toHaveBeenCalled();
  });

  it("terminates after unmount", async () => {
    const emitter = createEventEmitter<DbEventMap>();
    const onDbTerminate = addMockListener(emitter, "dbTerminate");

    const { result, unmount } = renderHook(() => useDb(dbOpts, emitter));

    const fn = jest.spyOn(result.current.db, "terminate");
    unmount();
    expect(fn).toHaveBeenCalled();
    expect(onDbTerminate).toHaveBeenCalled();
  });

  it("terminates and loads new db on props change", async () => {
    const emitter = createEventEmitter<DbEventMap>();
    const onDbInit = addMockListener(emitter, "dbInit");
    const onDbReady = addMockListener(emitter, "dbReady");
    const onDbTerminate = addMockListener(emitter, "dbTerminate");

    const { result, rerender } = renderHook((props) => useDb(props, emitter), {
      initialProps: dbOpts,
    });
    const fn = jest.spyOn(result.current.db, "terminate");
    const db1 = result.current.db;

    const newProps = { ...dbOpts, sqlDataUrl: "other-file.sqlite" };

    await waitFor(() => {
      expect(onDbReady).toHaveBeenCalled();
    });

    rerender(newProps);

    expect(fn).toHaveBeenCalled();
    expect(db1).not.toBe(result.current.db);

    expect(onDbInit).toHaveBeenCalledTimes(2);

    await waitFor(() => {
      expect(onDbReady).toHaveBeenCalledTimes(2);
    });

    expect(onDbTerminate).toHaveBeenCalledTimes(1);
  });
});

function addMockListener(emitter: DbEventEmitter, event: keyof DbEventMap) {
  const handler = jest.fn();
  emitter.on(event, handler);
  return handler;
}
