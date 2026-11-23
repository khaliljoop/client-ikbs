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
  timeout: 200_000,
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
      permissions: [...north.permissions, "roles.manage", "roles.assign"] }], displayName: "Role admin" }],
    ["empty", { token: "e", globalPermissions: [], organizations: [], displayName: "Compte sans espace" }],
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
    if (!sessions.has(token)) return failure(401, "SESSION_EXPIRED");
    const roleBase = "/api/v1/organizations/north";
    if (path === roleBase + "/role-permissions") return send(200, { permissions: ["organization.read", "members.write"] });
    if (path === roleBase + "/memberships") return send(200, { items: [], total: 0, page: 1, limit: 15 });
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

});
