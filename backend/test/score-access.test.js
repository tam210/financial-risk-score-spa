"use strict";

const { after, before, describe, test } = require("node:test");
const assert = require("node:assert/strict");
const { once } = require("node:events");
const { promisify } = require("node:util");
const jwt = require("jsonwebtoken");

process.env.FRONTEND_ORIGIN = "http://localhost:5173";
process.env.JWT_SECRET = "local-test-jwt-secret-at-least-32b";

const { app } = require("../dist/app");

const jwtSecret = process.env.JWT_SECRET;

/** @type {import("node:http").Server} */
let server;
/** @type {string} */
let baseUrl;

async function postLogin(body) {
  const response = await fetch(`${baseUrl}/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Connection: "close",
    },
    body: JSON.stringify(body),
  });
  return response.json();
}

async function getScore(rut, token) {
  const headers = { Connection: "close" };

  if (token !== undefined) {
    headers.Authorization = `Bearer ${token}`;
  }

  return fetch(`${baseUrl}/score/${encodeURIComponent(rut)}`, { headers });
}

async function getScoreWithAuthorization(rut, authorization) {
  return fetch(`${baseUrl}/score/${encodeURIComponent(rut)}`, {
    headers: {
      Authorization: authorization,
      Connection: "close",
    },
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

describe("GET /score/:rut", () => {
  test("returns 401 without Authorization", async () => {
    const response = await getScore("12345678-5");
    const body = await response.json();

    assert.equal(response.status, 401);
    assert.deepEqual(body, { error: "Unauthorized" });
  });

  test("returns 401 for an invalid Bearer token", async () => {
    const response = await getScore("12345678-5", "not-a-jwt");
    const body = await response.json();

    assert.equal(response.status, 401);
    assert.deepEqual(body, { error: "Unauthorized" });
  });

  test("returns 401 for a signed token without exp", async () => {
    const token = jwt.sign(
      { sub: "admin-1", role: "admin" },
      jwtSecret,
      { algorithm: "HS256" },
    );
    const response = await getScore("99999999-9", token);
    const body = await response.json();

    assert.equal(response.status, 401);
    assert.deepEqual(body, { error: "Unauthorized" });
  });

  test("returns 401 for a signed admin token without sub", async () => {
    const token = jwt.sign({ role: "admin" }, jwtSecret, {
      algorithm: "HS256",
      expiresIn: 900,
    });
    const response = await getScore("99999999-9", token);
    const body = await response.json();

    assert.equal(response.status, 401);
    assert.deepEqual(body, { error: "Unauthorized" });
  });

  test("returns 401 for a signed admin token with blank sub", async () => {
    const token = jwt.sign({ sub: "   ", role: "admin" }, jwtSecret, {
      algorithm: "HS256",
      expiresIn: 900,
    });
    const response = await getScore("99999999-9", token);
    const body = await response.json();

    assert.equal(response.status, 401);
    assert.deepEqual(body, { error: "Unauthorized" });
  });

  test("accepts a lowercase bearer scheme with a valid token", async () => {
    const { token } = await postLogin({
      username: "user",
      password: "userpass",
    });
    const response = await getScoreWithAuthorization(
      "12345678-5",
      `bearer ${token}`,
    );
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.rut, "12.345.678-5");
  });

  test("returns 401 for a non-Bearer scheme", async () => {
    const { token } = await postLogin({
      username: "admin",
      password: "adminpass",
    });
    const response = await getScoreWithAuthorization(
      "99999999-9",
      `Basic ${token}`,
    );
    const body = await response.json();

    assert.equal(response.status, 401);
    assert.deepEqual(body, { error: "Unauthorized" });
  });

  test("returns 401 for an empty Bearer token", async () => {
    const response = await getScoreWithAuthorization("12345678-5", "Bearer ");
    const body = await response.json();

    assert.equal(response.status, 401);
    assert.deepEqual(body, { error: "Unauthorized" });
  });

  test("returns 401 for an expired JWT", async () => {
    const token = jwt.sign(
      { sub: "admin-1", role: "admin" },
      jwtSecret,
      {
        algorithm: "HS256",
        expiresIn: -10,
      },
    );
    const response = await getScore("99999999-9", token);
    const body = await response.json();

    assert.equal(response.status, 401);
    assert.deepEqual(body, { error: "Unauthorized" });
  });

  test("returns 401 for a user token without rut", async () => {
    const token = jwt.sign(
      { sub: "user-1", role: "user" },
      jwtSecret,
      {
        algorithm: "HS256",
        expiresIn: 900,
      },
    );
    const response = await getScore("12345678-5", token);
    const body = await response.json();

    assert.equal(response.status, 401);
    assert.deepEqual(body, { error: "Unauthorized" });
  });

  test("allows an admin to query any RUT", async () => {
    const { token } = await postLogin({
      username: "admin",
      password: "adminpass",
    });
    const response = await getScore("99999999-9", token);
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.rut, "99.999.999-9");
    assert.equal(Number.isInteger(body.score), true);
    assert.ok(body.score >= 0 && body.score <= 100);
    assert.equal(Number.isNaN(Date.parse(body.fecha)), false);
  });

  test("allows a user to query their own RUT", async () => {
    const { token } = await postLogin({
      username: "user",
      password: "userpass",
    });
    const response = await getScore("12345678-5", token);
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.rut, "12.345.678-5");
    assert.ok(body.score >= 0 && body.score <= 100);
    assert.equal(Number.isNaN(Date.parse(body.fecha)), false);
  });

  test("allows a user to query an equivalent RUT format", async () => {
    const { token } = await postLogin({
      username: "user",
      password: "userpass",
    });
    const response = await getScore("12.345.678-5", token);
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.rut, "12.345.678-5");
  });

  test("returns 403 when a user queries another RUT", async () => {
    const { token } = await postLogin({
      username: "user",
      password: "userpass",
    });
    const response = await getScore("99999999-9", token);
    const body = await response.json();

    assert.equal(response.status, 403);
    assert.deepEqual(body, { error: "Forbidden" });
  });

  test("keeps the same score and display RUT for equivalent formats", async () => {
    const { token } = await postLogin({
      username: "admin",
      password: "adminpass",
    });
    const first = await (await getScore("12345678-5", token)).json();
    const second = await (await getScore("12.345.678-5", token)).json();
    const third = await (await getScore("123456785", token)).json();

    assert.equal(first.score, second.score);
    assert.equal(second.score, third.score);
    assert.equal(first.rut, "12.345.678-5");
    assert.equal(second.rut, "12.345.678-5");
    assert.equal(third.rut, "12.345.678-5");
  });

  test("returns 400 for an invalid RUT", async () => {
    const { token } = await postLogin({
      username: "admin",
      password: "adminpass",
    });
    const response = await getScore("foo", token);
    const body = await response.json();

    assert.equal(response.status, 400);
    assert.deepEqual(body, { error: "Invalid request" });
  });

  test("returns 400 for a malformed dotted RUT instead of repairing it", async () => {
    const { token } = await postLogin({
      username: "user",
      password: "userpass",
    });
    const response = await getScore("1.2.3.4.5.6.7.8.5", token);
    const body = await response.json();

    assert.equal(response.status, 400);
    assert.deepEqual(body, { error: "Invalid request" });
  });
});
