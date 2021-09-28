import { createEventEmitter, EventEmitter } from "@andytango/ts-event-emitter";
import { DbEventMap } from "./types";

export type DbEventEmitter = EventEmitter<DbEventMap>;

export function createDbEventEmitter() {
  return createEventEmitter<DbEventMap>();
}
