import { validateSchema } from '@shared/middlewares/validator.js';
import { Router } from 'express';
import { loginSchema, signupSchema } from '@auth/validation/auth.schema.js';

const router: Router = Router();

router.post('/login', validateSchema(loginSchema), (_req, res) => {
  // Placeholder for login logic
  res.json({ message: 'Login endpoint' });
});

router.post('/register', validateSchema(signupSchema), (_req, res) => {
  res.json({ message: 'Register endpoint' });
});

export default router;
