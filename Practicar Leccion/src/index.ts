import { WebSocketServer, WebSocket } from "ws";
import http from "http";
import fs from "fs";
import path from "path";

const history: { sender: string; content: string; time: string }[] = [];

const server = http.createServer((req, res) => {
  if (req.url === "/") {
    const filePath = path.join(__dirname, "../public/index.html");
    fs.readFile(filePath, "utf-8", (err, content) => {
      if (err) {
        res.writeHead(500);
        return res.end("Error al cargar el archivo");
      }
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(content);
    });
  } else {
    res.writeHead(404);
    res.end("Ruta no encontrada");
  }
});

const wss = new WebSocketServer({ server });

wss.on("connection", (ws: WebSocket) => {
  console.log("Cliente conectado");

  ws.send(JSON.stringify({ type: "history", messages: history }));

  ws.on("message", (message) => {
    try {
      const msgObj = JSON.parse(message.toString());
      const fullMsg = {
        sender: msgObj.sender || "Anónimo",
        content: msgObj.content || "",
        time: new Date().toISOString(),
      };

      history.push(fullMsg);

      const broadcast = JSON.stringify({ type: "message", message: fullMsg });
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(broadcast);
        }
      });

      console.log("Mensaje recibido:", msgObj);
    } catch (error) {
      console.error("Error al procesar mensaje:", error);
    }
  });

  ws.on("close", () => {
    console.log("Cliente desconectado");
  });
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Servidor iniciado en http://localhost:${PORT}`);
});
