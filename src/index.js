const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const { WebSocketServer, WebSocket } = require('ws');
const jwt = require('jsonwebtoken');

dotenv.config();

const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key';

// Mock DB
const balances = {};

// Middleware
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Authentication required' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// Routes
app.post('/api/auth/register', (req, res) => {
  const { email } = req.body;
  const id = `user_${Date.now()}`;
  const token = jwt.sign({ id, email, scopes: ['trade-only'] }, JWT_SECRET);
  res.json({ token, user: { id, email } });
});

app.post('/api/account/deposit', authenticate, (req, res) => {
  const { amount } = req.body;
  const userId = req.user.id;
  if (!balances[userId]) balances[userId] = 0;
  balances[userId] += Number(amount);
  res.json({ balance: balances[userId] });
});

app.post('/api/trade/order', authenticate, (req, res) => {
  const { symbol, side, price, amount } = req.body;
  res.json({ message: 'Order accepted', orderId: `ord_${Date.now()}` });
});

app.get('/health', (req, res) => res.json({ status: 'ok' }));

// WebSocket
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

server.listen(port, () => console.log(`[API] Running on port ${port}`));
