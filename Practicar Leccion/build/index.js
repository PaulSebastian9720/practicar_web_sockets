"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ws_1 = require("ws");
const http_1 = __importDefault(require("http"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const history = [];
const server = http_1.default.createServer((req, res) => {
    if (req.url === "/") {
        const filePath = path_1.default.join(__dirname, "../public/index.html");
        fs_1.default.readFile(filePath, "utf-8", (err, content) => {
            if (err) {
                res.writeHead(500);
                return res.end("Error al cargar el archivo");
            }
            res.writeHead(200, { "Content-Type": "text/html" });
            res.end(content);
        });
    }
    else {
        res.writeHead(404);
        res.end("Ruta no encontrada");
    }
});
const wss = new ws_1.WebSocketServer({ server });
wss.on("connection", (ws) => {
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
                if (client.readyState === ws_1.WebSocket.OPEN) {
                    client.send(broadcast);
                }
            });
            console.log("Mensaje recibido:", msgObj);
        }
        catch (error) {
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
