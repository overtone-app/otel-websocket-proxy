import { ConsoleSpanExporter, SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'
import { WebTracerProvider } from '@opentelemetry/sdk-trace-web'
import { Resource } from '@opentelemetry/resources'
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions'

export const doExampleTracing = async () => {
  const provider = new WebTracerProvider({
    resource: new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]: 'otel-websocket-example-basic-vite',
    }),
  })

  provider.addSpanProcessor(new SimpleSpanProcessor(new ConsoleSpanExporter()))

  const exporterUrlTracing =
    import.meta.env?.VITE_OTEL_EXPORTER_OTLP_TRACES_ENDPOINT ?? 'http://localhost:4318/v1/traces'

  // TODO replace with websocket exporter
  provider.addSpanProcessor(
    new SimpleSpanProcessor(
      new OTLPTraceExporter({
        url: exporterUrlTracing,
        // empty headers makes sure to use XHR instead of `navigator.sendBeacon`
        headers: {},
      }),
    ),
  )

  const tracer = provider.getTracer('tracer-web')

  const span = tracer.startSpan('doExampleTracing')

  span.setAttribute('foo', 'bar')

  await new Promise((resolve) => setTimeout(resolve, 1000))

  span.end()
}
