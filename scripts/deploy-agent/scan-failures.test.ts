import assert from "node:assert/strict";
import test from "node:test";
import {
  type CommandRunner,
  scanFailedDeployments,
} from "./scan-failures";

interface MockResult {
  exitCode: number;
  stdout: string;
  stderr: string;
}

function createMockRunner(results: Record<string, MockResult>): CommandRunner {
  return (command, args) => {
    const key = [command, ...args].join(" ");
    const value = results[key];

    if (!value) {
      throw new Error(`Unexpected command call: ${key}`);
    }

    return value;
  };
}

test("scanFailedDeployments returns contract-compliant report for mocked Vercel data", () => {
  const deploymentA =
    "https://oscarmb-fceud3zqj-oscarmejiawebgmailcoms-projects.vercel.app";
  const deploymentB =
    "https://oscarmb-owckww139-oscarmejiawebgmailcoms-projects.vercel.app";

  const mockRunner = createMockRunner({
    "vercel list oscarmb-com --status ERROR --environment production --yes": {
      exitCode: 0,
      stdout: `${deploymentA}\n${deploymentB}\n`,
      stderr: "",
    },
    [`vercel inspect ${deploymentA} --json`]: {
      exitCode: 1,
      stdout: `Vercel CLI 50.4.9\n{"id":"dpl_AAA111","createdAt":1771209090142}`,
      stderr: "",
    },
    [`vercel inspect ${deploymentA} --logs`]: {
      exitCode: 1,
      stdout:
        "Error: Vulnerable version of next-mdx-remote detected (5.0.0). Please update to version 6.0.0 or later.",
      stderr: "",
    },
    [`vercel inspect ${deploymentB} --json`]: {
      exitCode: 1,
      stdout: `Vercel CLI 50.4.9\n{"id":"dpl_BBB222","createdAt":1771189876268}`,
      stderr: "",
    },
    [`vercel inspect ${deploymentB} --logs`]: {
      exitCode: 1,
      stdout:
        "Failed to compile.\nType error: Property 'href' does not exist on type 'Project'.",
      stderr: "",
    },
  });

  const report = scanFailedDeployments({ runCommand: mockRunner });

  assert.equal(report.project, "oscarmb-com");
  assert.equal(report.environment, "production");
  assert.ok(Array.isArray(report.failures));
  assert.equal(report.failures.length, 2);

  const firstFailure = report.failures[0];
  assert.equal(firstFailure.deploymentId, "dpl_AAA111");
  assert.equal(firstFailure.rootCauseType, "vulnerable_dependency");
  assert.equal(firstFailure.packageName, "next-mdx-remote");
  assert.equal(firstFailure.currentVersion, "5.0.0");
  assert.equal(firstFailure.requiredVersion, "6.0.0");

  const secondFailure = report.failures[1];
  assert.equal(secondFailure.deploymentId, "dpl_BBB222");
  assert.equal(secondFailure.rootCauseType, "compile_or_type_error");
});

test("scanFailedDeployments returns empty failures when Vercel has no errors", () => {
  const mockRunner = createMockRunner({
    "vercel list oscarmb-com --status ERROR --environment production --yes": {
      exitCode: 0,
      stdout: "No deployments found.",
      stderr: "",
    },
  });

  const report = scanFailedDeployments({ runCommand: mockRunner });
  assert.deepEqual(report.failures, []);
});
