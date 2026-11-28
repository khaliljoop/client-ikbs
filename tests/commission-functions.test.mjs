import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, test } from "node:test";

const require = createRequire(import.meta.url);
const compiled = mkdtempSync(join(tmpdir(), "ikbs-web-functions-"));
after(() => rmSync(compiled, { recursive: true, force: true }));
execFileSync(process.execPath, [
  require.resolve("typescript/bin/tsc"), "--target", "ES2022", "--module", "commonjs",
  "--skipLibCheck", "--rootDir", "src", "--outDir", compiled, "src/lib/api/commission-functions.ts",
]);
const { listCommissionFunctions, getCommissionFunction, createCommissionFunction, updateCommissionFunction,
  archiveCommissionFunction, setCommissionFunctionEnabled, functionErrorMessage } = require(join(compiled, "lib/api/commission-functions.js"));

test("uses the catalogue routes with scoped URLs, strict bodies and the version shown", async (context) => {
  const base = "/api/v1/commission-function-definitions";
  const local = "/api/v1/organizations/org%20fixture/commission-function-reference";
  const signal = new AbortController().signal;
  const input = { name: "Présidence", description: null };
  const expected = [
    [local + "?page=2&limit=25&search=Pr%C3%A9sidence&status=ACTIVE", "GET", undefined, signal],
    [base + "/fiche%2Ftest", "GET", undefined, signal],
    [base, "POST", input],
    [base + "/fiche%2Ftest", "PATCH", { ...input, version: 7 }],
    [base + "/fiche%2Ftest/status", "PATCH", { status: "ARCHIVED", version: 8 }],
    [local + "/fiche%2Ftest", "PATCH", { enabled: true }],
  ];
  context.mock.method(globalThis, "fetch", async (url, options) => {
    const [path, method, payload, requestSignal] = expected.shift();
    assert.equal(url, path);
    assert.equal(options.method ?? "GET", method);
    assert.equal(options.cache, "no-store");
    assert.equal(options.credentials, "same-origin");
    assert.equal(options.headers.get("X-IKBS-Request"), method === "GET" ? null : "1");
    assert.equal(options.signal, requestSignal);
    assert.deepEqual(options.body ? JSON.parse(options.body) : undefined, payload);
    return Response.json({ id: "fixture" });
  });
  await listCommissionFunctions("org fixture", { page: 2, limit: 25, search: "Présidence", status: "ACTIVE" }, signal);
  await getCommissionFunction("", "fiche/test", signal);
  await createCommissionFunction("", input);
  await updateCommissionFunction("", "fiche/test", { ...input, version: 7 });
  await archiveCommissionFunction("", "fiche/test", 8);
  await setCommissionFunctionEnabled("org fixture", "fiche/test", true);
  assert.equal(expected.length, 0);
});

test("reports a catalogue conflict without repeating the mutation", async (context) => {
  const fetch = context.mock.method(globalThis, "fetch", async () => Response.json(
    { error: "COMMISSION_FUNCTION_VERSION_CONFLICT" }, { status: 409 },
  ));
  await assert.rejects(archiveCommissionFunction("test", "fixture", 7), (error) => {
    assert.match(functionErrorMessage(error), /Relisez les données/);
    return true;
  });
  assert.equal(fetch.mock.callCount(), 1);
});
