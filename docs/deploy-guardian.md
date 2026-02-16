# Deploy Guardian Runbook

## Purpose
`Deploy Guardian` tracks failed **production** deployments for `oscarmb-com`, diagnoses root causes from Vercel logs, and handles remediation/escalation through GitHub issues and PRs.

## Commands
- `pnpm deploy:scan`
- `pnpm deploy:guardian`
- `pnpm test:deploy-agent`

## Files
- `scripts/deploy-agent/parse-root-cause.ts`
- `scripts/deploy-agent/scan-failures.ts`
- `scripts/deploy-agent/guardian.ts`
- `scripts/deploy-agent/parse-root-cause.test.ts`
- `scripts/deploy-agent/scan-failures.test.ts`

## `deploy:scan` Output Contract
`pnpm deploy:scan` prints JSON with this shape:

```json
{
  "project": "oscarmb-com",
  "environment": "production",
  "generatedAt": "ISO-8601",
  "failures": [
    {
      "deploymentId": "dpl_xxx",
      "url": "https://...vercel.app",
      "createdAt": "ISO-8601",
      "rootCauseType": "vulnerable_dependency|compile_or_type_error|missing_env|unknown",
      "summary": "single-line summary",
      "packageName": "optional",
      "currentVersion": "optional",
      "requiredVersion": "optional",
      "lastErrorLine": "raw Error: ... line"
    }
  ]
}
```

## Root Cause Classifiers
`parse-root-cause.ts` classifies logs into:
- `vulnerable_dependency`
- `compile_or_type_error`
- `missing_env`
- `unknown`

## Guardian Workflow
`pnpm deploy:guardian` performs:

1. Validate clean git worktree.
2. Scan failed production deployments from Vercel.
3. For each failure:
4. Search for an open incident issue containing `deploymentId`.
5. Create issue if none exists.
6. Enforce one-attempt policy:
7. If issue already existed, skip remediation and comment why.
8. If issue is new:
9. `vulnerable_dependency`:
10. Create `codex/deploy-fix-*` branch.
11. Update only implicated dependency to `^requiredVersion`.
12. Run `pnpm lint` and `pnpm build`.
13. On success: commit, push, create PR, comment links on issue.
14. On failure: comment escalation details with command tails.
15. `compile_or_type_error`:
16. Create `codex/deploy-fix-*` branch.
17. Attempt minimal automated fix path via `pnpm lint -- --fix`.
18. Run `pnpm lint` and `pnpm build`, then PR-or-escalate as above.
19. `missing_env` / `unknown`:
20. No code edits. Add escalation comment with failing line and manual next steps.
21. After processing, close resolved incidents only when:
22. A newer production `Ready` deployment exists after incident creation.
23. No newer production `Error` deployment exists after incident creation.

## Issue and PR Conventions
- Incident issue title prefix: `[Deploy Incident]`.
- Incident issue body includes deployment id/url, root cause, and last error line.
- PR body includes incident link, deployment id, root cause, and validation commands.
- PR branches use `codex/` prefix.

## Scope and Non-Goals (v1)
- Scope: production deployment failures only.
- No Sentry post-deploy runtime checks in v1.
- No auto-merge in v1.

## Operational Prerequisites
- Authenticated `vercel` CLI.
- Authenticated `gh` CLI with repo write permissions.
- Repository has `main` branch.

## Scheduling
Recommended Codex automation schedule:
- Weekdays at 9:00 AM CST (UTC-06:00).
