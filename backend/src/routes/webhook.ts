import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import Binance, { OrderType } from 'binance-api-node'; // Import OrderType
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();
const prisma = new PrismaClient();

// Initialize Binance with Testnet credentials
const binance = Binance({
  apiKey: process.env.BINANCE_API_KEY || 'test',
  apiSecret: process.env.BINANCE_API_SECRET || 'test',
  httpBase: 'https://testnet.binance.vision',
});

// Webhook Endpoint
router.post(
  '/webhook',
  [
    body('secret').notEmpty().withMessage('Secret is required'),
    body('action').isIn(['buy', 'sell']).withMessage('Action must be buy or sell'),
    body('pair').notEmpty().withMessage('Pair is required'),
    body('amount').isFloat({ gt: 0 }).withMessage('Amount must be greater than 0'),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { secret, action, pair, amount } = req.body;

    // Verify webhook secret (set in TradingView and .env)
    if (secret !== process.env.WEBHOOK_SECRET) {
      return res.status(403).json({ message: 'Invalid webhook secret' });
    }

    try {
      // Get current price
      const prices = await binance.prices();
      const price = prices[pair] ? parseFloat(prices[pair]) : 50000;

      // Place Testnet order
      const order = await binance.order({
        symbol: pair,
        side: action.toUpperCase() as 'BUY' | 'SELL',
        quantity: amount,
        type: OrderType.MARKET, // Use enum value instead of string
      });

      // Save trade (assuming a user, e.g., from a default or authenticated context)
      const trade = await prisma.trade.create({
        data: {
          userId: 'default-user-id', // Replace with authenticated userId or a default for now
          pair,
          action,
          amount,
          price,
          status: 'completed',
        },
      });

      res.json({ trade, order, message: 'Trade executed via webhook on Binance Testnet' });
    } catch (err) {
      res.status(500).json({ message: 'Server error', error: (err as Error).message });
    }
  }
);

export default router;