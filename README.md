# otel-websocket-proxy

Combination of an Otel Exporter and Otel Proxy Server using `WebSocket`.
Ideally the WebSocket functionality becomes part of the official Otel JavaScript SDK.

![](https://share.cleanshot.com/kKYwYQBV/download)

## Usage

### Run proxy

```sh
OTEL_WEBSOCKET_PROXY_PORT=44318 npx otel-websocket-proxy
```

### Tracing (browser-only)

```ts
import { WebsocketTraceExporter } from 'otel-websocket-exporter'

import { SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base'
import { WebTracerProvider } from '@opentelemetry/sdk-trace-web'
import { Resource } from '@opentelemetry/resources'
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions'

const provider = new WebTracerProvider({
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: 'otel-websocket-example-basic-vite',
  }),
})

const websocketExporterUrlTracing = 'ws://localhost:44318/v1/traces'
provider.addSpanProcessor(new SimpleSpanProcessor(new WebsocketTraceExporter({ url: websocketExporterUrlTracing })))
```

### Metrics (browser-only)

```ts
import { WebsocketMetricExporter } from 'otel-websocket-exporter'

import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http'
import { DiagConsoleLogger, DiagLogLevel, diag, metrics } from '@opentelemetry/api'
import { MeterProvider, PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics'

const meterProvider = new MeterProvider()

const websocketExporterUrlMetrics = 'ws://localhost:44318/v1/metrics'

meterProvider.addMetricReader(
  new PeriodicExportingMetricReader({
    exporter: new WebsocketMetricExporter({ url: websocketExporterUrlMetrics }),
    exportIntervalMillis: 1000,
  }),
)
```

## Context / Motivation

This package was originally created to avoid jamming the Devtools network inspector. Particularly in applications with web workers.

![](https://share.cleanshot.com/QmBFYDtM/download)
