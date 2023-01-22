export const connectToWebSocket = async (url: string) => {
  const socket = new WebSocket(url)

  return new Promise<WebSocket>((resolve, reject) => {
    socket.addEventListener(
      'message',
      (msg) => {
        const data = JSON.parse(msg.data)
        if (data.type === 'init-response') {
          resolve(socket)
        } else {
          console.log('Unexpected message', data)

          reject(new Error('Unexpected message'))
        }
      },
      { once: true },
    )

    socket.send(JSON.stringify({ type: 'init-request' }))
  })
}

export const sendToWebSocket = (socket: WebSocket, data: string) => {
  socket.send(data)
}

export const closeWebSocket = (socket: WebSocket) => {
  socket.close()
}
