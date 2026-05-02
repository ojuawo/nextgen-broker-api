import { Server } from 'http';
import { WebSocketServer, WebSocket } from 'ws';

export const setupWebSocket = (server: Server) => {
  const wss = new WebSocketServer({ server });

  console.log('[WS] WebSocket server initialized');

  wss.on('connection', (ws) => {
    console.log('[WS] Client connected');

    const interval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        const btcPrice = 65000 + (Math.random() * 100 - 50);
        const ethPrice = 3500 + (Math.random() * 20 - 10);

        ws.send(JSON.stringify({
          type: 'TICKER',
          data: [
            { symbol: 'BTC/USD', price: parseFloat(btcPrice.toFixed(2)), timestamp: Date.now() },
            { symbol: 'ETH/USD', price: parseFloat(ethPrice.toFixed(2)), timestamp: Date.now() }
          ]
        }));
      }
    }, 1000);

    ws.on('close', () => {
      console.log('[WS] Client disconnected');
      clearInterval(interval);
    });
  });
};
