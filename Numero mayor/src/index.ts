import { WebSocketServer, WebSocket } from "ws";
import http from "http";
import path from "path";
import fs from "fs";

const PORT = 3000;

let numberToGuess = Math.floor(Math.random() * 100) + 1;
let gameActive = true;
console.log(numberToGuess);


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

  ws.send(
    JSON.stringify({
      type: "info",
      message: "¡Bienvenido! Adivina un número entre 1 y 100.",
    })
  );

  ws.on("message", (message) => {
    if (!gameActive) {
      ws.send(
        JSON.stringify({
          type: "info",
          message:
            "El juego terminó. Reinicia el servidor para jugar otra vez.",
        })
      );
      return;
    }

    let data;
    try {
      data = JSON.parse(message.toString());
    } catch {
      ws.send(JSON.stringify({ type: "error", message: "Formato inválido" }));
      return;
    }

    if (typeof data.guess !== "number") {
      ws.send(
        JSON.stringify({ type: "error", message: "Envía un número válido" })
      );
      return;
    }

    const guess = data.guess;
    const sender = data.sender || "Anónimo";

    let response = "";
    if (guess === numberToGuess) {
      response = `¡${sender} adivinó el número! Era ${numberToGuess}. 🎉`;
      gameActive = false;
    } else if (guess < numberToGuess) {
      response = `${sender} intentó ${guess}: más alto.`;
    } else {
      response = `${sender} intentó ${guess}: más bajo.`;
    }

    // Enviar respuesta a todos los clientes
    const broadcastMsg = JSON.stringify({
      type: "guessResult",
      message: response,
    });

    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(broadcastMsg);
      }
    });

    console.log(response);
  });

  ws.on("close", () => {
    console.log("Cliente desconectado");
  });
});

server.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
