import { Router } from 'express';
import { authenticate, AuthRequest } from '../auth/middleware';

const router = Router();

// Mock balances
const balances: Record<string, number> = {};

router.post('/deposit', authenticate, (req: AuthRequest, res) => {
  const { amount, currency } = req.body;
  const userId = req.user?.id as string;

  if (!balances[userId]) balances[userId] = 0;
  balances[userId] += Number(amount);

  console.log(`[API] Deposit: ${amount} ${currency} for user ${userId}. New balance: ${balances[userId]}`);
  
  res.json({ 
    message: 'Deposit successful', 
    balance: balances[userId],
    currency 
  });
});

router.get('/balance', authenticate, (req: AuthRequest, res) => {
  const userId = req.user?.id as string;
  res.json({ balance: balances[userId] || 0, currency: 'USD' });
});

export default router;
