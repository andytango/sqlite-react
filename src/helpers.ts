import { converge, is, map, pipe, prop, zipObj } from "ramda";

export const isString = is(String) as (a: any) => a is string;

export const isNumber = is(Number) as (a: any) => a is number;

export const isBoolean = is(Boolean) as (a: any) => a is boolean;

export const mapResultToObjects = converge(map, [
  pipe(prop("columns"), zipObj),
  prop("values"),
]);
