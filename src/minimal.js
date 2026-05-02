const http = require('http');
const { WebSocketServer, WebSocket } = require('ws');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const port = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key';
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:YOUR_PASSWORD@db.rmrdupbgvgkrafbhbsdz.supabase.co:5432/postgres';

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Initialize DB Table
pool.query(`
  CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    balance NUMERIC DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`).then(() => console.log('Database initialized')).catch(console.error);

// Parse JSON body helper
const parseBody = (req) => {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      try { resolve(body ? JSON.parse(body) : {}); } 
      catch (e) { reject(e); }
    });
  });
};

// Auth Middleware helper
const authenticate = (req) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) throw new Error('Authentication required');
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid token');
  }
};

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.url === '/api/auth/register' && req.method === 'POST') {
    try {
      const body = await parseBody(req);
      const { email, password } = body;
      if (!email || !password) {
        res.writeHead(400); return res.end(JSON.stringify({ error: 'Email and password required' }));
      }
      
      const hash = await bcrypt.hash(password, 10);
      const result = await pool.query(
        'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email',
        [email, hash]
      );
      const user = result.rows[0];
      const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET);
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ token, user: { email: user.email } }));
    } catch (err) {
      res.writeHead(400); return res.end(JSON.stringify({ error: err.code === '23505' ? 'Email exists' : 'Registration failed' }));
    }
  }

  if (req.url === '/api/auth/login' && req.method === 'POST') {
    try {
      const body = await parseBody(req);
      const { email, password } = body;
      
      const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
      const user = result.rows[0];
      
      if (!user || !(await bcrypt.compare(password, user.password_hash))) {
        res.writeHead(401); return res.end(JSON.stringify({ error: 'Invalid credentials' }));
      }
      
      const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ token, user: { email: user.email } }));
    } catch (err) {
      res.writeHead(500); return res.end(JSON.stringify({ error: 'Login failed' }));
    }
  }

  if (req.url === '/api/account/deposit' && req.method === 'POST') {
    try {
      const user = authenticate(req);
      const result = await pool.query(
        'UPDATE users SET balance = balance + 1000 WHERE id = $1 RETURNING balance',
        [user.id]
      );
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ balance: result.rows[0].balance }));
    } catch (err) {
      res.writeHead(401); return res.end(JSON.stringify({ error: err.message }));
    }
  }

  if (req.url === '/api/trade/order' && req.method === 'POST') {
    try {
      const user = authenticate(req);
      const body = await parseBody(req);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ message: 'Order accepted', orderId: `ord_${Date.now()}` }));
    } catch (err) {
      res.writeHead(401); return res.end(JSON.stringify({ error: err.message }));
    }
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
