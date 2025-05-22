import { WebSocketServer, WebSocket } from "ws";

interface Product {
  id: string;
  name: string;
  price: number;
}

const wss = new WebSocketServer({ port: 3000 });
let products: Product[] = [];

wss.on("connection", (ws: WebSocket) => {
  console.log("Cliente conectado");

  // Enviar productos actuales
  ws.send(JSON.stringify({ type: "products", data: products }));

  ws.on("message", (message: string) => {
    try {
      const { type, data } = JSON.parse(message);

      switch (type) {
        case "create":
          const newProduct = { ...data, id: Date.now().toString() };
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
    } catch (err) {
      console.error("Error procesando mensaje:", err);
    }
  });
});

function broadcast(message: any) {
  const json = JSON.stringify(message);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(json);
    }
  });
}

console.log("Servidor WebSocket nativo corriendo en puerto 3000");
