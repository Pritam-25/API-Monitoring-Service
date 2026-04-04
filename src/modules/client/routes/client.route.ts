import { Router } from 'express';

import clientContainer from '@client/container/client.container.js';
import {
  createApiKeySchema,
  createClientSchema,
  createClientUserSchema,
} from '@client/validation/client.schema.js';
import authenticate from '@shared/middlewares/authenticate.js';
import { validateSchema } from '@shared/middlewares/validator.js';
import { asyncHandler } from '@shared/utils/asyncHandler.js';

const router: Router = Router();
const { clientController } = clientContainer.controllers;

router.use(authenticate);

router.post(
  '/admin/clients/onboard',
  validateSchema(createClientSchema),
  asyncHandler(clientController.createClient)
);

router.post(
  '/admin/clients/:clientId/users',
  validateSchema(createClientUserSchema),
  asyncHandler(clientController.createClientUser)
);

router.post(
  '/admin/clients/:clientId/api/keys',
  validateSchema(createApiKeySchema),
  asyncHandler(clientController.createApiKey)
);

router.get(
  '/admin/clients/:clientId/api/keys',
  asyncHandler(clientController.getClientApiKeys)
);

export default router;
