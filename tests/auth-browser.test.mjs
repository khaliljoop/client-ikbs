import assert from "node:assert/strict";
import { execFileSync, spawn } from "node:child_process";
import { once } from "node:events";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { createServer } from "node:http";
import { request as httpsRequest } from "node:https";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { test } from "node:test";

const chrome = process.env.IKBS_TEST_CHROME;
const cookieName = "__Host-ikbs_session";
const publicOrganization = { code: "O1234567", name: "Organisation publique", description: "Présentation de recette", status: "ACTIVE" };

async function listen(server) {
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  return server.address().port;
}

async function waitUntil(check, message, seconds = 45) {
  const deadline = Date.now() + seconds * 1000;
  while (Date.now() < deadline) {
    try {
      const result = await check();
      if (result) return result;
    } catch {
      // The application or browser may still be starting.
    }
    await delay(200);
  }
  throw new Error(message);
}

function localHttps(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const request = httpsRequest(url, { rejectUnauthorized: false, headers }, async (response) => {
      let body = "";
      for await (const chunk of response) body += chunk;
      resolve({ status: response.statusCode, headers: response.headers, body });
    });
    request.on("error", reject);
    request.end();
  });
}

async function connectDebugger(socketUrl) {
  const socket = new WebSocket(socketUrl);
  await once(socket, "open");
  const calls = new Map();
  const events = new Set();
  let counter = 0;
  socket.addEventListener("message", (event) => {
    const response = JSON.parse(event.data);
    if (response.method) for (const listener of events) listener(response);
    const call = calls.get(response.id);
    if (!call) return;
    calls.delete(response.id);
    if (response.error) call.reject(new Error(response.error.message));
    else call.resolve(response.result);
  });
  return {
    close: () => socket.close(),
    onEvent: (listener) => events.add(listener),
    send(method, params = {}) {
      const id = ++counter;
      return new Promise((resolve, reject) => {
        calls.set(id, { resolve, reject });
        socket.send(JSON.stringify({ id, method, params }));
      });
    },
  };
}

test("Chrome HTTPS exercises login, SSR isolation, public discovery, CRUD and logout", {
  skip: chrome ? false : "set IKBS_TEST_CHROME to a local Chrome or Chromium binary",
  timeout: 240_000,
}, async (context) => {
  const scratch = mkdtempSync(join(tmpdir(), "ikbs-chrome-"));
  context.after(() => rmSync(scratch, { recursive: true, force: true }));
  const key = join(scratch, "key.pem");
  const cert = join(scratch, "cert.pem");
  execFileSync("openssl", ["req", "-x509", "-nodes", "-newkey", "rsa:2048", "-keyout", key, "-out", cert,
    "-days", "1", "-subj", "/CN=127.0.0.1"], { stdio: "ignore" });

  const sessions = new Map();
  const seenMeCookies = [];
  const records = new Map();
  const roles = new Map();
  let organizationRequest;
  const assignedRoles = new Set();
  const linkedMemberId = "10000000-0000-4000-8000-000000000001";
  const unlinkedMemberId = "10000000-0000-4000-8000-000000000002";
  const eligibleMembership = { identityId: "eligible", displayName: "Compte à habiliter" };
  let assignmentPosts = 0, assignmentDeletes = 0, directoryReads = 0, canAssignInApi = true;
  const commissions = new Map();
  let commissionPosts = 0, commissionRefreshFailure = false, commissionPostRefused = true;
  const commissionWrites = [];
  const commissionReads = [];
  let rolePostCount = 0, rolePatchCount = 0, roleReads = 0;
  let rolePost = "denied", rolePatch = "denied", roleRefreshFailure = false;
  let backendUnavailable = false;
  let localReadStatus = 200;
  let localEditStatus = 200;
  let localReads = 0;
  const north = { id: "north", code: "N1234567", name: "Organisation Nord", permissions: ["organization.read", "organization.profile.update"] };
  const south = { id: "south", code: "S1234567", name: "Organisation Sud", permissions: ["organization.read"] };
  const testProfiles = new Map([
    ["fixture", { token: "b", globalPermissions: ["organizations.global.manage"], organizations: [], displayName: "Compte navigateur" }],
    ["multi", { token: "m", globalPermissions: [], organizations: [north, south], displayName: "Compte multi" }],
    ["local", { token: "l", globalPermissions: [], organizations: [north], displayName: "Compte local" }],
    ["role-admin", { token: "r", globalPermissions: [], organizations: [{ ...north,
      permissions: [...north.permissions, "roles.manage", "roles.assign", "commissions.read", "commissions.manage"] }], displayName: "Role admin" }],
    ["commission-reader", { token: "c", globalPermissions: [], organizations: [
      { ...north, permissions: ["organization.read", "commissions.read"] }, south,
    ], displayName: "Lecteur commissions" }],
    ["empty", { token: "e", globalPermissions: [], organizations: [], displayName: "Compte sans espace" }],
    ["reviewer", { token: "q", globalPermissions: ["requests.platform.review"], organizations: [], displayName: "Compte instructeur" }],
  ]);
  let webOrigin;
  const backend = createServer(async (request, response) => {
    const path = new URL(request.url, "http://127.0.0.1").pathname;
    const method = request.method;
    const send = (status, body, headers = {}) => {
      response.writeHead(status, { "Content-Type": "application/json", "Cache-Control": "no-store", ...headers });
      response.end(body === undefined ? undefined : JSON.stringify(body));
    };
    const failure = (status, error) => send(status, { error, message: "Fixture error" });
    const token = request.headers.cookie?.match(/(?:^|;\s*)__Host-ikbs_session=([A-Za-z0-9_-]{43})/)?.[1];
    if (method !== "GET" && (request.headers.origin !== webOrigin || request.headers["x-ikbs-request"] !== "1")) {
      return failure(403, "CSRF_REJECTED");
    }
    if (path.endsWith("/auth/password/reset") && method === "POST") {
      let body = "";
      for await (const chunk of request) body += chunk;
      assert.deepEqual(JSON.parse(body), { code: "synthetic-password-link", password: "synthetic-new-password" });
      return send(204);
    }
    if (path.endsWith("/auth/login")) {
      let body = "";
      for await (const chunk of request) body += chunk;
      const { identifier, password } = JSON.parse(body);
      if (identifier === "limited") return failure(429, "RATE_LIMITED");
      const fixture = testProfiles.get(identifier);
      if (!fixture || password !== "synthetic-password") return failure(401, "INVALID_CREDENTIALS");
      const secret = fixture.token.repeat(43);
      const profile = { user: { id: identifier, memberId: null, displayName: fixture.displayName },
        globalPermissions: fixture.globalPermissions, organizations: fixture.organizations,
        session: { expiresAt: new Date(Date.now() + 60_000).toISOString() } };
      sessions.set(secret, profile);
      return send(200, profile, {
        "Set-Cookie": cookieName + "=" + secret + "; Path=/; Max-Age=60; HttpOnly; Secure; SameSite=Lax",
      });
    }
    if (path.endsWith("/auth/me")) {
      seenMeCookies.push(request.headers.cookie);
      if (backendUnavailable) return failure(503, "AUTH_UNAVAILABLE");
      return sessions.has(token) ? send(200, sessions.get(token)) : failure(401, "SESSION_EXPIRED");
    }
    if (path.endsWith("/auth/logout")) {
      sessions.delete(token);
      return send(204, undefined, { "Set-Cookie": cookieName + "=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax" });
    }
    if (path.endsWith("/organizations/public")) {
      return send(200, { items: [publicOrganization], total: 1, page: 1, limit: 9, totalPages: 1 });
    }
    if (path.endsWith("/organizations/public/" + publicOrganization.code)) return send(200, publicOrganization);
    if (path === "/api/v1/membership-requests/public" && method === "POST") {
      assert.equal(sessions.has(token), false);
      let body = "";
      for await (const chunk of request) body += chunk;
      organizationRequest = { ...JSON.parse(body), id: "request-fixture", reference: "DEM-2026-000001",
        status: "PENDING", canProvision: false, organizationId: null,
        createdAt: "2026-11-26T00:00:00Z" };
      return send(202, { challengeId: "otp-fixture", expiresIn: 600 });
    }
    if (path === "/api/v1/membership-requests/public/verify" && method === "POST") {
      assert.equal(sessions.has(token), false);
      let body = "";
      for await (const chunk of request) body += chunk;
      const { challengeId, otp } = JSON.parse(body);
      if (challengeId !== "otp-fixture" || otp !== "123456") return failure(400, "REQUEST_EMAIL_CODE_INVALID");
      return send(201, { reference: organizationRequest.reference, code: "z".repeat(32) });
    }
    if (path === "/api/v1/membership-requests/public/confirm-link" && method === "POST") {
      let body = "";
      for await (const chunk of request) body += chunk;
      assert.deepEqual(JSON.parse(body), { token: "synthetic-link-token" });
      return send(201, { reference: "DEM-2026-000002", code: "y".repeat(32) });
    }
    if (path === "/api/v1/membership-requests/track" && method === "POST") {
      let body = "";
      for await (const chunk of request) body += chunk;
      const { reference, code } = JSON.parse(body);
      if (reference !== organizationRequest?.reference || code !== "z".repeat(32)) {
        return failure(404, "REQUEST_TRACKING_UNAVAILABLE");
      }
      return send(200, { reference, status: organizationRequest.status, createdAt: organizationRequest.createdAt, reviewedAt: null });
    }
    if (!sessions.has(token)) return failure(401, "SESSION_EXPIRED");
    if (path === "/api/v1/membership-requests/claim" && method === "POST") {
      let body = "";
      for await (const chunk of request) body += chunk;
      assert.deepEqual(JSON.parse(body), { reference: organizationRequest.reference, code: "z".repeat(32) });
      organizationRequest.canProvision = true;
      return send(204);
    }
    if (path.startsWith("/api/v1/membership-requests")) {
      if (!sessions.get(token).globalPermissions.includes("requests.platform.review")) return failure(403, "FORBIDDEN");
      if (path.endsWith("/approve") && method === "PATCH") {
        organizationRequest = { ...organizationRequest, status: "APPROVED", organizationId: "created-organization" };
        return send(200, organizationRequest);
      }
      const status = new URL(request.url, "http://127.0.0.1").searchParams.get("status");
      const data = organizationRequest && (!status || organizationRequest.status === status) ? [organizationRequest] : [];
      return send(200, { data, pagination: { total: data.length, totalPages: data.length } });
    }
    const roleBase = "/api/v1/organizations/north";
    if (path === roleBase + "/members") return send(200, { items: [
      { id: linkedMemberId, firstName: "Membre", lastName: "Lié", code: "MBR-2026-000001", status: "ACTIVE" },
      { id: unlinkedMemberId, firstName: "Membre", lastName: "Sans compte", code: "MBR-2026-000002", status: "ACTIVE" },
    ], total: 2, page: 1, limit: 10 });
    if (path === roleBase + "/role-permissions") return send(200, { permissions: ["organization.read", "members.write"] });
    if (/\/(memberships|assignable-roles)(\/|$)/.test(path)) {
      const organization = sessions.get(token).organizations.find(({ id }) => path.startsWith("/api/v1/organizations/" + id + "/"));
      if (!organization) return failure(404, "ORGANIZATION_NOT_FOUND");
      if (!organization.permissions.includes("roles.assign") || !canAssignInApi) return failure(403, "FORBIDDEN");
      if (path === roleBase + "/memberships") {
        directoryReads++;
        const query = new URL(request.url, "http://127.0.0.1").searchParams;
        const memberId = query.get("memberId");
        const search = query.get("search") ?? "";
        const page = Number(query.get("page") ?? 1);
        const limit = Number(query.get("limit") ?? 15);
        const items = (memberId ? (memberId === linkedMemberId ? [eligibleMembership] : []) :
          [{ identityId: "role-admin", displayName: "Role admin" }, eligibleMembership, ...Array.from({ length: 118 },
            (_, index) => ({ identityId: "fixture-" + index, displayName: "Compte " + index }))])
          .filter(({ identityId, displayName }) => (identityId + " " + displayName).includes(search));
        return send(200, { items: items.slice((page - 1) * limit, page * limit), total: items.length, page, limit });
      }
      if (path === roleBase + "/assignable-roles") return send(200, { items: [...roles.values()].map(({ id, name }) => ({ id, name })) });
      const [, identityId, roleId] = path.match(/memberships\/([^/]+)\/roles(?:\/([^/]+))?$/) ?? [];
      if (identityId === "role-admin") return method === "GET" ? send(200, { roleIds: [] }) : failure(403, "ROLE_SELF_ASSIGNMENT");
      if (identityId !== "eligible") return failure(404, "ACTIVE_MEMBERSHIP_NOT_FOUND");
      if (method === "GET") return send(200, { roleIds: [...assignedRoles] });
      if (method === "POST") {
        assignmentPosts++;
        let body = "";
        for await (const chunk of request) body += chunk;
        const { roleId } = JSON.parse(body);
        await delay(100);
        if (assignedRoles.has(roleId)) return failure(409, "ROLE_ALREADY_ASSIGNED");
        assignedRoles.add(roleId);
        return send(201, { roleId });
      }
      if (method === "DELETE") {
        assignmentDeletes++;
        assignedRoles.delete(roleId);
        return send(204);
      }
    }
    if (path === roleBase + "/roles" || path.startsWith(roleBase + "/roles/")) {
      if (method === "GET") {
        roleReads++;
        return roleRefreshFailure ? failure(503, "UNAVAILABLE") : send(200, { items: [...roles.values()] });
      }
      let body = "";
      for await (const chunk of request) body += chunk;
      const input = JSON.parse(body);
      if (method === "POST") {
        rolePostCount++;
        if (rolePost === "network") return response.destroy();
        if (rolePost === "denied") return failure(409, "ORG_ROLE_CODE_EXISTS");
        if (roles.has(input.code)) return failure(409, "ORG_ROLE_CODE_EXISTS");
        const role = { ...input, id: input.code, organizationId: "north" };
        roles.set(role.id, role);
        return send(201, role);
      }
      if (method === "PATCH") {
        rolePatchCount++;
        if (rolePatch === "denied") return failure(403, "ORG_ROLE_PERMISSION_NOT_HELD");
        assert.equal("code" in input, false);
        assert.equal("permissions" in input, false);
        const id = path.split("/").at(-1);
        const saved = { ...roles.get(id), ...input };
        roles.set(id, saved);
        return send(200, saved);
      }
    }
    const commissionBase = roleBase + "/commissions";
    if (path === commissionBase || path.startsWith(commissionBase + "/")) {
      if (method === "GET") {
        const filters = new URL(request.url, "http://127.0.0.1").searchParams;
        commissionReads.push(Object.fromEntries(filters));
        if (commissionRefreshFailure) return response.destroy();
        if (path !== commissionBase) return send(200, commissions.get(path.split("/").at(-1)));
        const search = filters.get("search") ?? "";
        const status = filters.get("status");
        const page = Number(filters.get("page")), limit = Number(filters.get("limit"));
        if (search === "Retard") await delay(900);
        const rows = [...commissions.values()].filter((item) =>
          (!status || status === item.status) && (search === "Page" || [item.name, item.description, item.code].join(" ").includes(search)));
        const items = page === 1 ? rows.slice(0, limit) : [];
        return send(200, { items, page, limit, total: search === "Page" ? 11 : rows.length, totalPages: search === "Page" ? 2 : Math.ceil(rows.length / limit) });
      }
      let body = "";
      for await (const chunk of request) body += chunk;
      const input = JSON.parse(body);
      commissionWrites.push({ method, path, input });
      if (method === "POST") {
        commissionPosts++;
        if (commissionPostRefused) return failure(400, "INVALID_COMMISSION_INPUT");
        const now = "2026-11-23T12:00:00.000Z";
        const entity = { ...input, organizationId: "north", id: "commission", code: "COM-000001",
          version: 1, status: "ACTIVE", createdAt: now, updatedAt: now, archivedAt: null };
        commissions.set(entity.id, entity);
        return send(201, entity);
      }
      const entity = commissions.get("commission");
      if (input.version !== entity.version) return failure(409, "COMMISSION_VERSION_CONFLICT");
      const archived = path.endsWith("/status");
      const updated = { ...entity, ...input, version: entity.version + 1,
        archivedAt: archived ? entity.updatedAt : null };
      commissions.set(entity.id, updated);
      return send(200, updated);
    }
    const orgId = path.split("/").at(-1);
    if (orgId === "north" || orgId === "south") {
      const organization = sessions.get(token).organizations.find((item) => item.id === orgId);
      if (!organization) return failure(404, "ORGANIZATION_NOT_FOUND");
      if (method === "GET") {
        localReads++;
        if (localReadStatus !== 200) return failure(localReadStatus, "ORGANIZATION_FAILURE");
        return send(200, { id: organization.id, code: organization.code, name: organization.name,
          description: "Fiche privée " + orgId, status: "ACTIVE" });
      }
      if (method === "PATCH" && localEditStatus !== 200) return failure(localEditStatus, "FORBIDDEN");
      if (method === "PATCH") {
        let body = "";
        for await (const chunk of request) body += chunk;
        return send(200, { id: organization.id, code: organization.code, status: "ACTIVE", ...JSON.parse(body) });
      }
    }
    if (path.endsWith("/organizations") && method === "GET") {
      return send(200, { items: [...records.values()], total: records.size, page: 1, limit: 10, totalPages: 1 });
    }
    if (path.includes("/organizations") && (method === "POST" || method === "PATCH")) {
      let body = "";
      for await (const chunk of request) body += chunk;
      const id = "organization-id";
      const value = { ...publicOrganization, ...(records.get(id) ?? {}), ...JSON.parse(body), id };
      records.set(id, value);
      return send(method === "POST" ? 201 : 200, value);
    }
    if (method === "DELETE" && path.endsWith("/organizations/organization-id")) {
      records.delete("organization-id");
      return send(204);
    }
    return failure(404, "NOT_FOUND");
  });
  const backendPort = await listen(backend);
  context.after(() => { backend.closeAllConnections(); backend.close(); });
  const probe = createServer();
  const webPort = await listen(probe);
  await new Promise((resolve) => probe.close(resolve));
  webOrigin = "https://127.0.0.1:" + webPort;

  let logs = "";
  const next = spawn(process.execPath, ["node_modules/next/dist/bin/next", "dev", "--webpack", "--hostname", "127.0.0.1",
    "--port", String(webPort), "--experimental-https", "--experimental-https-key", key, "--experimental-https-cert", cert], {
    env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1", IKBS_API_ORIGIN: "http://127.0.0.1:" + backendPort },
    stdio: ["ignore", "pipe", "pipe"],
  });
  next.stdout.on("data", (chunk) => { logs += chunk; });
  next.stderr.on("data", (chunk) => { logs += chunk; });
  context.after(() => next.kill());
  await waitUntil(async () => (await localHttps(webOrigin + "/login")).status === 200, "Next.js HTTPS did not start")
    .catch((error) => { throw new Error(logs, { cause: error }); });

  let debugPort;
  let browserLogs = "";
  const browser = spawn(chrome, ["--headless=new", "--remote-debugging-port=0", "--remote-debugging-address=127.0.0.1",
    "--user-data-dir=" + join(scratch, "chrome"), "--ignore-certificate-errors", "--no-first-run",
    "--no-default-browser-check", "--disable-background-networking", "--disable-component-update",
    "--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE 127.0.0.1", "about:blank"], { stdio: ["ignore", "ignore", "pipe"] });
  browser.stderr.on("data", (chunk) => {
    browserLogs = (browserLogs + chunk.toString()).slice(-8192);
    debugPort ??= browserLogs.match(/DevTools listening on ws:\/\/127\.0\.0\.1:(\d+)\//)?.[1];
  });
  context.after(() => browser.kill());
  const debuggerPort = await waitUntil(() => debugPort ?? readFileSync(join(scratch, "chrome", "DevToolsActivePort"), "utf8").split("\n")[0],
    "Chrome debugger did not start");
  const [target] = await fetch("http://127.0.0.1:" + debuggerPort + "/json/list").then((result) => result.json());
  const cdp = await connectDebugger(target.webSocketDebuggerUrl);
  context.after(() => cdp.close());
  await cdp.send("Page.enable");
  await cdp.send("Runtime.enable");
  const duplicateKeys = [];
  cdp.onEvent((event) => {
    if (event.method === "Runtime.consoleAPICalled" && event.params.args.some((arg) => String(arg.value).includes("same key"))) {
      duplicateKeys.push(event.params.type);
    }
  });
  await cdp.send("Emulation.setDeviceMetricsOverride", { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
  const evaluate = async (expression) => {
    const result = await cdp.send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
    return result.result.value;
  };
  const navigate = (path) => cdp.send("Page.navigate", { url: webOrigin + path });
  const bodyIncludes = (text) => evaluate("document.body?.innerText.includes(" + JSON.stringify(text) + ")");
  const submit = async (identifier, password) => {
    await evaluate("(() => { const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;" +
      "for (const [selector, value] of " + JSON.stringify([["#identifier", identifier], ["#password", password]]) + ") {" +
      "const input = document.querySelector(selector); set.call(input,value); input.dispatchEvent(new Event('input',{bubbles:true})); }" +
      "document.querySelector('form button[type=submit]').click(); })()");
  };

  await navigate("/dash");
  await waitUntil(() => evaluate("location.pathname === '/login' && !!document.querySelector('#identifier')"), "Anonymous SSR redirect missing");
  await evaluate("localStorage.setItem('ikbs_mock_user', 'old-fixture')");
  await cdp.send("Page.reload");
  await waitUntil(() => evaluate("!!document.querySelector('#identifier') && localStorage.getItem('ikbs_mock_user') === null"), "Legacy storage was not purged");
  // Allow hydration before interacting with the controlled form.
  await delay(500);
  await submit("fixture", "invalid");
  await waitUntil(() => bodyIncludes("Identifiant ou mot de passe incorrect"), "Missing 401 login feedback");
  await submit("limited", "invalid");
  await waitUntil(() => bodyIncludes("Trop de tentatives"), "Missing 429 login feedback");
  await submit("fixture", "synthetic-password");
  await waitUntil(() => bodyIncludes("Compte navigateur"), "Logged-in SSR did not render the profile", 20)
    .catch(async (error) => { throw new Error(JSON.stringify({ location: await evaluate("location.pathname"),
      visible: await evaluate("document.body?.innerText.slice(0,400)"),
      forwardedSession: seenMeCookies.some((value) => value?.startsWith(cookieName + "=")) }), { cause: error }); });
  assert.ok(!(await evaluate("document.cookie")).includes(cookieName));
  assert.ok(!(await evaluate("JSON.stringify(localStorage)")).includes("synthetic-password"));
  const cookies = await cdp.send("Network.getCookies", { urls: [webOrigin] });
  assert.ok(cookies.cookies.some((item) => item.name === cookieName && item.httpOnly && item.secure && item.sameSite === "Lax"));

  const other = "a".repeat(43);
  sessions.set(other, { user: { id: "other", memberId: null, displayName: "Compte indépendant" },
    globalPermissions: ["organizations.global.manage"], organizations: [], session: { expiresAt: new Date(Date.now() + 60_000).toISOString() } });
  const [first, second] = await Promise.all([
    localHttps(webOrigin + "/dash", { Cookie: cookieName + "=" + "b".repeat(43) + "; other_cookie=private" }),
    localHttps(webOrigin + "/dash", { Cookie: cookieName + "=" + other }),
  ]);
  assert.match(first.body, /Compte navigateur/);
  assert.doesNotMatch(first.body, /Compte indépendant/);
  assert.match(second.body, /Compte indépendant/);
  assert.doesNotMatch(second.body, /Compte navigateur/);
  assert.ok(!seenMeCookies.some((value) => value?.includes("other_cookie")));
  assert.match(first.headers["cache-control"], /no-store|no-cache/);
  const privateApi = await localHttps(webOrigin + "/api/v1/auth/me", { Cookie: cookieName + "=" + other });
  assert.match(privateApi.headers["cache-control"], /no-store/);

  await navigate("/organisations");
  await waitUntil(() => bodyIncludes(publicOrganization.name), "Public directory fixture not visible");
  await navigate("/organisations/" + publicOrganization.code);
  await waitUntil(() => bodyIncludes(publicOrganization.description), "Public detail fixture not visible");
  await navigate("/dash/organisations");
  await waitUntil(() => bodyIncludes("Compte navigateur"), "Private CRUD layout did not render");
  const statuses = await evaluate("(async () => {const headers={'x-ikbs-request':'1','content-type':'application/json'};" +
    "const base='/api/v1/organizations'; const actions=[['POST','', {name:'Créer'}],['PATCH','/organization-id',{name:'Modifier'}]," +
    "['PATCH','/organization-id/status',{status:'SUSPENDED'}],['DELETE','/organization-id']];" +
    "const codes=[]; for (const [method,path,body] of actions) codes.push((await fetch(base+path,{method,headers,body:JSON.stringify(body)})).status); return codes})()");
  assert.deepEqual(statuses, [201, 200, 200, 204]);
  await waitUntil(async () => {
    if (await bodyIncludes("Se déconnecter")) return true;
    await evaluate("document.querySelector('[aria-haspopup=menu]')?.click()");
    return false;
  }, "Logout menu is missing");
  await evaluate("Array.from(document.querySelectorAll('button[role=menuitem]')).find((item) => item.textContent.includes('Se déconnecter')).click()");
  await waitUntil(() => evaluate("location.pathname === '/login'"), "Logout did not return to login");
  const afterLogout = await cdp.send("Network.getCookies", { urls: [webOrigin] });
  assert.ok(!afterLogout.cookies.some((item) => item.name === cookieName));

  await navigate("/login?redirect=%2F%2Fother.test");
  await waitUntil(() => evaluate("!!document.querySelector('#identifier')"), "Login did not reappear");
  await delay(500);
  await submit("fixture", "synthetic-password");
  await waitUntil(() => evaluate("location.pathname === '/dash'"), "External return path was not rejected");
  await navigate("/dash");
  await waitUntil(() => bodyIncludes("Compte navigateur"), "Second login failed");
  backendUnavailable = true;
  await navigate("/dash");
  await waitUntil(() => bodyIncludes("temporairement indisponible"), "Missing 503 feedback");
  assert.equal(await evaluate("location.pathname"), "/dash");
  backendUnavailable = false;
  sessions.delete("b".repeat(43));
  await waitUntil(async () => {
    if (await evaluate("location.pathname === '/login'")) return true;
    await evaluate("Array.from(document.querySelectorAll('button')).find((button) => button.textContent === 'Réessayer')?.click()");
    return false;
  }, "Expired session did not return to login");

  const loginAs = async (identifier) => {
    await navigate("/login");
    await waitUntil(() => evaluate("location.pathname === '/login' && !!document.querySelector('#identifier')"), "Login form missing");
    await delay(500);
    await submit(identifier, "synthetic-password");
  };
  const clickLabel = (label, selector = "button") => evaluate("Array.from(document.querySelectorAll(" + JSON.stringify(selector) + "))" +
    ".find((element) => element.textContent.trim() === " + JSON.stringify(label) + ")?.click()");
  await loginAs("local");
  await waitUntil(() => bodyIncludes("Fiche privée north"), "Single local organization did not open");
  assert.equal(await evaluate("location.pathname"), "/espace/N1234567");
  await waitUntil(async () => {
    if (await evaluate("!!document.querySelector('input[name=name]')")) return true;
    await clickLabel("Modifier le profil");
    return false;
  }, "Local edit form did not open");
  localEditStatus = 403;
  await clickLabel("Enregistrer");
  await waitUntil(() => bodyIncludes("Votre compte ne peut pas effectuer cette action"), "Missing 403 feedback");
  localEditStatus = 200;
  await clickLabel("Enregistrer");
  await waitUntil(() => evaluate("!document.querySelector('input[name=name]')"), "Local profile update did not finish");
  await navigate("/dash/organisations");
  await waitUntil(() => bodyIncludes("Accès refusé"), "Local admin entered the global organization page");
  const before = localReads;
  await navigate("/espace/X1234567");
  await waitUntil(() => bodyIncludes("Espace indisponible"), "Unknown organization was shown");
  assert.equal(localReads, before);

  await loginAs("multi");
  await waitUntil(() => bodyIncludes("Mes espaces"), "Multiple organizations did not open the picker");
  assert.equal(await evaluate("location.pathname"), "/espaces");
  assert.ok(await bodyIncludes("Organisation Nord"));
  assert.ok(await bodyIncludes("Organisation Sud"));
  await waitUntil(async () => {
    if (await evaluate("location.pathname === '/espace/S1234567'")) return true;
    await evaluate("document.querySelector('a[href=\"/espace/S1234567\"]')?.click()");
    return false;
  }, "Selection did not navigate to the local space");
  await waitUntil(() => bodyIncludes("Fiche privée south"), "Read-only organization did not render");
  assert.equal(await bodyIncludes("Modifier le profil"), false);
  localReadStatus = 404;
  await navigate("/espace/S1234567");
  await waitUntil(() => bodyIncludes("Cette organisation est introuvable ou inaccessible"), "Missing backend 404 feedback");
  localReadStatus = 503;
  await clickLabel("Réessayer");
  await waitUntil(() => bodyIncludes("Le service des organisations est temporairement indisponible"), "Missing backend 503 feedback");
  localReadStatus = 200;
  await clickLabel("Réessayer");
  await waitUntil(() => bodyIncludes("Fiche privée south"), "Organization retries did not recover");
  const session = sessions.get("m".repeat(43));
  sessions.set("m".repeat(43), { ...session, organizations: [north] });
  await waitUntil(async () => {
    if (await bodyIncludes("Espace indisponible")) return true;
    await evaluate("window.dispatchEvent(new Event('ikbs:capabilities-changed'))");
    return false;
  }, "A suspended membership still exposed its organization");
  assert.equal(await bodyIncludes("Fiche privée south"), false);
  await navigate("/espace/N1234567");
  await waitUntil(() => bodyIncludes("Fiche privée north"), "Suspension affected a different organization");

  await loginAs("empty");
  await waitUntil(() => bodyIncludes("aucun espace IKBS"), "Missing state for no memberships");
  assert.equal(await evaluate("location.pathname"), "/espaces");
  await evaluate("fetch('/api/v1/auth/logout',{method:'POST',headers:{'X-IKBS-Request':'1'}})");
  await navigate("/proposer-organisation");
  await waitUntil(() => bodyIncludes("Recevoir un code par e-mail"), "Request form missing");
  await delay(400);
  await evaluate(`(() => {
    for (const [name,value] of Object.entries({firstName:"Awa",lastName:"Démo",email:"applicant@example.test",
      organizationName:"Organisation demandée",organizationObjective:"Former les adhérents."})) {
      document.querySelector('[name='+name+']').value=value;
    }
    document.querySelector('button[type=submit]').click();
  })()`);
  await waitUntil(() => bodyIncludes("Vérifier et déposer"), "OTP form missing");
  assert.equal(await bodyIncludes("DEM-2026-000001"), false);
  await evaluate("document.querySelector('[name=otp]').value='000000'");
  await clickLabel("Vérifier et déposer");
  await waitUntil(() => bodyIncludes("Code invalide ou expiré"), "Invalid OTP feedback missing");
  await evaluate("document.querySelector('[name=otp]').value='123456'");
  await clickLabel("Vérifier et déposer");
  await waitUntil(() => bodyIncludes("DEM-2026-000001"), "Request reference missing");
  assert.ok(await bodyIncludes("z".repeat(32)));
  await clickLabel("Suivre ma demande", 'a[href="/suivre-demande"]');
  await waitUntil(() => bodyIncludes("Consulter le statut"), "Public tracking form missing");
  const fillTracking = (code) => evaluate(`(() => {
    document.querySelector('[name=reference]').value='DEM-2026-000001';
    document.querySelector('[name=code]').value=${JSON.stringify(code)};
    document.querySelector('button[type=submit]').click();
  })()`);
  await fillTracking("x".repeat(32));
  await waitUntil(() => bodyIncludes("Demande introuvable"), "Wrong tracking code feedback missing");
  await fillTracking("z".repeat(32));
  await waitUntil(() => bodyIncludes("En attente de traitement"), "Public tracking status missing");
  await loginAs("empty");
  await waitUntil(() => evaluate("location.pathname === '/espaces'"), "Applicant login missing");
  await navigate("/rattacher-demande");
  await waitUntil(() => bodyIncludes("Confirmer le rattachement"), "Link form missing");
  await delay(400);
  await evaluate(`(() => {
    document.querySelector('[name=reference]').value='DEM-2026-000001';
    document.querySelector('[name=code]').value='z'.repeat(32);
    document.querySelector('button[type=submit]').click();
  })()`);
  await waitUntil(() => bodyIncludes("La demande est rattachée"), "Linked request feedback missing");
  await navigate("/dash/demandes");
  await waitUntil(() => bodyIncludes("Accès refusé"), "Applicant accessed global review");
  await loginAs("reviewer");
  await waitUntil(() => bodyIncludes("DEM-2026-000001"), "Review-only account did not find pending request");
  assert.equal(await evaluate("location.pathname"), "/dash/demandes");
  await clickLabel("DEM-2026-000001");
  await waitUntil(() => bodyIncludes("Former les adhérents."), "Request details missing");
  await clickLabel("Approuver");
  await clickLabel("Confirmer l’approbation");
  await waitUntil(() => bodyIncludes("L’organisation a été créée."), "Approval feedback missing");
  assert.equal(organizationRequest.status, "APPROVED");
  await navigate("/valider-demande#synthetic-link-token");
  await waitUntil(() => bodyIncludes("Confirmer ma demande"), "Email confirmation page missing");
  await waitUntil(async () => {
    if (await bodyIncludes("DEM-2026-000002")) return true;
    await clickLabel("Confirmer ma demande");
    return false;
  }, "Direct confirmation did not display a receipt");
  assert.equal(await evaluate("location.hash"), "");
  await navigate("/choisir-mot-de-passe#synthetic-password-link");
  await waitUntil(() => evaluate("!document.querySelector('fieldset')?.disabled && !!document.querySelector('[name=confirmPassword]')"), "Password setup form missing");
  await evaluate(`(() => {
    document.querySelector('[name=password]').value='synthetic-new-password';
    document.querySelector('[name=confirmPassword]').value='synthetic-other-password';
    document.querySelector('button[type=submit]').click();
  })()`);
  await waitUntil(() => bodyIncludes("doivent être identiques"), "Password confirmation feedback missing");
  await evaluate(`(() => {
    document.querySelector('[name=confirmPassword]').value='synthetic-new-password';
    document.querySelector('button[type=submit]').click();
  })()`);
  await waitUntil(() => bodyIncludes("Mot de passe enregistré"), "Password reset completion missing");
  assert.equal(await evaluate("location.hash"), "");
  await loginAs("role-admin");
  await waitUntil(() => bodyIncludes("Fiche privée north"), "Role administrator session not loaded");
  await navigate("/espace/N1234567/roles");
  await waitUntil(() => bodyIncludes("Aucun rôle personnalisé"), "Roles did not load");
  const field = (selector) => evaluate("document.querySelector(" + JSON.stringify(selector) + ")?.value");
  const fillRoleField = async (selector, value) => {
    await evaluate("(() => {const el=document.querySelector(" + JSON.stringify(selector) + ");" +
      "Object.getOwnPropertyDescriptor(Object.getPrototypeOf(el),'value').set.call(el," + JSON.stringify(value) +
      "); el.dispatchEvent(new Event('input',{bubbles:true}));})()");
    await waitUntil(async () => await field(selector) === value, "Role text field did not accept input", 5);
  };
  await clickLabel("Créer un rôle");
  const roleName = '[role=dialog] input[name=name]';
  const roleCode = '[role=dialog] input[name=code]';
  const roleDescription = '[role=dialog] textarea[name=description]';
  await waitUntil(() => evaluate("Boolean(document.querySelector(" + JSON.stringify(roleName) + "))"), "Create modal missing");
  await fillRoleField(roleName, "Bureau test");
  await fillRoleField(roleCode, "bureau-test");
  await evaluate("document.querySelector('[role=dialog] input[type=checkbox]').click()");
  await clickLabel("Enregistrer");
  await waitUntil(() => bodyIncludes("Ce code est déjà utilisé"), "Missing duplicate role error");
  assert.equal(await field(roleName), "Bureau test");
  rolePost = "network";
  await clickLabel("Enregistrer");
  await waitUntil(() => bodyIncludes("Le service des rôles est indisponible"), "Missing transport failure feedback");
  assert.equal(await field(roleCode), "bureau-test");
  rolePost = "success";
  roleRefreshFailure = true;
  const readsBefore = roleReads;
  await evaluate("(()=>{const save=document.querySelector('[role=dialog] button[type=submit]');save.click();save.click();})()");
  await waitUntil(async () => roleReads > readsBefore && await bodyIncludes("Actualisation impossible"), "Refresh error not separated from POST success");
  assert.equal(await evaluate("Boolean(document.querySelector('[role=dialog]'))"), false);
  assert.ok(await bodyIncludes("Bureau test"));
  assert.ok(await bodyIncludes("Rôle créé."));
  assert.equal(rolePostCount, 3);
  assert.equal(roles.size, 1);
  roleRefreshFailure = false;
  await clickLabel("Réessayer");
  await waitUntil(async () => !(await bodyIncludes("Actualisation impossible")), "Roles GET retry failed");
  await evaluate("document.querySelector('tbody tr button').click()");
  await waitUntil(async () => await field(roleName) === "Bureau test", "Edit prefill missing");
  assert.equal(await field(roleCode), "bureau-test");
  assert.equal(await evaluate("document.querySelector('[role=dialog] input[name=code]').readOnly"), true);
  await fillRoleField(roleName, "Bureau modifié");
  await fillRoleField(roleDescription, "Description mise à jour");
  await clickLabel("Enregistrer");
  await waitUntil(() => bodyIncludes("ne peut plus être déléguée"), "Missing edit rejection");
  assert.equal(await field(roleName), "Bureau modifié");
  assert.equal(await field(roleDescription), "Description mise à jour");
  rolePatch = "success";
  await clickLabel("Enregistrer");
  await waitUntil(async () => await bodyIncludes("Bureau modifié") &&
    !(await evaluate("Boolean(document.querySelector('[role=dialog]'))")), "Edit did not close the modal");
  assert.equal(rolePatchCount, 2);
  await cdp.send("Page.reload");
  await waitUntil(() => bodyIncludes("Description mise à jour"), "Edit did not survive the reload");
  assert.deepEqual(roles.get("bureau-test").permissions, ["organization.read"]);
  assert.deepEqual(duplicateKeys, []);

  const assignmentBase = "/api/v1/organizations/north";
  await waitUntil(() => bodyIncludes("Sélectionnez une appartenance active"), "Assignment guidance missing");
  await clickLabel("Affecter des rôles", 'a[href="#affectations"]');
  await waitUntil(() => evaluate("location.hash === '#affectations'"), "Assignment shortcut did not navigate");
  assert.ok(await bodyIncludes("1–15 sur 120"));
  await clickLabel("Suivant");
  await waitUntil(() => bodyIncludes("16–30 sur 120"), "Second directory page missing");
  await evaluate("(()=>{const select=document.querySelector('[aria-label=\"Pagination des appartenances\"] select');select.value='50';select.dispatchEvent(new Event('change',{bubbles:true}));})()");
  await waitUntil(() => bodyIncludes("1–50 sur 120"), "Page-size change should reset directory pagination");
  const chooseMembership = (identityId) => evaluate("[...document.querySelectorAll('#affectations button[aria-pressed]')]" +
    ".find(button => button.textContent.includes(" + JSON.stringify(identityId) + "))?.click()");
  await chooseMembership("role-admin");
  await waitUntil(() => bodyIncludes("Vous ne pouvez pas vous attribuer un rôle."), "Self-assignment message missing");
  assert.equal(await evaluate("!!document.querySelector('#affectations section select')"), false);
  await chooseMembership("eligible");
  await waitUntil(() => evaluate("!!document.querySelector('#affectations option[value=bureau-test]')"), "Assignable role missing");
  await evaluate("(()=>{const select=document.querySelector('#affectations section select');select.value='bureau-test';select.dispatchEvent(new Event('change',{bubbles:true}));})()");
  await evaluate("(()=>{const submit=document.querySelector('#affectations section form button[type=submit]');submit.click();submit.click();})()");
  const removeAssignment = '[aria-label="Retirer Bureau modifié"]';
  await waitUntil(() => evaluate("!!document.querySelector(" + JSON.stringify(removeAssignment) + ")"), "Assigned role not displayed");
  assert.equal(assignmentPosts, 1);
  await evaluate("document.querySelector(" + JSON.stringify(removeAssignment) + ").click()");
  await clickLabel("Confirmer le retrait");
  await waitUntil(() => bodyIncludes("Aucun rôle personnalisé attribué."), "Removed role remained visible");
  assert.equal(assignmentDeletes, 1);
  await navigate("/espace/N1234567/membres");
  await waitUntil(() => bodyIncludes("Membre Lié"), "Member list missing");
  await evaluate("document.querySelector('a[href*=" + JSON.stringify("memberId=" + linkedMemberId) + "]').click()");
  await waitUntil(() => evaluate("!!document.querySelector('option[value=bureau-test]')"), "Exact membership lookup from members failed");
  assert.ok(await bodyIncludes("Compte à habiliter"));
  await navigate("/espace/N1234567/roles?memberId=" + unlinkedMemberId);
  await waitUntil(() => bodyIncludes("n’est associé à cette fiche"), "Unlinked member feedback missing");
  assert.equal(await evaluate("!!document.querySelector('option[value=bureau-test]')"), false);
  await navigate("/espace/N1234567/roles");
  await waitUntil(() => bodyIncludes("Compte à habiliter"), "Directory unavailable after returning");
  await chooseMembership("eligible");
  await waitUntil(() => bodyIncludes("Actualiser les affectations"), "Assignment panel unavailable");
  assert.equal(await evaluate("fetch('/api/v1/organizations/south/memberships').then(r=>r.status)"), 404);
  assert.equal(await evaluate("fetch(" + JSON.stringify(assignmentBase + "/memberships/inactive/roles") + ").then(r=>r.status)"), 404);
  canAssignInApi = false;
  await clickLabel("Actualiser les affectations");
  await waitUntil(() => bodyIncludes("Votre compte ne peut pas effectuer cette opération."), "Assignment 403 missing");
  canAssignInApi = true;
  const activeRoleSession = sessions.get("r".repeat(43));
  sessions.set("r".repeat(43), { ...activeRoleSession, organizations: activeRoleSession.organizations.map((organization) =>
    ({ ...organization, permissions: organization.permissions.filter((permission) => permission !== "roles.assign") })) });
  await evaluate("window.dispatchEvent(new Event('ikbs:capabilities-changed'))");
  await waitUntil(() => evaluate("!document.querySelector('#affectations') && !document.querySelector('a[href=\"#affectations\"]')"), "Revoked assignment permission remained visible");
  const readsAfterRevocation = directoryReads;
  await navigate("/espace/N1234567/roles");
  await waitUntil(() => bodyIncludes("Bureau modifié"), "Role definitions unavailable after assignment revocation");
  assert.equal(directoryReads, readsAfterRevocation);
  assert.deepEqual(duplicateKeys, []);

  await navigate("/espace/N1234567/commissions");
  await waitUntil(() => bodyIncludes("Aucune commission"), "Commission empty state missing");
  await clickLabel("Nouvelle commission");
  const commissionName = '[role=dialog] input[name=name]';
  const commissionDescription = '[role=dialog] textarea[name=description]';
  await waitUntil(async () => (await field(commissionName)) === "", "Commission form not displayed");
  assert.equal(await evaluate("!!document.querySelector('[role=dialog] input[name=code]')"), false);
  await fillRoleField(commissionName, "   ");
  await clickLabel("Enregistrer");
  await waitUntil(() => bodyIncludes("Le nom doit contenir"), "Missing validation for blank commission name");
  assert.equal(commissionPosts, 0);
  await fillRoleField(commissionName, "Commission locale");
  await clickLabel("Enregistrer");
  await waitUntil(() => bodyIncludes("Vérifiez les champs"), "Missing failed POST feedback");
  assert.equal(await field(commissionName), "Commission locale");
  commissionPostRefused = false;
  commissionRefreshFailure = true;
  await evaluate("(()=>{const save=document.querySelector('[role=dialog] button[type=submit]');save.click();save.click();})()");
  await waitUntil(() => bodyIncludes("Actualisation impossible"), "Missing commission refresh error");
  assert.ok(await bodyIncludes("COM-000001"));
  assert.equal(await evaluate("!!document.querySelector('[role=dialog]')"), false);
  assert.equal(commissionPosts, 2);
  assert.deepEqual(commissionWrites.at(-1).input, { name: "Commission locale", description: null });
  commissionRefreshFailure = false;
  await clickLabel("Réessayer");
  await waitUntil(async () => !(await bodyIncludes("Actualisation impossible")), "Commission retry failed");
  await evaluate("document.querySelector('button[aria-label=\"Modifier la commission\"]').click()");
  await waitUntil(async () => await field(commissionName) === "Commission locale", "Edit prefill missing");
  await fillRoleField(commissionName, "Commission modifiée");
  await fillRoleField(commissionDescription, "Description persistée");
  commissions.get("commission").version = 2;
  await clickLabel("Enregistrer");
  await waitUntil(() => bodyIncludes("Votre brouillon est conservé"), "Missing commission conflict state");
  assert.deepEqual(commissionWrites.at(-1).input, { name: "Commission modifiée", description: "Description persistée", version: 1 });
  assert.equal(await field(commissionName), "Commission modifiée");
  const beforeConflict = commissionWrites.length;
  await clickLabel("Relire la commission");
  await waitUntil(() => bodyIncludes("Version 2 sur le serveur"), "Missing comparison after reread");
  assert.equal(commissionWrites.length, beforeConflict);
  await clickLabel("Adopter cette version de référence");
  await clickLabel("Enregistrer");
  await waitUntil(async () => await bodyIncludes("Commission modifiée") && !await evaluate("!!document.querySelector('[role=dialog]')"), "Commission edit failed");
  assert.equal(commissionWrites.at(-1).input.version, 2);
  await cdp.send("Page.reload");
  await waitUntil(() => bodyIncludes("Description persistée"), "Commission description did not persist");
  const searchCommission = async (value) => {
    await fillRoleField('input[type=search]', value);
    await clickLabel("Rechercher");
  };
  await searchCommission("Page");
  await waitUntil(() => bodyIncludes("Page 1 / 2"), "Server totalPages ignored");
  await clickLabel("Suivant");
  await waitUntil(() => commissionReads.some(({ page, search }) => page === "2" && search === "Page"), "Server page 2 not requested");
  await searchCommission("Retard");
  await waitUntil(() => commissionReads.some(({ search }) => search === "Retard"), "Delayed query not requested");
  await searchCommission("Commission");
  await waitUntil(() => bodyIncludes("Description persistée"), "Search did not load matching commission");
  await delay(1000);
  assert.ok(await bodyIncludes("Description persistée"), "Outdated reply replaced current search");
  const toggleStatus = async (value) => evaluate("(()=>{const el=[...document.querySelectorAll('select')].find(s=>[...s.options].some(o=>o.value==='ARCHIVED'));el.value="+JSON.stringify(value)+";el.dispatchEvent(new Event('change',{bubbles:true}));})()");
  const clickArchive = () => evaluate("document.querySelector('button[aria-label=\"Archiver la commission\"]').click()");
  await clickArchive();
  await waitUntil(() => bodyIncludes("ne pourra plus être modifiée ni réactivée"), "Missing archive confirmation");
  const beforeArchive = commissionWrites.length;
  await clickLabel("Annuler");
  assert.equal(commissionWrites.length, beforeArchive);
  await clickArchive();
  await waitUntil(() => bodyIncludes("Confirmer l’archivage"), "Archive confirmation missing");
  commissions.get("commission").version = 4;
  await clickLabel("Confirmer l’archivage");
  await waitUntil(() => bodyIncludes("Relire le registre"), "Archive version conflict not shown");
  assert.equal(commissionWrites.length, beforeArchive + 1);
  await clickLabel("Relire le registre");
  await waitUntil(async () => !(await bodyIncludes("Relire le registre")), "Archive reread failed");
  await waitUntil(async () => {
    await clickArchive();
    return bodyIncludes("Confirmer l’archivage");
  }, "Archive could not be retried after an explicit refresh");
  await clickLabel("Confirmer l’archivage");
  await waitUntil(() => bodyIncludes("Commission archivée."), "Missing archive notification");
  assert.deepEqual(commissionWrites.at(-1).input, { status: "ARCHIVED", version: 4 });
  await toggleStatus("ARCHIVED");
  await waitUntil(() => commissionReads.some(({ status, page }) => status === "ARCHIVED" && page === "1"), "Archive filter not sent");
  await waitUntil(() => bodyIncludes("Description persistée"), "Archived commission missing");
  assert.equal(await evaluate("!!document.querySelector('button[aria-label=\"Modifier la commission\"]')"), false);
  assert.equal(await bodyIncludes("Réactiver"), false);
  await evaluate("document.querySelector('button[aria-label=\"Consulter la commission\"]').click()");
  await waitUntil(() => bodyIncludes("Archivage (UTC)"), "Archived detail missing");

  await loginAs("commission-reader");
  await waitUntil(() => bodyIncludes("Mes espaces"), "Commission reader workspace picker missing");
  await navigate("/espace/N1234567/commissions");
  await waitUntil(() => bodyIncludes("Description persistée"), "Reader could not view archived commission");
  assert.ok(await evaluate("!!document.querySelector('nav a[href=\"/espace/N1234567/commissions\"]')"));
  assert.equal(await bodyIncludes("Nouvelle commission"), false);
  assert.equal(await evaluate("!!document.querySelector('button[aria-label=\"Archiver la commission\"]')"), false);
  const readsBeforeSouth = commissionReads.length;
  await navigate("/espace/S1234567/commissions");
  await waitUntil(() => bodyIncludes("Espace indisponible"), "Unprivileged organization route not blocked");
  assert.equal(await bodyIncludes("Description persistée"), false);
  assert.equal(await evaluate("!!document.querySelector('nav a[href=\"/espace/S1234567/commissions\"]')"), false);
  assert.equal(commissionReads.length, readsBeforeSouth);
  assert.deepEqual(duplicateKeys, []);

});
