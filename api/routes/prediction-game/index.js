import express from 'express';
import eventsRouter from './events.js';
import creatorsRouter from './creators.js';
import stakingRouter from './staking.js';

const router = express.Router();

// Health check endpoint for prediction game API
router.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'prediction-game',
    timestamp: new Date().toISOString() 
  });
});

// Mount prediction game routes
router.use('/events', eventsRouter);
router.use('/creators', creatorsRouter);
router.use('/staking', stakingRouter);

export function createPredictionGameRouter() {
  return router;
}

export default router;
