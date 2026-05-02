import { Router } from 'express';
import jwt from 'jsonwebtoken';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key';

// Mock user for demo purposes
const MOCK_USER = {
  id: 'user_123',
  email: 'trader@example.com',
  password: 'password123',
  scopes: ['trade-only']
};

router.post('/register', (req, res) => {
  const { email, password } = req.body;
  // In a real app, we would save to DB. For demo, we just return a token.
  const token = jwt.sign(
    { id: `user_${Date.now()}`, email, scopes: ['trade-only'] },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
  res.json({ token, user: { email, scopes: ['trade-only'] } });
});

export default router;
