import { ExportResult, getEnv } from '@opentelemetry/core'
import {
  AggregationTemporality,
  AggregationTemporalitySelector,
  InstrumentType,
  PushMetricExporter,
  ResourceMetrics,
} from '@opentelemetry/sdk-metrics'
import { OTLPExporterBase } from '@opentelemetry/otlp-exporter-base'
import { IExportMetricsServiceRequest } from '@opentelemetry/otlp-transformer'
import { OTLPExporterConfigBase } from '@opentelemetry/otlp-exporter-base'
import {
  OTLPExporterNodeBase,
  OTLPExporterNodeConfigBase,
  appendResourcePathToUrl,
  appendRootPathToUrlIfNeeded,
} from '@opentelemetry/otlp-exporter-base'
import { diag } from '@opentelemetry/api'

import { WebsocketMetricsExporterProxy } from './WebsocketMetricsExporterProxy'

export interface OTLPMetricExporterOptions extends OTLPExporterConfigBase {
  temporalityPreference?: AggregationTemporality
}

export const CumulativeTemporalitySelector: AggregationTemporalitySelector = () => AggregationTemporality.CUMULATIVE

export const DeltaTemporalitySelector: AggregationTemporalitySelector = (instrumentType: InstrumentType) => {
  switch (instrumentType) {
    case InstrumentType.COUNTER:
    case InstrumentType.OBSERVABLE_COUNTER:
    case InstrumentType.HISTOGRAM:
    case InstrumentType.OBSERVABLE_GAUGE:
      return AggregationTemporality.DELTA
    case InstrumentType.UP_DOWN_COUNTER:
    case InstrumentType.OBSERVABLE_UP_DOWN_COUNTER:
      return AggregationTemporality.CUMULATIVE
  }
}

function chooseTemporalitySelectorFromEnvironment() {
  const env = getEnv()
  const configuredTemporality =
    // @ts-expect-error not defined on env yet
    env.OTEL_EXPORTER_OTLP_METRICS_TEMPORALITY_PREFERENCE.trim().toLowerCase()

  if (configuredTemporality === 'cumulative') {
    return CumulativeTemporalitySelector
  }
  if (configuredTemporality === 'delta') {
    return DeltaTemporalitySelector
  }

  diag.warn(
    // @ts-expect-error not defined on env yet
    `OTEL_EXPORTER_OTLP_METRICS_TEMPORALITY_PREFERENCE is set to '${env.OTEL_EXPORTER_OTLP_METRICS_TEMPORALITY_PREFERENCE}', but only 'cumulative' and 'delta' are allowed. Using default ('cumulative') instead.`,
  )
  return CumulativeTemporalitySelector
}

function chooseTemporalitySelector(temporalityPreference?: AggregationTemporality): AggregationTemporalitySelector {
  // Directly passed preference has priority.
  if (temporalityPreference != null) {
    if (temporalityPreference === AggregationTemporality.DELTA) {
      return DeltaTemporalitySelector
    }
    return CumulativeTemporalitySelector
  }

  return chooseTemporalitySelectorFromEnvironment()
}

export class WebsocketMetricExporterBase<
  T extends OTLPExporterBase<OTLPMetricExporterOptions, ResourceMetrics, IExportMetricsServiceRequest>,
> implements PushMetricExporter
{
  public _websocketExporter: T
  protected _aggregationTemporalitySelector: AggregationTemporalitySelector

  constructor(exporter: T, config?: OTLPMetricExporterOptions) {
    this._websocketExporter = exporter
    this._aggregationTemporalitySelector = chooseTemporalitySelector(config?.temporalityPreference)
  }

  export(metrics: ResourceMetrics, resultCallback: (result: ExportResult) => void): void {
    this._websocketExporter.export([metrics], resultCallback)
  }

  async shutdown(): Promise<void> {
    await this._websocketExporter.shutdown()
  }

  forceFlush(): Promise<void> {
    return Promise.resolve()
  }

  selectAggregationTemporality(instrumentType: InstrumentType): AggregationTemporality {
    return this._aggregationTemporalitySelector(instrumentType)
  }
}

/**
 * Collector Metric Exporter for Node
 */
export class WebsocketMetricExporter extends WebsocketMetricExporterBase<WebsocketMetricsExporterProxy> {
  constructor(config?: OTLPExporterNodeConfigBase & OTLPMetricExporterOptions) {
    super(new WebsocketMetricsExporterProxy(config), config)
  }
}
