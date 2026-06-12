/**
 * S3Labs Q&A intent classification tests.
 * Run: node --test api/libs/s3labs/s3labsQaContext.test.js
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { classifyS3labsQaIntent } from "./s3labsQaContext.js";

test("crypto news question is crypto_news", () => {
  assert.equal(
    classifyS3labsQaIntent("beri saya berita crypto yang sedang panas"),
    "crypto_news",
  );
});

test("english hot crypto news is crypto_news", () => {
  assert.equal(classifyS3labsQaIntent("give me hot crypto news"), "crypto_news");
});

test("general crypto concept is crypto_general", () => {
  assert.equal(classifyS3labsQaIntent("apa itu DeFi"), "crypto_general");
});

test("dev question is developer", () => {
  assert.equal(classifyS3labsQaIntent("framework rust terbaik untuk backend"), "developer");
});

test("job question is jobs", () => {
  assert.equal(classifyS3labsQaIntent("ada lowongan remote devops?"), "jobs");
});

test("event question is events", () => {
  assert.equal(classifyS3labsQaIntent("hackathon solana bulan ini"), "events");
});

test("unrelated question is general", () => {
  assert.equal(classifyS3labsQaIntent("resep nasi goreng enak"), "general");
});
