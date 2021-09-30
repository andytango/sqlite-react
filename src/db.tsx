import React, { useContext, useEffect } from "react";
import { DbContextState } from ".";
import { createDbContext, useContextState } from "./context";
import { DbOpts } from "./types";

export function createDb() {
  const context = createDbContext();

  function Provider(props: React.PropsWithChildren<DbOpts>) {
    const { children, ...opts } = props;
    const [state, dispatch] = useContextState(opts);

    useDbUnmountEffect(state);

    return (
      <context.Provider value={{ ...state, dispatch }} {...{ children }} />
    );
  }

  function useDbContext() {
    const value = useContext(context);

    if (!value) {
      throw new Error("Attempted to access uninitialised db context");
    }

    return value;
  }

  return { Provider, useDbContext };
}

function useDbUnmountEffect(state: DbContextState) {
  return useEffect(() => () => state.db.terminate(), [state.db]);
}
