import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import { setupWebSocket } from './websocket';
import authRoutes from './routes/auth';
import tradeRoutes from './routes/trade';
import accountRoutes from './routes/account';

dotenv.config();

const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/trade', tradeRoutes);
app.use('/api/account', accountRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'trading-api' });
});

// Setup WebSocket for real-time prices
setupWebSocket(server);

server.listen(port, () => {
  console.log(`[API] Server is running on port ${port}`);
});
