# Smart Daily Planner Runbook

## Scope

This runbook captures the minimum operational procedures for the Smart Daily Planner MVP.

## Roll back a bad backend deploy

1. Open the Render service dashboard.
2. Locate the most recent healthy deploy.
3. Trigger a rollback to that deploy.
4. Verify `GET /health` returns a successful database check.

## Restore the database

1. Restore the latest AWS RDS snapshot to a fresh instance.
2. Update the database secret in AWS Secrets Manager.
3. Redeploy the backend so it reloads the connection details.
4. Verify login and task listing on the dashboard.

## Rotate JWT secret

1. Generate a new high-entropy JWT secret.
2. Update the secret in AWS Secrets Manager or the backend environment.
3. Redeploy the backend.
4. Expect existing sessions to expire within 24 hours.

## Tune CI vulnerability gate

The CI workflow uses Trivy and can be tuned with GitHub repository variables:

- `TRIVY_MAX_HIGH_CRITICAL_TOTAL`: maximum allowed HIGH/CRITICAL library vulnerabilities before CI fails (default: `15`).
- `TRIVY_FAIL_ON_FIXABLE_ONLY`: when `true`, only vulnerabilities with a known fix version count toward the blocking threshold (default: `true`).
- `TRIVY_BLOCK_ON_INFRA_FAILURE`: when `true`, CI fails if Trivy infrastructure fails after retries (default: `false`).

Generated Trivy artifacts:

- `/tmp/trivy-lib.json`
- `/tmp/trivy-lib-summary.json`
- `/tmp/trivy-os-report.txt`
