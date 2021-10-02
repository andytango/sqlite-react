import "jest-extended";
import { createTestDbManager } from "./test-helpers";

describe("createDbManager", () => {
  it("initialises and resolves first promise when ready", async () => {
    const { dbInit, fn, worker } = createTestDbManager();

    await dbInit();

    expect(fn).toHaveBeenCalledWith({
      action: "open",
      buffer: expect.any(ArrayBuffer),
      id: expect.any(Number),
    });

    worker.terminate();
  });
});
