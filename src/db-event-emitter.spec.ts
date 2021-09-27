import { createDbEventEmitter } from "./db-event-emitter";

describe("createDbEventEmitter", () => {
  it("returns an event emitter", () => {
    expect(Object.keys(createDbEventEmitter())).toEqual(
      Object.keys(createDbEventEmitter())
    );
  });
});
