import { validateSchema } from '@shared/middlewares/validator.js';
import { Router } from 'express';
import {
  loginSchema,
  onboardSuperAdminSchema,
  registerSchema,
} from '@auth/validation/auth.schema.js';
import { asyncHandler } from '@shared/utils/asyncHandler.js';
import authenticate from '@shared/middlewares/authenticate.js';
import { AuthController } from '@auth/controllers/auth.controller.js';
import { AuthService } from '@auth/services/auth.service.js';
import authRepository from '@modules/auth/repositories/auth.repository.js';

const router: Router = Router();
const authService = new AuthService(authRepository);
const authController = new AuthController(authService);

router.post(
  '/login',
  validateSchema(loginSchema),
  asyncHandler(authController.login)
);

router.post(
  '/register',
  validateSchema(registerSchema),
  asyncHandler(authController.register)
);

router.post(
  '/onboard-super-admin',
  validateSchema(onboardSuperAdminSchema),
  asyncHandler(authController.onboardSuperAdmin)
);

router.get('/profile', authenticate, asyncHandler(authController.getProfile));

router.post('/logout', asyncHandler(authController.logout));

export default router;
