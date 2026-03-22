const BASE_URL = process.env.BENCH_API_URL || 'http://127.0.0.1:4301';
const TOTAL_READ_REQUESTS = Number.parseInt(process.env.BENCH_REQUESTS || '80', 10);
const CONCURRENCY = Number.parseInt(process.env.BENCH_CONCURRENCY || '8', 10);

function nowMs() {
  return Number(process.hrtime.bigint()) / 1_000_000;
}

function percentile(sortedValues, pct) {
  if (!sortedValues.length) {
    return 0;
  }

  const index = Math.min(
    sortedValues.length - 1,
    Math.max(0, Math.floor((pct / 100) * sortedValues.length))
  );
  return sortedValues[index];
}

function summarize(values) {
  if (!values.length) {
    return {
      count: 0,
      avgMs: 0,
      p50Ms: 0,
      p95Ms: 0,
      p99Ms: 0,
      minMs: 0,
      maxMs: 0
    };
  }

  const sorted = [...values].sort((a, b) => a - b);
  const total = values.reduce((sum, value) => sum + value, 0);

  return {
    count: values.length,
    avgMs: total / values.length,
    p50Ms: percentile(sorted, 50),
    p95Ms: percentile(sorted, 95),
    p99Ms: percentile(sorted, 99),
    minMs: sorted[0],
    maxMs: sorted[sorted.length - 1]
  };
}

async function timedFetch(path, options = {}) {
  const startedAt = nowMs();
  const response = await fetch(`${BASE_URL}${path}`, options);
  const endedAt = nowMs();

  return {
    response,
    durationMs: endedAt - startedAt
  };
}

async function createAuthedUser() {
  const randomSuffix = `${Date.now()}-${Math.floor(Math.random() * 100_000)}`;
  const email = `bench-${randomSuffix}@example.com`;
  const password = 'StrongPass123!';

  const registerResult = await timedFetch('/api/auth/register', {
    method: 'POST',
    headers: {
      'content-type': 'application/json'
    },
    body: JSON.stringify({ email, password })
  });

  if (!registerResult.response.ok) {
    const body = await registerResult.response.text();
    throw new Error(`Register failed (${registerResult.response.status}): ${body}`);
  }

  const loginResult = await timedFetch('/api/auth/login', {
    method: 'POST',
    headers: {
      'content-type': 'application/json'
    },
    body: JSON.stringify({ email, password })
  });

  if (!loginResult.response.ok) {
    const body = await loginResult.response.text();
    throw new Error(`Login failed (${loginResult.response.status}): ${body}`);
  }

  const loginBody = await loginResult.response.json();
  return {
    token: loginBody.token,
    timings: {
      registerMs: registerResult.durationMs,
      loginMs: loginResult.durationMs
    }
  };
}

async function seedTasks(token) {
  const createDurations = [];

  for (let index = 0; index < 5; index += 1) {
    const createResult = await timedFetch('/api/tasks', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        title: `Benchmark task ${index + 1}`,
        priority: index % 2 === 0 ? 'high' : 'medium',
        estimatedMinutes: 30
      })
    });

    if (!createResult.response.ok) {
      const body = await createResult.response.text();
      throw new Error(`Create task failed (${createResult.response.status}): ${body}`);
    }

    createDurations.push(createResult.durationMs);
  }

  return summarize(createDurations);
}

async function benchmarkEndpoint({ path, token, requests, concurrency }) {
  const durations = [];
  let cursor = 0;

  async function worker() {
    while (cursor < requests) {
      const current = cursor;
      cursor += 1;

      if (current >= requests) {
        return;
      }

      const result = await timedFetch(path, {
        method: 'GET',
        headers: {
          authorization: `Bearer ${token}`
        }
      });

      if (!result.response.ok) {
        const body = await result.response.text();
        throw new Error(`Request failed for ${path} (${result.response.status}): ${body}`);
      }

      durations.push(result.durationMs);
    }
  }

  const workers = Array.from({ length: concurrency }, () => worker());
  await Promise.all(workers);

  return summarize(durations);
}

async function main() {
  const healthDurations = [];
  for (let index = 0; index < 20; index += 1) {
    const result = await timedFetch('/health');
    if (!result.response.ok) {
      const body = await result.response.text();
      throw new Error(`Health check failed (${result.response.status}): ${body}`);
    }
    healthDurations.push(result.durationMs);
  }

  const { token, timings } = await createAuthedUser();
  const createSummary = await seedTasks(token);

  const listSummary = await benchmarkEndpoint({
    path: '/api/tasks',
    token,
    requests: TOTAL_READ_REQUESTS,
    concurrency: CONCURRENCY
  });

  const suggestionSummary = await benchmarkEndpoint({
    path: '/api/tasks/suggestion',
    token,
    requests: TOTAL_READ_REQUESTS,
    concurrency: CONCURRENCY
  });

  const output = {
    baseUrl: BASE_URL,
    generatedAt: new Date().toISOString(),
    config: {
      totalReadRequests: TOTAL_READ_REQUESTS,
      concurrency: CONCURRENCY
    },
    startupFlow: {
      registerMs: timings.registerMs,
      loginMs: timings.loginMs
    },
    health: summarize(healthDurations),
    createTask: createSummary,
    listTasks: listSummary,
    suggestion: suggestionSummary
  };

  // eslint-disable-next-line no-console
  console.log(JSON.stringify(output, null, 2));
}

await main();
