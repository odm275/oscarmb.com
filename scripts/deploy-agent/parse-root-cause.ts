export type RootCauseType =
  | "vulnerable_dependency"
  | "compile_or_type_error"
  | "missing_env"
  | "unknown";

export interface RootCauseAnalysis {
  rootCauseType: RootCauseType;
  summary: string;
  packageName?: string;
  currentVersion?: string;
  requiredVersion?: string;
  lastErrorLine: string;
}

const VULNERABLE_DEPENDENCY_REGEX =
  /Vulnerable version of ([@/\w.-]+) detected \(([^)]+)\)\. Please update to version ([^\s]+) or later/i;

const MISSING_ENV_PATTERNS: RegExp[] = [
  /Missing required environment variable(?:s)?:?\s*([A-Z0-9_]+)/i,
  /No value was found for(?: the)? environment variable(?:s)?[:\s]+([A-Z0-9_]+)/i,
  /Environment Variable "([A-Z0-9_]+)"/i,
  /is not defined in environment variables/i,
  /Missing required value for ([A-Z0-9_]+)/i,
];

const COMPILE_OR_TYPE_PATTERNS: RegExp[] = [
  /\berror TS\d{3,4}:/i,
  /Type error:/i,
  /Failed to compile/i,
  /Module not found/i,
  /Cannot find module/i,
  /Syntax error/i,
  /Unexpected token/i,
  /Build failed because/i,
  /Build failed with/i,
];

export function extractLastErrorLine(logOutput: string): string {
  const lines = logOutput
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  for (let i = lines.length - 1; i >= 0; i -= 1) {
    const line = lines[i];
    const errorIndex = line.indexOf("Error:");
    if (errorIndex !== -1) {
      return line.slice(errorIndex).replace(/\s+/g, " ").trim();
    }
  }

  return "";
}

export function parseRootCause(logOutput: string): RootCauseAnalysis {
  const lastErrorLine = extractLastErrorLine(logOutput);

  const vulnerableMatch = logOutput.match(VULNERABLE_DEPENDENCY_REGEX);
  if (vulnerableMatch) {
    const packageName = vulnerableMatch[1];
    const currentVersion = vulnerableMatch[2];
    const requiredVersion = vulnerableMatch[3];

    return {
      rootCauseType: "vulnerable_dependency",
      summary: `Vercel blocked deployment due to vulnerable dependency ${packageName}@${currentVersion}; upgrade to ${requiredVersion} or later.`,
      packageName,
      currentVersion,
      requiredVersion,
      lastErrorLine,
    };
  }

  for (const pattern of MISSING_ENV_PATTERNS) {
    const match = logOutput.match(pattern);
    if (match) {
      const envName = match[1];
      const envDetails = envName ? ` (${envName})` : "";

      return {
        rootCauseType: "missing_env",
        summary: `Deployment failed due to missing environment configuration${envDetails}.`,
        lastErrorLine,
      };
    }
  }

  for (const pattern of COMPILE_OR_TYPE_PATTERNS) {
    if (pattern.test(logOutput)) {
      return {
        rootCauseType: "compile_or_type_error",
        summary: `Deployment failed due to compile/type build errors.${lastErrorLine ? ` ${lastErrorLine}` : ""}`.trim(),
        lastErrorLine,
      };
    }
  }

  return {
    rootCauseType: "unknown",
    summary: `Deployment failed with an unknown root cause.${lastErrorLine ? ` ${lastErrorLine}` : ""}`.trim(),
    lastErrorLine,
  };
}
