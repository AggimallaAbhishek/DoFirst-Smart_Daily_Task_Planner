#!/usr/bin/env bash
set -euo pipefail

TRIVY_IMAGE=""
TRIVY_LIB_JSON="${TRIVY_LIB_JSON:-/tmp/trivy-lib.json}"
TRIVY_LIB_SUMMARY_JSON="${TRIVY_LIB_SUMMARY_JSON:-/tmp/trivy-lib-summary.json}"
TRIVY_OS_REPORT="${TRIVY_OS_REPORT:-/tmp/trivy-os-report.txt}"
TRIVY_MAX_HIGH_CRITICAL_TOTAL="${TRIVY_MAX_HIGH_CRITICAL_TOTAL:-15}"
TRIVY_FAIL_ON_FIXABLE_ONLY="${TRIVY_FAIL_ON_FIXABLE_ONLY:-true}"
TRIVY_BLOCK_ON_INFRA_FAILURE="${TRIVY_BLOCK_ON_INFRA_FAILURE:-false}"

truthy() {
  case "${1,,}" in
    1|true|yes|on) return 0 ;;
    *) return 1 ;;
  esac
}

pull_trivy_image() {
  for candidate in aquasec/trivy:0.65.0 public.ecr.aws/aquasecurity/trivy:0.65.0; do
    if docker pull "$candidate"; then
      TRIVY_IMAGE="$candidate"
      echo "Using Trivy image: ${TRIVY_IMAGE}"
      return 0
    fi
  done

  return 1
}

run_trivy_library_scan() {
  docker run --rm \
    -v /var/run/docker.sock:/var/run/docker.sock \
    -v "$HOME/.cache/trivy:/root/.cache/" \
    -v /tmp:/tmp \
    -e TRIVY_DB_REPOSITORY=public.ecr.aws/aquasecurity/trivy-db:2 \
    "$TRIVY_IMAGE" image \
    --format json \
    --output "$TRIVY_LIB_JSON" \
    --exit-code 0 \
    --pkg-types library \
    --severity HIGH,CRITICAL \
    --scanners vuln \
    --skip-version-check \
    --timeout 10m \
    --no-progress \
    smart-daily-planner-backend
}

run_trivy_os_scan() {
  docker run --rm \
    -v /var/run/docker.sock:/var/run/docker.sock \
    -v "$HOME/.cache/trivy:/root/.cache/" \
    -v /tmp:/tmp \
    -e TRIVY_DB_REPOSITORY=public.ecr.aws/aquasecurity/trivy-db:2 \
    "$TRIVY_IMAGE" image \
    --format table \
    --exit-code 0 \
    --pkg-types os \
    --severity HIGH,CRITICAL \
    --scanners vuln \
    --skip-version-check \
    --timeout 10m \
    --no-progress \
    smart-daily-planner-backend > "$TRIVY_OS_REPORT"
}

summarize_library_vulnerabilities() {
  TRIVY_FAIL_ON_FIXABLE_ONLY="$TRIVY_FAIL_ON_FIXABLE_ONLY" \
    TRIVY_LIB_JSON="$TRIVY_LIB_JSON" \
    TRIVY_LIB_SUMMARY_JSON="$TRIVY_LIB_SUMMARY_JSON" \
    node <<'NODE'
const fs = require('fs');

const reportPath = process.env.TRIVY_LIB_JSON;
const summaryPath = process.env.TRIVY_LIB_SUMMARY_JSON;
const failOnFixableOnly = String(process.env.TRIVY_FAIL_ON_FIXABLE_ONLY || 'true').toLowerCase() === 'true';
const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));

function normalizeFixedVersion(value) {
  if (!value || typeof value !== 'string') {
    return null;
  }

  const normalized = value.trim().toLowerCase();
  if (!normalized || ['0', 'n/a', 'none', 'not-fixed', 'unfixed'].includes(normalized)) {
    return null;
  }

  return value.trim();
}

const rows = [];
let totalHighCritical = 0;
let blockingCount = 0;

for (const result of report.Results || []) {
  for (const vulnerability of result.Vulnerabilities || []) {
    if (vulnerability.Severity !== 'HIGH' && vulnerability.Severity !== 'CRITICAL') {
      continue;
    }

    totalHighCritical += 1;
    const fixedVersion = normalizeFixedVersion(vulnerability.FixedVersion);
    const isFixable = Boolean(fixedVersion);

    if (!failOnFixableOnly || isFixable) {
      blockingCount += 1;
    }

    rows.push({
      severity: vulnerability.Severity,
      vulnerabilityId: vulnerability.VulnerabilityID,
      packageName: vulnerability.PkgName,
      installedVersion: vulnerability.InstalledVersion || 'unknown',
      fixedVersion: fixedVersion || 'n/a',
      title: (vulnerability.Title || '').replace(/\s+/g, ' ').trim(),
      isFixable
    });
  }
}

rows.sort((a, b) => {
  if (a.severity !== b.severity) {
    return a.severity === 'CRITICAL' ? -1 : 1;
  }

  if (a.isFixable !== b.isFixable) {
    return a.isFixable ? -1 : 1;
  }

  return a.packageName.localeCompare(b.packageName);
});

const preview = rows.slice(0, 25);
if (preview.length) {
  console.log('=== Trivy HIGH/CRITICAL library vulnerabilities (top 25) ===');
  for (const row of preview) {
    console.log(
      `${row.severity} ${row.vulnerabilityId} ${row.packageName} installed=${row.installedVersion} fixed=${row.fixedVersion} fixable=${row.isFixable}`
    );
  }
} else {
  console.log('No HIGH/CRITICAL library vulnerabilities found.');
}

fs.writeFileSync(
  summaryPath,
  JSON.stringify(
    {
      totalHighCritical,
      blockingCount,
      failOnFixableOnly,
      preview
    },
    null,
    2
  )
);
NODE
}

read_summary_field() {
  local field_name="$1"
  SUMMARY_FILE="$TRIVY_LIB_SUMMARY_JSON" FIELD_NAME="$field_name" node -e '
    const fs = require("fs");
    const summary = JSON.parse(fs.readFileSync(process.env.SUMMARY_FILE, "utf8"));
    process.stdout.write(String(summary[process.env.FIELD_NAME] ?? ""));
  '
}

mkdir -p "$HOME/.cache/trivy"
rm -f "$TRIVY_LIB_JSON" "$TRIVY_LIB_SUMMARY_JSON" "$TRIVY_OS_REPORT" || true

if ! pull_trivy_image; then
  echo "Unable to pull a Trivy image from Docker Hub or Public ECR."
  exit 1
fi

for attempt in 1 2 3; do
  echo "Trivy scan attempt ${attempt}/3"

  if run_trivy_library_scan; then
    summarize_library_vulnerabilities
    TOTAL_COUNT="$(read_summary_field totalHighCritical)"
    BLOCKING_COUNT="$(read_summary_field blockingCount)"

    echo "Trivy library vulnerabilities (HIGH+CRITICAL): ${TOTAL_COUNT}"
    echo "Blocking vulnerability count: ${BLOCKING_COUNT}"
    echo "Configured threshold TRIVY_MAX_HIGH_CRITICAL_TOTAL=${TRIVY_MAX_HIGH_CRITICAL_TOTAL}"
    echo "TRIVY_FAIL_ON_FIXABLE_ONLY=${TRIVY_FAIL_ON_FIXABLE_ONLY}"

    if [ "${BLOCKING_COUNT}" -gt "${TRIVY_MAX_HIGH_CRITICAL_TOTAL}" ]; then
      echo "Blocking CI due to excessive HIGH/CRITICAL library vulnerabilities (${BLOCKING_COUNT})."
      echo "Please review ${TRIVY_LIB_JSON} and ${TRIVY_LIB_SUMMARY_JSON}."
      exit 1
    fi

    if [ "${TOTAL_COUNT}" -gt 0 ]; then
      echo "::warning::Found ${TOTAL_COUNT} HIGH/CRITICAL library vulnerabilities (${BLOCKING_COUNT} currently blocking by policy)."
    fi

    run_trivy_os_scan || true
    exit 0
  fi

  rm -f "$TRIVY_LIB_JSON" "$TRIVY_LIB_SUMMARY_JSON" "$TRIVY_OS_REPORT" || true
  rm -rf "$HOME/.cache/trivy/db" || true

  if [ "$attempt" -lt 3 ]; then
    sleep $((attempt * 5))
  fi
done

if truthy "$TRIVY_BLOCK_ON_INFRA_FAILURE"; then
  echo "Trivy scan infrastructure failed after 3 attempts."
  exit 1
fi

echo "::warning::Trivy scan infrastructure failed after 3 attempts. Continuing without blocking this run."
exit 0
