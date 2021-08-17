import { isNil } from "ramda";
import { isString, isNumber, isBoolean } from "./helpers";

export function formatSql(strs: TemplateStringsArray, ...exprs: any[]) {
  let out: string[] = [];
  const n1 = strs.length;
  const n2 = exprs.length;

  for (let i = 0; i < n1; i++) {
    out.push(strs[i]);

    if (i < n2) {
      out.push(escapeSql(exprs[i]));
    }
  }

  return out.join("");
}

function escapeSql(ob: string | number): string {
  if (isString(ob)) {
    return `'${ob.replace(`'`, `''`)}'`;
  }

  if (isNumber(ob)) {
    return ob.toString();
  }

  if (isNil(ob)) {
    return "NULL";
  }

  if (isBoolean(ob)) {
    return ob ? "TRUE" : "FALSE";
  }

  throw new Error(`Could serialize sql: ${ob}`);
}
