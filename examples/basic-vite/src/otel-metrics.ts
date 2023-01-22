import { DiagConsoleLogger, DiagLogLevel, diag, metrics } from '@opentelemetry/api'
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http'
import { WebsocketMetricExporter } from 'otel-websocket-exporter'
import { MeterProvider, PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics'

// Optional and only needed to see the internal diagnostic logging (during development)
diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.DEBUG)

export const doExampleMetrics = async () => {
  const meterProvider = new MeterProvider()

  metrics.setGlobalMeterProvider(meterProvider)

  // const exporterUrlMetrics =
  //   import.meta.env?.VITE_OTEL_EXPORTER_OTLP_METRICS_ENDPOINT ?? 'http://localhost:4318/v1/metrics'

  // meterProvider.addMetricReader(
  //   new PeriodicExportingMetricReader({
  //     exporter: new OTLPMetricExporter({
  //       // empty headers makes sure to use XHR instead of `navigator.sendBeacon`
  //       headers: {},
  //       url: exporterUrlMetrics,
  //     }),
  //     exportIntervalMillis: 1000,
  //   }),
  // )

  const websocketExporterUrlMetrics =
    import.meta.env?.VITE_OTEL_EXPORTER_WEBSOCKET_METRICS_ENDPOINT ?? 'ws://localhost:44318/v1/metrics'

  meterProvider.addMetricReader(
    new PeriodicExportingMetricReader({
      exporter: new WebsocketMetricExporter({ url: websocketExporterUrlMetrics }),
      exportIntervalMillis: 1000,
    }),
  )

  const meter = meterProvider.getMeter('meter-web')

  const upDownCounter = meter.createUpDownCounter('test_up_down_counter', {
    description: 'Example of a UpDownCounter',
  })

  const attributes = { environment: 'staging' }

  window.addEventListener('click', () => {
    upDownCounter.add(1, attributes)
  })
}
