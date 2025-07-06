import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import Binance from 'binance-api-node';
import auth from '../middleware/auth';

interface AuthRequest extends Request {
  user?: { id: string };
}

const router = express.Router();
const prisma = new PrismaClient();

// Execute Trade
router.post(
  '/execute',
  auth,
  [
    body('pair').notEmpty().withMessage('Pair is required'),
    body('action').isIn(['buy', 'sell']).withMessage('Action must be buy or sell'),
    body('amount').isFloat({ gt: 0 }).withMessage('Amount must be greater than 0'),
  ],
  async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { pair, action, amount } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    try {
      // Mock Binance trade (Testnet mode)
      const binance = Binance({ apiKey: 'test', apiSecret: 'test', httpBase: 'https://testnet.binance.vision' });
      const prices = await binance.prices();
      const price = prices[pair] ? parseFloat(prices[pair]) : 50000;

      // Save trade
      const trade = await prisma.trade.create({
        data: {
          userId,
          pair,
          action,
          amount,
          price,
          status: 'completed',
        },
      });

      res.json({ trade, message: 'Trade executed (Testnet mode)' });
    } catch (err) {
      res.status(500).json({ message: 'Server error', error: (err as Error).message });
    }
  }
);

// Get Trade History
router.get('/history', auth, async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ message: 'User not authenticated' });
  }

  try {
    const trades = await prisma.trade.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    res.json(trades);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: (err as Error).message });
  }
});

export default router;