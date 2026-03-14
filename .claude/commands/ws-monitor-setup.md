# Monitor Setup

Setup comprehensive monitoring and observability infrastructure

## Usage
```
/monitor-setup $ARGUMENTS
```

## Overview

Implements the three pillars of observability — metrics, logs, and traces — with Prometheus, Grafana, OpenTelemetry, and alerting pipelines.

---

## Metrics — Prometheus Configuration

```yaml
# prometheus.yml
global:
  scrape_interval: 15s
  external_labels:
    cluster: production
    region: us-east-1

scrape_configs:
  - job_name: 'kubernetes-pods'
    kubernetes_sd_configs:
      - role: pod
    relabel_configs:
      - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_scrape]
        action: keep
        regex: true

  - job_name: 'node-exporter'
    static_configs:
      - targets: ['node-exporter:9100']

  - job_name: 'postgres-exporter'
    static_configs:
      - targets: ['postgres-exporter:9187']
```

---

## Application Metrics — Custom Instrumentation

```javascript
const promClient = require('prom-client');

// HTTP request duration histogram
const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 10]
});

// Request counter
const httpRequestsTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

// Business metric: active users
const activeUsers = new promClient.Gauge({
  name: 'app_active_users',
  help: 'Number of currently active users'
});

// Instrumentation middleware
app.use((req, res, next) => {
  const end = httpRequestDuration.startTimer();
  res.on('finish', () => {
    const labels = {
      method: req.method,
      route: req.route?.path || req.path,
      status_code: res.statusCode
    };
    end(labels);
    httpRequestsTotal.inc(labels);
  });
  next();
});

// Expose metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', promClient.register.contentType);
  res.send(await promClient.register.metrics());
});
```

---

## Distributed Tracing — OpenTelemetry

```javascript
const { NodeSDK } = require('@opentelemetry/sdk-node');
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http');
const { HttpInstrumentation } = require('@opentelemetry/instrumentation-http');
const { PgInstrumentation } = require('@opentelemetry/instrumentation-pg');

const sdk = new NodeSDK({
  traceExporter: new OTLPTraceExporter({
    url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://jaeger:4318/v1/traces',
  }),
  instrumentations: [
    new HttpInstrumentation(),
    new PgInstrumentation(),
  ],
});

sdk.start();
```

---

## Grafana Dashboard — Golden Signals

```json
{
  "title": "Application Overview",
  "panels": [
    {
      "title": "Request Rate",
      "type": "stat",
      "targets": [{
        "expr": "sum(rate(http_requests_total[5m]))"
      }]
    },
    {
      "title": "Error Rate",
      "type": "stat",
      "targets": [{
        "expr": "sum(rate(http_requests_total{status_code=~'5..'}[5m])) / sum(rate(http_requests_total[5m])) * 100"
      }],
      "thresholds": {"steps": [{"color": "green"}, {"value": 1, "color": "yellow"}, {"value": 5, "color": "red"}]}
    },
    {
      "title": "p95 Latency",
      "type": "graph",
      "targets": [{
        "expr": "histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))"
      }]
    }
  ]
}
```

---

## Alerting Rules

```yaml
# alert-rules.yml
groups:
  - name: application
    rules:
      - alert: HighErrorRate
        expr: |
          sum(rate(http_requests_total{status_code=~"5.."}[5m])) /
          sum(rate(http_requests_total[5m])) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected: {{ $value | humanizePercentage }}"

      - alert: SlowResponseTime
        expr: |
          histogram_quantile(0.95,
            sum(rate(http_request_duration_seconds_bucket[5m])) by (le)
          ) > 2
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "p95 latency above 2s: {{ $value }}s"

      - alert: DatabaseConnectionsHigh
        expr: pg_stat_activity_count > 80
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: "High database connection count: {{ $value }}"
```

---

## Alertmanager Routing

```yaml
# alertmanager.yml
route:
  group_by: ['alertname', 'severity']
  group_wait: 30s
  group_interval: 5m
  repeat_interval: 12h
  receiver: 'default'
  routes:
    - match:
        severity: critical
      receiver: pagerduty
    - match:
        severity: warning
      receiver: slack

receivers:
  - name: pagerduty
    pagerduty_configs:
      - routing_key: $PAGERDUTY_KEY

  - name: slack
    slack_configs:
      - api_url: $SLACK_WEBHOOK
        channel: '#alerts'
        title: '{{ .GroupLabels.alertname }}'
        text: '{{ range .Alerts }}{{ .Annotations.summary }}\n{{ end }}'
```

---

## Structured Logging

```javascript
const winston = require('winston');

const logger = winston.createLogger({
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    // Add Fluentd/Loki transport for centralized logging
  ]
});

// Request correlation middleware
app.use((req, res, next) => {
  req.requestId = require('crypto').randomUUID();
  res.setHeader('X-Request-ID', req.requestId);
  req.logger = logger.child({ requestId: req.requestId, path: req.path });
  next();
});
```

---

## SLO Definition

```yaml
# Service Level Objectives
slos:
  - name: api-availability
    target: 99.9
    window: 30d
    indicator:
      ratio:
        good: http_requests_total{status_code!~"5.."}
        total: http_requests_total

  - name: api-latency
    target: 99
    window: 30d
    indicator:
      ratio:
        good: http_request_duration_seconds_bucket{le="1"}
        total: http_request_duration_seconds_count
```

---

## Terraform Deployment

```hcl
module "monitoring_stack" {
  source = "./modules/monitoring"

  prometheus_storage_size = "100Gi"
  prometheus_retention_days = 30
  grafana_admin_password = var.grafana_password
  alertmanager_slack_webhook = var.slack_webhook
  pagerduty_routing_key = var.pagerduty_key
}
```
