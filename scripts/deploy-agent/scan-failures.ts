import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import { parseRootCause, type RootCauseType } from "./parse-root-cause";

export interface DeploymentFailure {
  deploymentId: string;
  url: string;
  createdAt: string;
  rootCauseType: RootCauseType;
  summary: string;
  packageName?: string;
  currentVersion?: string;
  requiredVersion?: string;
  lastErrorLine: string;
}

export interface ScanFailuresReport {
  project: string;
  environment: string;
  generatedAt: string;
  failures: DeploymentFailure[];
}

interface CommandResult {
  exitCode: number;
  stdout: string;
  stderr: string;
}

export type CommandRunner = (command: string, args: string[]) => CommandResult;

export interface ScanOptions {
  project?: string;
  environment?: string;
  runCommand?: CommandRunner;
}

interface InspectDeploymentResponse {
  id?: string;
  createdAt?: number | string;
}

const URL_REGEX = /(https:\/\/[a-zA-Z0-9-]+\.vercel\.app)/g;

function defaultRunCommand(command: string, args: string[]): CommandResult {
  const result = spawnSync(command, args, {
    encoding: "utf-8",
    stdio: "pipe",
  });

  return {
    exitCode: result.status ?? 1,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
  };
}

function combinedOutput(result: CommandResult): string {
  return [result.stdout, result.stderr].filter(Boolean).join("\n");
}

function extractDeploymentUrls(text: string): string[] {
  const matches = text.match(URL_REGEX) ?? [];
  return Array.from(new Set(matches));
}

function extractJsonObject(text: string): string {
  const startIndex = text.indexOf("{");
  const endIndex = text.lastIndexOf("}");

  if (startIndex === -1 || endIndex === -1 || endIndex <= startIndex) {
    throw new Error(`Unable to locate JSON object in output: ${text}`);
  }

  return text.slice(startIndex, endIndex + 1);
}

function parseInspectJson(rawOutput: string): InspectDeploymentResponse {
  const jsonChunk = extractJsonObject(rawOutput);
  return JSON.parse(jsonChunk) as InspectDeploymentResponse;
}

function toIsoDate(value: number | string | undefined): string {
  if (typeof value === "number") {
    return new Date(value).toISOString();
  }

  if (typeof value === "string") {
    const parsedNumber = Number(value);
    if (Number.isFinite(parsedNumber)) {
      return new Date(parsedNumber).toISOString();
    }

    const parsedDate = new Date(value);
    if (!Number.isNaN(parsedDate.getTime())) {
      return parsedDate.toISOString();
    }
  }

  return new Date(0).toISOString();
}

export function scanFailedDeployments(options: ScanOptions = {}): ScanFailuresReport {
  const project = options.project ?? "oscarmb-com";
  const environment = options.environment ?? "production";
  const runCommand = options.runCommand ?? defaultRunCommand;

  const listResult = runCommand("vercel", [
    "list",
    project,
    "--status",
    "ERROR",
    "--environment",
    environment,
    "--yes",
  ]);

  if (listResult.exitCode !== 0) {
    throw new Error(`Failed to list deployments: ${combinedOutput(listResult)}`);
  }

  const deployments = extractDeploymentUrls(combinedOutput(listResult));
  const failures: DeploymentFailure[] = [];

  for (const deploymentUrl of deployments) {
    const inspectResult = runCommand("vercel", ["inspect", deploymentUrl, "--json"]);
    const inspectOutput = combinedOutput(inspectResult);
    const inspectData = parseInspectJson(inspectOutput);

    const logsResult = runCommand("vercel", ["inspect", deploymentUrl, "--logs"]);
    const logsOutput = combinedOutput(logsResult);
    const rootCause = parseRootCause(logsOutput);

    failures.push({
      deploymentId: inspectData.id ?? "unknown",
      url: deploymentUrl,
      createdAt: toIsoDate(inspectData.createdAt),
      rootCauseType: rootCause.rootCauseType,
      summary: rootCause.summary,
      packageName: rootCause.packageName,
      currentVersion: rootCause.currentVersion,
      requiredVersion: rootCause.requiredVersion,
      lastErrorLine: rootCause.lastErrorLine,
    });
  }

  failures.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return {
    project,
    environment,
    generatedAt: new Date().toISOString(),
    failures,
  };
}

function main(): void {
  try {
    const report = scanFailedDeployments();
    console.log(JSON.stringify(report, null, 2));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`deploy:scan failed: ${message}`);
    process.exit(1);
  }
}

const isDirectRun =
  Boolean(process.argv[1]) &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectRun) {
  main();
}
