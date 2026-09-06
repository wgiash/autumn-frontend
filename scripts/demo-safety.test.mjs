import assert from "node:assert/strict";
import { test } from "node:test";
import { assertDemoReset } from "./demo-safety.ts";

const env = {
  DATABASE_URL: "postgresql://postgres:test@db.demo-ref.supabase.co:5432/postgres",
  AUTUMN_DEMO_PROJECT_REF: "demo-ref",
  NODE_ENV: "development",
};
const confirmed = ["--confirm-demo-reset"];

test("demo reset requires confirmation and an explicitly designated project", () => {
  assert.throws(() => assertDemoReset(env, []), /refused/);
  assert.throws(() => assertDemoReset({ ...env, AUTUMN_DEMO_PROJECT_REF: "" }, confirmed), /refused/);
  assert.doesNotThrow(() => assertDemoReset(env, confirmed));
});

test("demo reset refuses production and a different database project", () => {
  assert.throws(() => assertDemoReset({ ...env, NODE_ENV: "production" }, confirmed), /forbidden/);
  assert.throws(() => assertDemoReset({ ...env, AUTUMN_DEMO_PROJECT_REF: "production-ref" }, confirmed), /does not match/);
});

test("pooler confirmation checks project identity, not just the shared host", () => {
  const url = "postgresql://postgres.demo-ref:test@aws-0-us-east-1.pooler.supabase.com:6543/postgres";
  assert.doesNotThrow(() => assertDemoReset({ ...env, DATABASE_URL: url }, confirmed));
  assert.throws(() => assertDemoReset({ ...env, DATABASE_URL: url.replace("postgres.demo-ref", "postgres.production-ref") }, confirmed), /does not match/);
  assert.throws(() => assertDemoReset({ ...env, DATABASE_URL: url.replace("pooler.supabase.com", "example.com") }, confirmed), /does not match/);
});
