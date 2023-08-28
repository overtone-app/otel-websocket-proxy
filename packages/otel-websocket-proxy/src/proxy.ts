import { WebSocketServer } from 'ws'

export const proxy = (name: string, endpoint: string, maxPayloadBytes?: number): WebSocketServer => {
  const server = new WebSocketServer({
    noServer: true,
    maxPayload: maxPayloadBytes,
  })

  console.log(`[${name}] Proxying to ${endpoint}`)

  if (maxPayloadBytes !== undefined) {
    console.log(`[${name}] Max payload size: ${maxPayloadBytes} bytes`)
  }

  server.on('connection', (ws) => {
    ws.once('message', async (body) => {
      let handshake = body.toString()
      if (handshake !== 'init-request') {
        console.warn(`[${name}] Handshake failed, closing connection`)
        ws.close(400, 'Unauthorized')
        return
      }

      console.log(`[${name}] 🤝`)
      ws.send('init-response')

      ws.on('message', async (body) => {
        if (Buffer.isBuffer(body)) {
          fetch(endpoint, {
            method: 'POST',
            body,
            headers: { 'Content-Type': 'application/json' },
          }).catch((e) => console.warn(`[${name}] Proxy failure`, e, body.toString()))
        } else {
          console.warn(`[${name}] Invalid payload on ${name}, ignoring`, body)
        }
      })

      ws.on('error', (e) => {
        console.error(`[${name}] Error on`, e)
      })
    })
  })

  return server
}
