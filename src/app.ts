import 'dotenv/config';
import express, { Express, Router } from 'express';
import { errorHandler } from '@middleware/index.js';

import cors from 'cors';

const app: Express = express();
app.use(express.json());

const apiRouter: Router = Router();

app.use(
  cors({
    origin: 'http://localhost:3000', // your Next.js frontend
    credentials: true,
  })
);

app.use('/api', apiRouter);

// error handling middleware (must be last )
app.use(errorHandler);

export default app;
