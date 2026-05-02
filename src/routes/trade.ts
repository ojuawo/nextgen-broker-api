import { Router } from 'express';
import { authenticate, authorize, AuthRequest } from '../auth/middleware';

const router = Router();

// Apply trade-only scope to order placement
router.post('/order', authenticate, authorize('trade-only'), (req: AuthRequest, res) => {
  const { symbol, side, type, price, amount } = req.body;
  
  console.log(`[API] Order received: ${side} ${amount} ${symbol} @ ${price} (User: ${req.user?.id})`);
  
  // Here we would send the order to the Matching Engine
  res.status(202).json({ 
    message: 'Order accepted', 
    orderId: `ord_${Date.now()}`,
    status: 'PENDING'
  });
});

router.get('/history', authenticate, (req: AuthRequest, res) => {
  res.json([]);
});

export default router;
