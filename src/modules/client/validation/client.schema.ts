import { z } from 'zod';

const environmentSchema = z.enum([
  'production',
  'staging',
  'development',
  'testing',
]);

export const createClientSchema = z.object({
  name: z
    .string({
      error: issue =>
        issue.input === undefined ? 'Client name is required' : undefined,
    })
    .trim()
    .min(2, 'Client name must be at least 2 characters')
    .max(100, 'Client name must not exceed 100 characters'),
  slug: z
    .string({
      error: issue =>
        issue.input === undefined ? 'Client slug is required' : undefined,
    })
    .trim()
    .toLowerCase()
    .regex(
      /^[a-z0-9-]+$/,
      'Client slug can contain lowercase letters, numbers and hyphens only'
    ),
  email: z
    .email({
      error: issue =>
        issue.input === undefined ? 'Client email is required' : undefined,
    })
    .trim()
    .toLowerCase(),
  description: z.string().max(500).optional().default(''),
  website: z.string().trim().optional().default(''),
  isActive: z.boolean().optional().default(true),
  settings: z
    .object({
      dataRetentionDays: z
        .number()
        .int()
        .min(7)
        .max(365)
        .optional()
        .default(30),
      alertsEnabled: z.boolean().optional().default(true),
      timezone: z.string().trim().optional().default('UTC'),
    })
    .optional(),
});

export const createClientUserSchema = z.object({
  username: z
    .string({
      error: issue =>
        issue.input === undefined ? 'Username is required' : undefined,
    })
    .trim()
    .min(3)
    .max(30)
    .regex(/^[a-zA-Z0-9_.-]+$/, 'Please enter a valid username'),
  email: z.email({
    error: issue =>
      issue.input === undefined ? 'Email is required' : undefined,
  }),
  password: z
    .string({
      error: issue =>
        issue.input === undefined ? 'Password is required' : undefined,
    })
    .min(6, 'Password must be at least 6 characters long')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(
      /[@$#!%*~?&/\\(){}[\]]/,
      'Password must contain at least one special character'
    ),
  role: z
    .enum(['client_admin', 'client_viewer'])
    .optional()
    .default('client_viewer'),
  isActive: z.boolean().optional().default(true),
});

export const createApiKeySchema = z.object({
  name: z
    .string({
      error: issue =>
        issue.input === undefined ? 'API key name is required' : undefined,
    })
    .trim()
    .min(1)
    .max(100),
  description: z.string().max(500).optional().default(''),
  environment: environmentSchema.optional().default('production'),
  isActive: z.boolean().optional().default(true),
  permissions: z
    .object({
      canIngest: z.boolean().optional().default(true),
      canReadAnalytics: z.boolean().optional().default(false),
      allowedServices: z.array(z.string().trim()).optional().default([]),
    })
    .optional(),
  security: z
    .object({
      allowedIPs: z.array(z.string().trim()).optional().default([]),
      allowedOrigins: z.array(z.string().trim()).optional().default([]),
      rotationWarningDays: z.number().int().positive().optional().default(30),
    })
    .optional(),
  metadata: z
    .object({
      purpose: z.string().trim().max(200).optional(),
      tags: z.array(z.string().trim().max(50)).optional().default([]),
    })
    .optional(),
  expiresAt: z.string().datetime().optional(),
});

export type CreateClientInput = z.infer<typeof createClientSchema>;
export type CreateClientUserInput = z.infer<typeof createClientUserSchema>;
export type CreateApiKeyInput = z.infer<typeof createApiKeySchema>;
