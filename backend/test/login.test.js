"use strict";

const { after, before, describe, test } = require("node:test");
const assert = require("node:assert/strict");
const { once } = require("node:events");
const { promisify } = require("node:util");

process.env.FRONTEND_ORIGIN = "http://localhost:5173";
process.env.JWT_SECRET = "local-test-jwt-secret-at-least-32b";

const { app } = require("../dist/app");

/** @type {import("node:http").Server} */
let server;
/** @type {string} */
let baseUrl;

function decodeJwt(token) {
  const [headerPart, payloadPart] = token.split(".");
  assert.ok(headerPart && payloadPart, "token must have header and payload");

  return {
    header: JSON.parse(Buffer.from(headerPart, "base64url").toString("utf8")),
    payload: JSON.parse(Buffer.from(payloadPart, "base64url").toString("utf8")),
  };
}

async function postLogin(body, rawBody) {
  return fetch(`${baseUrl}/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Connection: "close",
    },
    body: rawBody ?? JSON.stringify(body),
  });
}

before(async () => {
  server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  assert.ok(address && typeof address === "object");
  baseUrl = `http://127.0.0.1:${address.port}`;
});

after(async () => {
  if (!server) {
    return;
  }

  server.closeAllConnections();
  await promisify(server.close.bind(server))();
});

describe("POST /login", () => {
  test("returns 200 and a token for a valid admin", async () => {
    const response = await postLogin({
      username: "admin",
      password: "adminpass",
    });
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(typeof body.token, "string");
    assert.ok(body.token.length > 0);
  });

  test("returns 200 and a token for a valid user", async () => {
    const response = await postLogin({
      username: "user",
      password: "userpass",
    });
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(typeof body.token, "string");
    assert.ok(body.token.length > 0);
  });

  test("returns 401 for incorrect credentials", async () => {
    const response = await postLogin({
      username: "admin",
      password: "wrong",
    });
    const body = await response.json();

    assert.equal(response.status, 401);
    assert.deepEqual(body, { error: "Invalid credentials" });
  });

  test("returns 400 for an invalid body", async () => {
    const response = await postLogin({});
    const body = await response.json();

    assert.equal(response.status, 400);
    assert.deepEqual(body, { error: "Invalid request" });
  });

  test("returns 400 JSON without HTML or stack for malformed JSON", async () => {
    const response = await postLogin(undefined, '{"username":');
    const contentType = response.headers.get("content-type") ?? "";
    const text = await response.text();

    assert.equal(response.status, 400);
    assert.match(contentType, /application\/json/);
    assert.deepEqual(JSON.parse(text), { error: "Invalid request" });
    assert.doesNotMatch(text, /<html/i);
    assert.doesNotMatch(text, /SyntaxError/);
    assert.doesNotMatch(text, /node_modules/);
  });
});

describe("JWT issued by POST /login", () => {
  test("uses HS256, 900s expiry, and the expected claims", async () => {
    const adminResponse = await postLogin({
      username: "admin",
      password: "adminpass",
    });
    const userResponse = await postLogin({
      username: "user",
      password: "userpass",
    });
    const adminBody = await adminResponse.json();
    const userBody = await userResponse.json();
    const admin = decodeJwt(adminBody.token);
    const user = decodeJwt(userBody.token);

    assert.equal(admin.header.alg, "HS256");
    assert.equal(user.header.alg, "HS256");
    assert.equal(admin.payload.exp - admin.payload.iat, 900);
    assert.equal(user.payload.exp - user.payload.iat, 900);

    assert.equal(admin.payload.role, "admin");
    assert.equal("rut" in admin.payload, false);

    assert.equal(user.payload.role, "user");
    assert.equal(user.payload.rut, "12345678-5");

    for (const payload of [admin.payload, user.payload]) {
      assert.equal("username" in payload, false);
      assert.equal("password" in payload, false);
      assert.equal("sub" in payload, false);
    }
  });
});
