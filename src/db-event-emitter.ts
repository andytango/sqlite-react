import { createEventEmitter } from "@andytango/ts-event-emitter";
import { DbEventMap } from "./types";

export function createDbEventEmitter() {
  return createEventEmitter<DbEventMap>();
}
