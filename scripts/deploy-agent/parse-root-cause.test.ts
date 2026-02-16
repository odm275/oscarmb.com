import assert from "node:assert/strict";
import test from "node:test";
import { parseRootCause } from "./parse-root-cause";

test("classifies vulnerable dependency CVE errors", () => {
  const logs = `
2026-02-16T02:33:11.179Z  Error: Vulnerable version of next-mdx-remote detected (5.0.0). Please update to version 6.0.0 or later. Learn More: https://vercel.link/CVE-2026-0969
`;

  const result = parseRootCause(logs);

  assert.equal(result.rootCauseType, "vulnerable_dependency");
  assert.equal(result.packageName, "next-mdx-remote");
  assert.equal(result.currentVersion, "5.0.0");
  assert.equal(result.requiredVersion, "6.0.0");
  assert.match(result.summary, /vulnerable dependency/i);
});

test("classifies compile and type failures", () => {
  const logs = `
Failed to compile.
./src/app/page.tsx:32:8
Type error: Property 'title' does not exist on type '{ name: string }'.
`;

  const result = parseRootCause(logs);

  assert.equal(result.rootCauseType, "compile_or_type_error");
  assert.match(result.summary, /compile\/type build errors/i);
});

test("classifies missing environment variable failures", () => {
  const logs = `
Error: Missing required environment variable: RESEND_API_KEY
`;

  const result = parseRootCause(logs);

  assert.equal(result.rootCauseType, "missing_env");
  assert.match(result.summary, /environment configuration/i);
});

test("falls back to unknown when no classifier matches", () => {
  const logs = `
Error: Something unexpected happened in the deployment runtime.
`;

  const result = parseRootCause(logs);

  assert.equal(result.rootCauseType, "unknown");
  assert.match(result.summary, /unknown root cause/i);
});
