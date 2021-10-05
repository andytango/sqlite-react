import { waitFor } from "@testing-library/dom";
import { renderHook } from "@testing-library/react-hooks";
import { useDb } from "./db-hook";
import { dbOpts } from "./test-helpers";

describe("useDb", () => {
  it("initialises with empty context", async () => {
    const { result } = renderHook(() => useDb(dbOpts));

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
  });

  it("terminates after unmount", async () => {
    const { result, unmount } = renderHook(() => useDb(dbOpts));
    const fn = jest.spyOn(result.current.db, "terminate");
    unmount();
    expect(fn).toHaveBeenCalled();
  });

  it("terminates and loads new db on props change", async () => {
    const { result, rerender } = renderHook((props) => useDb(props), {
      initialProps: dbOpts,
    });
    const fn = jest.spyOn(result.current.db, "terminate");
    const db1 = result.current.db;

    const newProps = { ...dbOpts, sqlDataUrl: "other-file.sqlite" };

    rerender(newProps);

    expect(fn).toHaveBeenCalled();
    expect(db1).not.toBe(result.current.db);
  });
});
