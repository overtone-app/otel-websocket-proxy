export const connectToWebSocket = async (url: string) => {
  const socket = new WebSocket(url);

  return new Promise<WebSocket>((resolve, reject) => {
    socket.addEventListener("open", () => {
      socket.addEventListener(
        "message",
        (msg) => {
          if (msg.data === "init-response") {
            resolve(socket);
          } else {
            console.log("Unexpected message", msg);

            reject(new Error("Unexpected message"));
          }
        },
        { once: true }
      );

      socket.send("init-request");
    });
  });
};

export const sendToWebSocket = (socket: WebSocket, data: string) => {
  socket.send(data);
};

export const closeWebSocket = (socket: WebSocket) => {
  socket.close();
};
