import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, mock, test } from "node:test";

const require = createRequire(import.meta.url);
const compiled = mkdtempSync(join(tmpdir(), "ikbs-web-auth-"));
after(() => rmSync(compiled, { recursive: true, force: true }));
execFileSync(process.execPath, [
  require.resolve("typescript/bin/tsc"), "--target", "ES2022", "--module", "commonjs", "--skipLibCheck",
  "--rootDir", "src", "--outDir", compiled,
  "src/lib/api/auth.ts", "src/lib/auth/redirect.ts", "src/lib/auth/session-cookie.ts", "src/lib/auth/workspaces.ts",
]);

const { login, getSession, logout } = require(join(compiled, "lib/api/auth.js"));
const { ApiError } = require(join(compiled, "lib/api/client.js"));
const { safeReturnPath, loginPath } = require(join(compiled, "lib/auth/redirect.js"));
const { sessionCookieHeader } = require(join(compiled, "lib/auth/session-cookie.js"));

test("uses a relative same-origin login with JSON and the mutation protection header", async () => {
  const profile = { user: { id: "one" } };
  const fetch = mock.method(globalThis, "fetch", async (url, options) => {
    assert.equal(url, "/api/v1/auth/login");
    assert.equal(options.credentials, "same-origin");
    assert.equal(options.cache, "no-store");
    assert.equal(options.headers.get("X-IKBS-Request"), "1");
    assert.equal(options.headers.get("content-type"), "application/json");
    assert.deepEqual(JSON.parse(options.body), { identifier: "example", password: " spaces " });
    return Response.json(profile);
  });
  try {
    assert.deepEqual(await login({ identifier: "example", password: " spaces " }), profile);
  } finally {
    fetch.mock.restore();
  }
});

test("preserves 400, 401, 403, 429 and 503, including Fastify codes", async () => {
  for (const [status, code] of [[400, "INVALID_INPUT"], [401, "INVALID_CREDENTIALS"],
    [403, "CSRF_REJECTED"], [429, "RATE_LIMITED"], [503, "AUTH_UNAVAILABLE"]]) {
    const fetch = mock.method(globalThis, "fetch", async () =>
      Response.json({ error: code, message: "Failure" }, { status, headers: { "Retry-After": "60" } }));
    try {
      await assert.rejects(login({ identifier: "fixture", password: "fixture" }), (error) =>
        error instanceof ApiError && error.status === status && error.code === code && error.retryAfter === "60");
    } finally {
      fetch.mock.restore();
    }
  }
});

test("me keeps expiration distinct from server failure, logout accepts an empty 204", async () => {
  const fetch = mock.method(globalThis, "fetch", async (url, options) => {
    assert.equal(options.cache, "no-store");
    if (url.endsWith("/logout")) {
      assert.equal(options.headers.get("x-ikbs-request"), "1");
      assert.equal(options.headers.get("content-type"), null);
      return new Response(null, { status: 204 });
    }
    assert.equal(options.headers.get("x-ikbs-request"), null);
    return Response.json({ error: "SESSION_EXPIRED" }, { status: 401 });
  });
  try {
    await assert.rejects(getSession(), { status: 401, code: "SESSION_EXPIRED" });
    assert.equal(await logout(), undefined);
  } finally {
    fetch.mock.restore();
  }
});

test("server cookie headers are isolated per call and never forwarded on a redirect", async () => {
  const values = ["a".repeat(43), "b".repeat(43)];
  const fetch = mock.method(globalThis, "fetch", async (url, options) => {
    assert.equal(url, "http://127.0.0.1:3000/api/v1/auth/me");
    assert.equal(options.cache, "no-store");
    assert.equal(options.redirect, "error");
    assert.deepEqual([...options.headers], [["cookie", options.headers.get("cookie")]]);
    return Response.json({ user: { id: options.headers.get("cookie").at(-1) } });
  });
  try {
    const profiles = await Promise.all(values.map((value) => getSession({
      headers: { Cookie: sessionCookieHeader([{ value }]) },
    }, "http://127.0.0.1:3000")));
    assert.deepEqual(profiles.map(({ user }) => user.id), ["a", "b"]);
    assert.equal(sessionCookieHeader([{ value: "x; other=value" }]), undefined);
    assert.equal(sessionCookieHeader(values.map((value) => ({ value }))), undefined);
  } finally {
    fetch.mock.restore();
  }
});

test("return locations are allowlisted internal pages", () => {
  assert.equal(safeReturnPath("/espace/O1234567"), "/espace/O1234567");
  assert.equal(loginPath("/dash/organisations"), "/login?redirect=%2Fdash%2Forganisations");
  for (const value of ["https://other.test", "//other.test", "/\\other.test", "/%2Fother.test", "javascript:alert(1)",
    "/dash/../login", "/login", "/dash?redirect=https://other.test", "/dash\n", "/admin"]) {
    assert.equal(safeReturnPath(value), "/");
  }
});

const { postLoginPath, accessibleOrganizations, findWorkspace, canManageOrganizations } =
  require(join(compiled, "lib/auth/workspaces.js"));
const north = { id: "north", code: "N1234567", name: "Nord", permissions: ["organization.read", "organization.profile.update"] };
const south = { id: "south", code: "S1234567", name: "Sud", permissions: ["organization.read"] };

test("post-login routes use actual global and local capabilities", () => {
  assert.equal(postLoginPath({ globalPermissions: ["organizations.global.manage"], organizations: [] }, null), "/dash");
  assert.equal(postLoginPath({ globalPermissions: [], organizations: [north] }, null), "/espace/N1234567");
  assert.equal(postLoginPath({ globalPermissions: [], organizations: [north, south] }, null), "/espaces");
  assert.equal(postLoginPath({ globalPermissions: [], organizations: [] }, null), "/espaces");
  assert.equal(postLoginPath({ globalPermissions: ["requests.platform.review"], organizations: [] }, null), "/dash/demandes");
});

test("requested workspace is allowed only if represented by the profile", () => {
  const profile = { globalPermissions: [], organizations: [north, south] };
  assert.equal(postLoginPath(profile, "/espace/S1234567"), "/espace/S1234567");
  assert.equal(postLoginPath(profile, "/dash/organisations"), "/espaces");
  assert.equal(postLoginPath(profile, "/espace/X1234567"), "/espaces");
  assert.equal(postLoginPath(profile, "//other.test"), "/espaces");
  assert.equal(postLoginPath(profile, "/organisations"), "/organisations");
  assert.equal(canManageOrganizations(profile), false);
});

test("a removed or unreadable membership grants neither access nor edit", () => {
  const profile = { globalPermissions: ["organizations.global.manage"], organizations: [
    { ...north, permissions: ["organization.profile.update"] }, south,
  ] };
  assert.deepEqual(accessibleOrganizations(profile), [south]);
  assert.equal(findWorkspace(profile, north.code), undefined);
  assert.deepEqual(findWorkspace(profile, "s1234567")?.permissions, ["organization.read"]);
});
test("the roles menu follows server capabilities in the selected organization", () => {
  const { findWorkspace, hasWorkspacePermission, rolesManage, rolesAssign } =
    require(join(compiled, "lib/auth/workspaces.js"));
  const enabled = ["organization.read", "organization.profile.update", "members.write", "roles.manage", "roles.assign"];
  const profile = { organizations: [
    { id: "admin", code: "D1000001", role: "ORGANIZATION_ADMIN", permissions: enabled },
    { id: "member", code: "D1000002", role: "MEMBER", permissions: ["organization.read"] },
    { id: "without-grant", code: "D1000003", role: "ORGANIZATION_ADMIN", permissions: ["organization.read"] },
  ] };
  const visible = (code) => hasWorkspacePermission(findWorkspace(profile, code)?.permissions ?? [], [rolesManage, rolesAssign]);
  assert.equal(visible("D1000001"), true);
  assert.equal(visible("D1000002"), false);
  assert.equal(visible("D1000003"), false);
  assert.equal(visible("D1000004"), false);
  assert.equal(hasWorkspacePermission(["roles.assign"], [rolesManage, rolesAssign]), true);
});
