import { Router } from 'express';

const router: Router = Router();

router.post('/login', (_req, res) => {
  // Placeholder for login logic
  res.json({ message: 'Login endpoint' });
});

router.post('/register', (_req, res) => {
  res.json({ message: 'Register endpoint' });
});

export default router;
