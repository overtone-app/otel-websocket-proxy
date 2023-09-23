import { ResourceMetrics } from '@opentelemetry/sdk-metrics'
import { OTLPExporterConfigBase, OTLPExporterBase } from '@opentelemetry/otlp-exporter-base'
import { diag } from '@opentelemetry/api'

import { createExportMetricsServiceRequest, IExportMetricsServiceRequest } from '@opentelemetry/otlp-transformer'

import { closeWebSocket, connectToWebSocket, sendToWebSocket } from './websocket.js'

const DEFAULT_WEBSOCKET_RESOURCE_PATH = 'v1/metrics'
const DEFAULT_WEBSOCKET_URL = `http://localhost:44318/${DEFAULT_WEBSOCKET_RESOURCE_PATH}`

export class WebsocketMetricsExporterProxy extends OTLPExporterBase<
  OTLPExporterConfigBase,
  ResourceMetrics,
  IExportMetricsServiceRequest
> {
  private _websocketPromise: Promise<WebSocket>

  constructor(config: OTLPExporterConfigBase = {}) {
    super(config)

    this._websocketPromise = connectToWebSocket(config.url ?? DEFAULT_WEBSOCKET_URL)
  }

  onInit(): void {
    window.addEventListener('unload', this.shutdown)
  }

  onShutdown(): void {
    window.removeEventListener('unload', this.shutdown)
    this._websocketPromise.then((socket) => closeWebSocket(socket))
  }

  send(items: ResourceMetrics[], onSuccess: () => void, onError: (error: any) => void): void {
    const serviceRequest = this.convert(items)

    return this.sendServiceRequest(serviceRequest, onSuccess, onError)
  }

  sendServiceRequest(
    serviceRequest: IExportMetricsServiceRequest,
    onSuccess: () => void,
    onError: (error: any) => void,
  ): void {
    if (this._shutdownOnce.isCalled) {
      diag.debug('Shutdown already started. Cannot send objects')
      return
    }

    const body = JSON.stringify(serviceRequest)

    const promise = this._websocketPromise
      .then((socket) => {
        // TODO handle errors
        sendToWebSocket(socket, body)
      })
      .then(onSuccess, onError)

    this._sendingPromises.push(promise)
    const popPromise = () => {
      const index = this._sendingPromises.indexOf(promise)
      this._sendingPromises.splice(index, 1)
    }
    promise.then(popPromise, popPromise)
  }

  convert(metrics: ResourceMetrics[]): IExportMetricsServiceRequest {
    return createExportMetricsServiceRequest(metrics)
  }

  getDefaultUrl(config: OTLPExporterConfigBase): string {
    return typeof config.url === 'string' ? config.url : DEFAULT_WEBSOCKET_URL
  }
}
