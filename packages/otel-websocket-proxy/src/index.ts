import { createServer as createServerHttp } from 'http'
import { createServer as createServerHttps } from 'https'
import { parse } from 'url'
import { traces, metrics } from './proxy.js'
import { getCertificate } from './ssl/index.js'

export const listen = async ({ port, useHttps = false }: { port: number; useHttps?: boolean }) => {
  const server = useHttps ? await makeHttpsServer() : createServerHttp()

  server.on('upgrade', function (request, socket, upgradeHead) {
    const { pathname } = parse(request.url ?? '')

    if (pathname === '/v1/traces') {
      console.log(pathname)
      traces.handleUpgrade(request, socket, upgradeHead, (ws) => traces.emit('connection', ws, request))
    } else if (pathname === '/v1/metrics') {
      metrics.handleUpgrade(request, socket, upgradeHead, (ws) => metrics.emit('connection', ws, request))
    } else {
      socket.destroy()
    }
  })

  server.listen(port)
  console.log(`Proxy is up on :${port}`)
}

const makeHttpsServer = async () => {
  const certificate = await getCertificate()
  return createServerHttps({
    cert: certificate,
    key: certificate,
  })
}
