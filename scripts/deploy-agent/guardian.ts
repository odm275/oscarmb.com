import fs from "node:fs";
import { spawnSync } from "node:child_process";
import { scanFailedDeployments, type DeploymentFailure } from "./scan-failures";

interface CommandExecution {
  exitCode: number;
  stdout: string;
  stderr: string;
  output: string;
}

interface RunOptions {
  allowFailure?: boolean;
}

interface IssueSummary {
  number: number;
  url: string;
  title: string;
  createdAt: string;
  body: string;
}

interface DeploymentSnapshot {
  url: string;
  createdAtMs: number;
}

interface ValidationResult {
  lintExitCode: number;
  buildExitCode: number;
  lintOutput: string;
  buildOutput: string;
}

const INCIDENT_PREFIX = "[Deploy Incident]";
const INCIDENT_MARKER = "<!-- deploy-guardian-incident -->";
const MAIN_BRANCH = "main";
const VERCEL_PROJECT = "oscarmb-com";
const VERCEL_ENVIRONMENT = "production";
const URL_REGEX = /(https:\/\/[a-zA-Z0-9-]+\.vercel\.app)/g;
const PR_URL_REGEX = /https:\/\/github\.com\/[^\s]+\/pull\/\d+/;
const ISSUE_URL_REGEX = /https:\/\/github\.com\/[^\s]+\/issues\/\d+/;

function run(command: string, args: string[], options: RunOptions = {}): CommandExecution {
  const result = spawnSync(command, args, {
    encoding: "utf-8",
    stdio: "pipe",
  });

  const execution: CommandExecution = {
    exitCode: result.status ?? 1,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
    output: [result.stdout ?? "", result.stderr ?? ""].filter(Boolean).join("\n"),
  };

  if (!options.allowFailure && execution.exitCode !== 0) {
    throw new Error(
      `Command failed: ${command} ${args.join(" ")}\n${execution.output}`.trim(),
    );
  }

  return execution;
}

function parseJsonOutput<T>(output: string): T {
  return JSON.parse(output) as T;
}

function tailLines(text: string, count = 25): string {
  return text
    .split("\n")
    .filter(Boolean)
    .slice(-count)
    .join("\n");
}

function sanitizeBranchFragment(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9-]+/g, "-");
}

function currentDateTag(): string {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = `${now.getUTCMonth() + 1}`.padStart(2, "0");
  const day = `${now.getUTCDate()}`.padStart(2, "0");
  return `${year}${month}${day}`;
}

function extractUrls(text: string): string[] {
  const matches = text.match(URL_REGEX) ?? [];
  return Array.from(new Set(matches));
}

function extractIssueUrl(text: string): string {
  const match = text.match(ISSUE_URL_REGEX);
  if (!match) {
    throw new Error(`Unable to extract issue URL from output: ${text}`);
  }
  return match[0];
}

function extractPrUrl(text: string): string {
  const match = text.match(PR_URL_REGEX);
  if (!match) {
    throw new Error(`Unable to extract PR URL from output: ${text}`);
  }
  return match[0];
}

function isWorktreeClean(): boolean {
  const result = run("git", ["status", "--porcelain"]);
  return result.stdout.trim().length === 0;
}

function checkoutBranch(branch: string): void {
  run("git", ["checkout", branch]);
}

function createBranch(branch: string): void {
  run("git", ["checkout", "-b", branch]);
}

function createUniqueBranch(baseBranch: string): string {
  let candidate = baseBranch;
  let counter = 1;

  while (true) {
    const exists = run(
      "git",
      ["rev-parse", "--verify", "--quiet", candidate],
      { allowFailure: true },
    );

    if (exists.exitCode !== 0) {
      createBranch(candidate);
      return candidate;
    }

    candidate = `${baseBranch}-${counter}`;
    counter += 1;
  }
}

function hasGitChanges(): boolean {
  const result = run("git", ["status", "--porcelain"]);
  return result.stdout.trim().length > 0;
}

function listOpenIncidentIssue(deploymentId: string): IssueSummary | null {
  const issueListResult = run("gh", [
    "issue",
    "list",
    "--state",
    "open",
    "--search",
    `${deploymentId} in:body`,
    "--json",
    "number,url,title,createdAt,body",
    "--limit",
    "10",
  ]);

  const issues = parseJsonOutput<IssueSummary[]>(issueListResult.stdout);
  const match = issues.find((issue) =>
    issue.title.startsWith(INCIDENT_PREFIX),
  );

  return match ?? null;
}

function createIncidentIssue(failure: DeploymentFailure): IssueSummary {
  const title = `${INCIDENT_PREFIX} ${failure.rootCauseType} ${failure.deploymentId}`;
  const body = [
    INCIDENT_MARKER,
    `Deployment ID: \`${failure.deploymentId}\``,
    `Deployment URL: ${failure.url}`,
    `Environment: \`${VERCEL_ENVIRONMENT}\``,
    `Detected At: ${failure.createdAt}`,
    `Root Cause Type: \`${failure.rootCauseType}\``,
    `Summary: ${failure.summary}`,
    `Last Error Line: \`${failure.lastErrorLine || "n/a"}\``,
  ].join("\n");

  const createResult = run("gh", [
    "issue",
    "create",
    "--title",
    title,
    "--body",
    body,
  ]);

  const issueUrl = extractIssueUrl(createResult.output);
  const viewResult = run("gh", [
    "issue",
    "view",
    issueUrl,
    "--json",
    "number,url,title,createdAt,body",
  ]);

  return parseJsonOutput<IssueSummary>(viewResult.stdout);
}

function commentOnIssue(issueNumber: number, body: string): void {
  run("gh", ["issue", "comment", String(issueNumber), "--body", body]);
}

function closeIssue(issueNumber: number, body: string): void {
  run("gh", ["issue", "close", String(issueNumber), "--comment", body]);
}

function readPackageJson(): {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
} {
  const raw = fs.readFileSync("package.json", "utf-8");
  return JSON.parse(raw) as {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
  };
}

function installDependencyVersion(
  packageName: string,
  requiredVersion: string,
): void {
  const packageJson = readPackageJson();
  const isDevDependency = Boolean(packageJson.devDependencies?.[packageName]);
  const installArgs = isDevDependency
    ? ["add", "-D", `${packageName}@^${requiredVersion}`]
    : ["add", `${packageName}@^${requiredVersion}`];

  run("pnpm", installArgs);
}

function runValidation(): ValidationResult {
  const lintResult = run("pnpm", ["lint"], { allowFailure: true });
  const buildResult = run("pnpm", ["build"], { allowFailure: true });

  return {
    lintExitCode: lintResult.exitCode,
    buildExitCode: buildResult.exitCode,
    lintOutput: lintResult.output,
    buildOutput: buildResult.output,
  };
}

function createRemediationPr(
  branch: string,
  issue: IssueSummary,
  failure: DeploymentFailure,
): string {
  run("git", ["add", "-A"]);
  run("git", ["commit", "-m", `fix(deploy): remediate ${failure.deploymentId}`]);
  run("git", ["push", "-u", "origin", branch]);

  const prBody = [
    `Fixes #${issue.number}`,
    "",
    `- Incident: ${issue.url}`,
    `- Deployment ID: \`${failure.deploymentId}\``,
    `- Root cause: \`${failure.rootCauseType}\``,
    `- Summary: ${failure.summary}`,
    `- Validation: \`pnpm lint\` and \`pnpm build\``,
  ].join("\n");

  const prTitle = `fix: remediate failed deploy ${failure.deploymentId}`;
  const prResult = run("gh", [
    "pr",
    "create",
    "--base",
    MAIN_BRANCH,
    "--head",
    branch,
    "--title",
    prTitle,
    "--body",
    prBody,
  ]);

  return extractPrUrl(prResult.output);
}

function attemptVulnerableDependencyFix(
  issue: IssueSummary,
  failure: DeploymentFailure,
): void {
  if (!failure.packageName || !failure.requiredVersion) {
    commentOnIssue(
      issue.number,
      [
        "Automated remediation skipped.",
        "",
        "Root cause was vulnerable dependency, but package metadata was incomplete.",
        `Last error line: \`${failure.lastErrorLine || "n/a"}\``,
      ].join("\n"),
    );
    return;
  }

  checkoutBranch(MAIN_BRANCH);
  const baseBranch = `codex/deploy-fix-${sanitizeBranchFragment(
    failure.deploymentId.slice(0, 14),
  )}-${currentDateTag()}`;
  const branch = createUniqueBranch(baseBranch);

  installDependencyVersion(failure.packageName, failure.requiredVersion);
  const validation = runValidation();

  if (validation.lintExitCode !== 0 || validation.buildExitCode !== 0) {
    commentOnIssue(
      issue.number,
      [
        "Automated remediation attempt failed validation and is now escalated.",
        "",
        `Lint exit code: ${validation.lintExitCode}`,
        `Build exit code: ${validation.buildExitCode}`,
        "",
        "Lint tail:",
        "```",
        tailLines(validation.lintOutput),
        "```",
        "",
        "Build tail:",
        "```",
        tailLines(validation.buildOutput),
        "```",
      ].join("\n"),
    );
    return;
  }

  if (!hasGitChanges()) {
    commentOnIssue(
      issue.number,
      "Automated remediation found no file changes after applying dependency update. Escalating for manual review.",
    );
    return;
  }

  const prUrl = createRemediationPr(branch, issue, failure);
  commentOnIssue(
    issue.number,
    [
      "Automated remediation PR created.",
      "",
      `PR: ${prUrl}`,
      "Validation passed: `pnpm lint` and `pnpm build`.",
    ].join("\n"),
  );
}

function attemptCompileOrTypeFix(issue: IssueSummary, failure: DeploymentFailure): void {
  checkoutBranch(MAIN_BRANCH);
  const baseBranch = `codex/deploy-fix-${sanitizeBranchFragment(
    failure.deploymentId.slice(0, 14),
  )}-${currentDateTag()}`;
  const branch = createUniqueBranch(baseBranch);

  run("pnpm", ["lint", "--", "--fix"], { allowFailure: true });
  const validation = runValidation();

  if (validation.lintExitCode !== 0 || validation.buildExitCode !== 0) {
    commentOnIssue(
      issue.number,
      [
        "Automated compile/type remediation did not pass validation and is escalated.",
        "",
        `Lint exit code: ${validation.lintExitCode}`,
        `Build exit code: ${validation.buildExitCode}`,
        "",
        "Build tail:",
        "```",
        tailLines(validation.buildOutput),
        "```",
      ].join("\n"),
    );
    return;
  }

  if (!hasGitChanges()) {
    commentOnIssue(
      issue.number,
      "Compile/type remediation path produced no code changes. Escalating for manual patching.",
    );
    return;
  }

  const prUrl = createRemediationPr(branch, issue, failure);
  commentOnIssue(
    issue.number,
    [
      "Automated compile/type remediation PR created.",
      "",
      `PR: ${prUrl}`,
      "Validation passed: `pnpm lint` and `pnpm build`.",
    ].join("\n"),
  );
}

function escalateWithoutCodeChanges(issue: IssueSummary, failure: DeploymentFailure): void {
  commentOnIssue(
    issue.number,
    [
      "Automated remediation skipped by policy for this root cause.",
      "",
      `Root cause type: \`${failure.rootCauseType}\``,
      `Summary: ${failure.summary}`,
      `Last error line: \`${failure.lastErrorLine || "n/a"}\``,
      "",
      "Manual next step: update environment/configuration and trigger a new production deployment.",
    ].join("\n"),
  );
}

function collectDeploymentsByStatus(status: "READY" | "ERROR"): DeploymentSnapshot[] {
  const listResult = run("vercel", [
    "list",
    VERCEL_PROJECT,
    "--status",
    status,
    "--environment",
    VERCEL_ENVIRONMENT,
    "--yes",
  ]);

  const urls = extractUrls(listResult.output);
  const snapshots: DeploymentSnapshot[] = [];

  for (const deploymentUrl of urls) {
    const inspectResult = run(
      "vercel",
      ["inspect", deploymentUrl, "--json"],
      { allowFailure: true },
    );

    const start = inspectResult.output.indexOf("{");
    const end = inspectResult.output.lastIndexOf("}");
    if (start === -1 || end === -1 || end <= start) {
      continue;
    }

    const inspectJson = JSON.parse(
      inspectResult.output.slice(start, end + 1),
    ) as { createdAt?: number };

    if (!inspectJson.createdAt) {
      continue;
    }

    snapshots.push({
      url: deploymentUrl,
      createdAtMs: inspectJson.createdAt,
    });
  }

  return snapshots;
}

function closeResolvedIncidents(): void {
  const readyDeploys = collectDeploymentsByStatus("READY");
  const errorDeploys = collectDeploymentsByStatus("ERROR");

  const issuesResult = run("gh", [
    "issue",
    "list",
    "--state",
    "open",
    "--limit",
    "100",
    "--json",
    "number,url,title,createdAt,body",
  ]);

  const issues = parseJsonOutput<IssueSummary[]>(issuesResult.stdout).filter((issue) =>
    issue.title.startsWith(INCIDENT_PREFIX),
  );

  for (const issue of issues) {
    const incidentTime = new Date(issue.createdAt).getTime();
    const latestReady = readyDeploys
      .filter((deployment) => deployment.createdAtMs > incidentTime)
      .sort((a, b) => b.createdAtMs - a.createdAtMs)[0];

    const hasNewError = errorDeploys.some(
      (deployment) => deployment.createdAtMs > incidentTime,
    );

    if (latestReady && !hasNewError) {
      closeIssue(
        issue.number,
        [
          "Closing incident automatically.",
          "",
          `A newer production deployment is Ready: ${latestReady.url}`,
          "No newer production Error deployments were found after this incident.",
        ].join("\n"),
      );
    }
  }
}

function processFailure(failure: DeploymentFailure): void {
  const existingIssue = listOpenIncidentIssue(failure.deploymentId);
  const issue = existingIssue ?? createIncidentIssue(failure);
  const issueWasNew = !existingIssue;

  if (!issueWasNew) {
    commentOnIssue(
      issue.number,
      [
        "Skipping remediation attempt due to one-attempt policy.",
        "",
        "An incident issue already exists for this deployment ID, so no second automated fix attempt will run.",
      ].join("\n"),
    );
    return;
  }

  if (failure.rootCauseType === "vulnerable_dependency") {
    attemptVulnerableDependencyFix(issue, failure);
    return;
  }

  if (failure.rootCauseType === "compile_or_type_error") {
    attemptCompileOrTypeFix(issue, failure);
    return;
  }

  escalateWithoutCodeChanges(issue, failure);
}

function main(): void {
  if (!isWorktreeClean()) {
    throw new Error(
      "Working tree is not clean. Commit or stash local changes before running deploy guardian.",
    );
  }

  const report = scanFailedDeployments({
    project: VERCEL_PROJECT,
    environment: VERCEL_ENVIRONMENT,
  });

  if (report.failures.length === 0) {
    console.log("No failed production deployments found.");
    closeResolvedIncidents();
    return;
  }

  for (const failure of report.failures) {
    try {
      processFailure(failure);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(
        `Failed to process deployment ${failure.deploymentId}: ${message}`,
      );
    }
  }

  closeResolvedIncidents();
  checkoutBranch(MAIN_BRANCH);
}

try {
  main();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`deploy:guardian failed: ${message}`);
  process.exit(1);
}
