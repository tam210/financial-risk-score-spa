"use strict";

const { describe, test } = require("node:test");
const assert = require("node:assert/strict");

const { normalizeRut } = require("../dist/rut");
const { generateScore } = require("../dist/score");

describe("normalizeRut", () => {
  test("produces a consistent representation for equivalent formats", () => {
    assert.equal(normalizeRut("12.345.678-9"), "12345678-9");
    assert.equal(normalizeRut("12345678-9"), "12345678-9");
    assert.equal(normalizeRut("12.345.678-9"), normalizeRut("12345678-9"));
  });

  test("trims whitespace and uppercases the verifier", () => {
    assert.equal(normalizeRut("  12.345.678-k  "), "12345678-K");
    assert.equal(normalizeRut("12345678-k"), normalizeRut("12345678-K"));
  });

  test("inserts the hyphen when it is missing", () => {
    assert.equal(normalizeRut("123456789"), "12345678-9");
  });

  test("keeps short or empty values compact", () => {
    assert.equal(normalizeRut(""), "");
    assert.equal(normalizeRut("   "), "");
    assert.equal(normalizeRut("9"), "9");
  });
});

describe("generateScore", () => {
  test("returns the same score for the same RUT", () => {
    const first = generateScore("12345678-9");
    const second = generateScore("12345678-9");

    assert.equal(first, second);
  });

  test("returns the same score for equivalent RUT formats", () => {
    assert.equal(generateScore("12.345.678-9"), generateScore("12345678-9"));
  });

  test("always returns an integer between 0 and 100 inclusive", () => {
    const samples = [
      "12.345.678-9",
      "12345678-5",
      "99999999-9",
      "1-9",
      "",
      "  11.111.111-k  ",
    ];

    for (const rut of samples) {
      const score = generateScore(rut);
      assert.equal(Number.isInteger(score), true);
      assert.ok(score >= 0 && score <= 100);
    }
  });

  test("can produce different scores for different RUTs", () => {
    const scores = [
      generateScore("12345678-9"),
      generateScore("12345678-5"),
      generateScore("99999999-9"),
      generateScore("11111111-1"),
    ];

    assert.ok(new Set(scores).size > 1);
  });
});
