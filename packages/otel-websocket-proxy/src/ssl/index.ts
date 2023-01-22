import { promises as fs } from 'node:fs'
import os from 'node:os'
import path from 'node:path'

// NOTE code mostly adapted from https://github.com/vitejs/vite-plugin-basic-ssl
export const getCertificate = async () => {
  const cacheDir = path.join(os.tmpdir(), 'otel-websocket-proxy-ssl')

  await fs.mkdir(cacheDir, { recursive: true })
  const cachePath = path.join(cacheDir, 'cert.pem')

  try {
    const [stat, content] = await Promise.all([fs.stat(cachePath), fs.readFile(cachePath, 'utf8')])

    if (Date.now() - stat.ctime.valueOf() > 30 * 24 * 60 * 60 * 1000) {
      throw new Error('cache is outdated.')
    }

    return content
  } catch {
    const content = (await import('./certificate.js')).createCertificate()
    fs.mkdir(cacheDir, { recursive: true })
      .then(() => fs.writeFile(cachePath, content))
      .catch(() => {})

    return content
  }
}
