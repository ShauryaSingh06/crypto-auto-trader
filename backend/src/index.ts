import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import userRouter from './routes/user';
import tradeRouter from './routes/trade';
import webhookRouter from './routes/webhook';
import bodyParser from 'body-parser';

dotenv.config();

const app = express();
app.use(bodyParser.json()); // Parse JSON bodies
app.use(express.json());

// Initialize Prisma
const prisma = new PrismaClient();

// Test database connection
async function testDbConnection() {
  try {
    await prisma.$connect();
    console.log('PostgreSQL connected via Prisma');
  } catch (err) {
    console.error('Database error:', err);
  }
}
testDbConnection();

// Routes
app.use('/api/user', userRouter);
app.use('/api/trade', tradeRouter);
app.use('/api/webhook', webhookRouter);

app.get('/', (req: Request, res: Response) => {
  res.send('Backend is running');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));