import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, mock, test } from "node:test";

const require = createRequire(import.meta.url);
const compiled = mkdtempSync(join(tmpdir(), "ikbs-web-roles-"));
after(() => rmSync(compiled, { recursive: true, force: true }));
execFileSync(process.execPath, [
  require.resolve("typescript/bin/tsc"), "--target", "ES2022", "--module", "commonjs",
  "--skipLibCheck", "--rootDir", "src", "--outDir", compiled, "src/lib/api/roles.ts",
]);
const {
  listRoles, listDelegableRolePermissions, createRole, updateRole, deleteRole, roleErrorMessage,
  listMemberships, listAssignableRoles, listAssignedRoles, assignRole, removeRoleAssignment, assignmentErrorMessage,
} = require(join(compiled, "lib/api/roles.js"));

test("uses Fastify routes for role definitions and delegable permissions", async () => {
  const expected = [
    ["GET", "/roles", undefined, { items: [] }],
    ["GET", "/role-permissions", undefined, { permissions: ["members.write"] }],
    ["POST", "/roles", { code: "bureau", name: "Bureau", description: null, permissions: ["members.write"] }, { id: "bureau" }],
    ["PATCH", "/roles/bureau", { name: "Bureau local" }, { id: "bureau" }],
    ["DELETE", "/roles/bureau", undefined, undefined],
  ];
  const fetch = mock.method(globalThis, "fetch", async (url, options) => {
    const [method, path, body, reply] = expected.shift();
    assert.equal(url, "/api/v1/organizations/org%20test" + path);
    assert.equal(options.method ?? "GET", method);
    assert.equal(options.cache, "no-store");
    assert.equal(options.credentials, "same-origin");
    assert.equal(options.headers.get("X-IKBS-Request"), method === "GET" ? null : "1");
    assert.deepEqual(options.body ? JSON.parse(options.body) : undefined, body);
    return reply === undefined ? new Response(null, { status: 204 }) : Response.json(reply);
  });
  try {
    const signal = new AbortController().signal;
    assert.deepEqual(await listRoles("org test", signal), { items: [] });
    assert.deepEqual(await listDelegableRolePermissions("org test", signal), { permissions: ["members.write"] });
    await createRole("org test", { code: "bureau", name: "Bureau", description: null, permissions: ["members.write"] });
    await updateRole("org test", "bureau", { name: "Bureau local" });
    await deleteRole("org test", "bureau");
    assert.equal(expected.length, 0);
  } finally {
    fetch.mock.restore();
  }
});

test("reports access errors and a role still in use", async () => {
  for (const [status, code, message] of [
    [401, "SESSION_EXPIRED", /session/], [403, "FORBIDDEN", /compte/],
    [404, "ORG_ROLE_NOT_FOUND", /introuvable/], [409, "ORG_ROLE_IN_USE", /encore attribué/],
  ]) {
    const fetch = mock.method(globalThis, "fetch", async () => Response.json({ error: code }, { status }));
    try {
      await assert.rejects(deleteRole("org", "bureau"), (error) => {
        assert.equal(error.status, status);
        assert.match(roleErrorMessage(error), message);
        return true;
      });
    } finally {
      fetch.mock.restore();
    }
  }
});

test("paginates active memberships and uses identityId for assignment requests", async () => {
  const expected = [
    ["GET", "/memberships?page=2&limit=15&search=Membre+Un", undefined, { items: [{ identityId: "id@local", displayName: "Membre Un" }] }],
    ["GET", "/assignable-roles", undefined, { items: [{ id: "bureau", name: "Bureau" }] }],
    ["GET", "/memberships/id%40local/roles", undefined, { roleIds: [] }],
    ["POST", "/memberships/id%40local/roles", { roleId: "bureau" }, { roleId: "bureau" }],
    ["DELETE", "/memberships/id%40local/roles/bureau", undefined, undefined],
  ];
  const fetch = mock.method(globalThis, "fetch", async (url, options) => {
    const [method, path, payload, result] = expected.shift();
    assert.equal(url, "/api/v1/organizations/org" + path);
    assert.equal(options.method ?? "GET", method);
    assert.equal(options.headers.get("X-IKBS-Request"), method === "GET" ? null : "1");
    assert.deepEqual(options.body ? JSON.parse(options.body) : undefined, payload);
    return result === undefined ? new Response(null, { status: 204 }) : Response.json(result);
  });
  try {
    const signal = new AbortController().signal;
    const result = await listMemberships("org", 2, "Membre Un", signal);
    const { identityId } = result.items[0];
    await listAssignableRoles("org", signal);
    await listAssignedRoles("org", identityId, signal);
    await assignRole("org", identityId, "bureau");
    await removeRoleAssignment("org", identityId, "bureau");
    assert.equal(expected.length, 0);
  } finally {
    fetch.mock.restore();
  }
});

test("keeps Fastify's refusal of self-assignment visible", async () => {
  const fetch = mock.method(globalThis, "fetch", async () =>
    Response.json({ error: "ROLE_SELF_ASSIGNMENT" }, { status: 403 }));
  try {
    await assert.rejects(assignRole("org", "self", "bureau"), (error) => {
      assert.equal(error.status, 403);
      assert.match(assignmentErrorMessage(error), /vous attribuer/);
      return true;
    });
  } finally {
    fetch.mock.restore();
  }
});
