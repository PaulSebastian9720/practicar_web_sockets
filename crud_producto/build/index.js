"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ws_1 = require("ws");
const wss = new ws_1.WebSocketServer({ port: 3000 });
let products = [];
wss.on("connection", (ws) => {
    console.log("Cliente conectado");
    // Enviar productos actuales
    ws.send(JSON.stringify({ type: "products", data: products }));
    ws.on("message", (message) => {
        try {
            const { type, data } = JSON.parse(message);
            switch (type) {
                case "create":
                    const newProduct = Object.assign(Object.assign({}, data), { id: Date.now().toString() });
                    products.push(newProduct);
                    broadcast({ type: "products", data: products });
                    break;
                case "update":
                    products = products.map((p) => (p.id === data.id ? data : p));
                    broadcast({ type: "products", data: products });
                    break;
                case "delete":
                    products = products.filter((p) => p.id !== data.id);
                    broadcast({ type: "products", data: products });
                    break;
            }
        }
        catch (err) {
            console.error("Error procesando mensaje:", err);
        }
    });
});
function broadcast(message) {
    const json = JSON.stringify(message);
    wss.clients.forEach((client) => {
        if (client.readyState === ws_1.WebSocket.OPEN) {
            client.send(json);
        }
    });
}
console.log("Servidor WebSocket nativo corriendo en puerto 3000");
