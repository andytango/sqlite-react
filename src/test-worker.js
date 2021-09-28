addEventListener("message", (e) => {
  const { data } = e;
  const { action, id, sql, buffer } = data;

  if (action === "exec" && sql === "select 1 as val") {
    return postMessage({ id, results: [{ columns: ["val"], values: [[1]] }] });
  }

  if (action === "open" && buffer instanceof ArrayBuffer) {
    return postMessage({ id });
  }

  throw new Error(
    `[DB-TEST-WORKER] Unexpected payload: ${JSON.stringify(data)}`
  );
});
