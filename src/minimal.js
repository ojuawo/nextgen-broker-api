const http = require('http');
const { WebSocketServer, WebSocket } = require('ws');

const port = 3001;

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.url === '/api/auth/register' && req.method === 'POST') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ token: 'mock-token', user: { email: 'test@example.com' } }));
    return;
  }

  if (req.url === '/api/account/deposit' && req.method === 'POST') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ balance: 1000 }));
    return;
  }

  if (req.url === '/api/trade/order' && req.method === 'POST') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: 'Order accepted', orderId: 'ord_123' }));
    return;
  }

  res.writeHead(404);
  res.end();
});

const wss = new WebSocketServer({ server });
wss.on('connection', (ws) => {
  const interval = setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'TICKER',
        data: [
          { symbol: 'BTC/USD', price: 65000 + Math.random() * 100, timestamp: Date.now() },
          { symbol: 'ETH/USD', price: 3500 + Math.random() * 20, timestamp: Date.now() }
        ]
      }));
    }
  }, 1000);
  ws.on('close', () => clearInterval(interval));
});

server.listen(port, () => console.log(`[MINIMAL API] Running on port ${port}`));
