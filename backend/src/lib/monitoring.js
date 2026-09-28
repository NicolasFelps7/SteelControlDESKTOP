const startedAt = Date.now();
const metrics = {
  requests: 0,
  responses2xx: 0,
  responses4xx: 0,
  responses5xx: 0,
  rateLimited: 0,
  totalDurationMs: 0
};

export function requestMonitoring(req, res, next) {
  const start = process.hrtime.bigint();
  metrics.requests += 1;
  res.once("finish", () => {
    const elapsed = Number(process.hrtime.bigint() - start) / 1_000_000;
    metrics.totalDurationMs += elapsed;
    if (res.statusCode >= 500) metrics.responses5xx += 1;
    else if (res.statusCode >= 400) metrics.responses4xx += 1;
    else if (res.statusCode >= 200) metrics.responses2xx += 1;
  });
  next();
}

export function markRateLimited() {
  metrics.rateLimited += 1;
}

export function securityEvent(type, details = {}) {
  console.warn(JSON.stringify({
    timestamp: new Date().toISOString(),
    category: "security",
    type,
    ...details
  }));
}

export function prometheusMetrics() {
  const average = metrics.requests ? metrics.totalDurationMs / metrics.requests : 0;
  return [
    "# TYPE steelcontrol_uptime_seconds gauge",
    `steelcontrol_uptime_seconds ${Math.floor((Date.now() - startedAt) / 1000)}`,
    "# TYPE steelcontrol_http_requests_total counter",
    `steelcontrol_http_requests_total ${metrics.requests}`,
    `steelcontrol_http_responses_total{class="2xx"} ${metrics.responses2xx}`,
    `steelcontrol_http_responses_total{class="4xx"} ${metrics.responses4xx}`,
    `steelcontrol_http_responses_total{class="5xx"} ${metrics.responses5xx}`,
    `steelcontrol_rate_limited_total ${metrics.rateLimited}`,
    `steelcontrol_http_duration_average_ms ${average.toFixed(3)}`,
    ""
  ].join("\n");
}
