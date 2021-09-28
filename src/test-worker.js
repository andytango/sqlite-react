let didOpen = false;

addEventListener("message", (e) => {
  const { data } = e;
  const { action, id, sql, buffer } = data;

  if (
    action === "exec" &&
    didOpen &&
    sql === "select example_col from example_table"
  ) {
    return postMessage({
      id,
      results: [{ columns: ["example_col"], values: [["example_val"]] }],
    });
  }

  if (action === "open") {
    didOpen = true;
    return postMessage({ id });
  }

  if (action === "exec" && sql === "select 1 as val") {
    return postMessage({ id, results: [{ columns: ["val"], values: [[1]] }] });
  }

  throw new Error(
    `[DB-TEST-WORKER] Unexpected payload: ${JSON.stringify(data)}`
  );
});
