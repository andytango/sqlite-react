let didOpen = false;

addEventListener("message", handleMessage);

function handleMessage(e) {
  const { data } = e;
  const { action, id, sql } = data;

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

  if (
    action === "exec" &&
    didOpen &&
    sql === "select example_col from example_slow_table"
  ) {
    return setTimeout(() => {
      postMessage(
        {
          id,
          results: [{ columns: ["example_col"], values: [["example_val"]] }],
        },
        400
      );
    });
  }

  if (action === "open") {
    didOpen = true;
    return postMessage({ id });
  }

  if (action === "exec" && sql === "select 1 as val") {
    return postMessage({
      id,
      results: [{ columns: ["val"], values: [[1]] }],
    });
  }

  throw new Error(
    `[DB-TEST-WORKER] Unexpected payload: ${JSON.stringify(data)}`
  );
}
