import React from "react";
import { createDbContext } from "./context";

describe("createDbContext", () => {
  it("initialises with null value", () => {
    const fn = jest.spyOn(React, "createContext");
    const context = createDbContext();
    expect(fn).toHaveBeenLastCalledWith(null);
    expect(context.displayName).toEqual("DbContext");
  });
});
