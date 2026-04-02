import { z } from 'zod';

export const passwordSchema = z
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
  );

export const APPLICATION_ROLES = {
  SUPER_ADMIN: 'super_admin',
  CLIENT_ADMIN: 'client_admin',
  CLIENT_VIEWER: 'client_viewer',
} as const;

type ApplicationRole =
  (typeof APPLICATION_ROLES)[keyof typeof APPLICATION_ROLES];

type DefaultPermissions = {
  canCreateApiKeys: boolean;
  canManageUsers: boolean;
  canViewAnalytics: boolean;
  canExportData: boolean;
};

const basePermissions = {
  canCreateApiKeys: false,
  canManageUsers: false,
  canViewAnalytics: true,
  canExportData: false,
};

export const getDefaultPermissionsForRole = (
  role: ApplicationRole
): DefaultPermissions => {
  if (role === APPLICATION_ROLES.SUPER_ADMIN) {
    return {
      canCreateApiKeys: true,
      canManageUsers: true,
      canViewAnalytics: true,
      canExportData: true,
    };
  }

  return { ...basePermissions };
};

const roleSchema = z.enum([
  APPLICATION_ROLES.SUPER_ADMIN,
  APPLICATION_ROLES.CLIENT_ADMIN,
  APPLICATION_ROLES.CLIENT_VIEWER,
]);

const permissionsSchema = z
  .object({
    canCreateApiKeys: z.boolean().default(false),
    canManageUsers: z.boolean().default(false),
    canViewAnalytics: z.boolean().default(true),
    canExportData: z.boolean().default(false),
  })
  .default(getDefaultPermissionsForRole(APPLICATION_ROLES.CLIENT_VIEWER));

export const baseUserSchema = z.object({
  username: z
    .string({
      error: issue =>
        issue.input === undefined ? 'Username is required' : undefined,
    })
    .trim()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must not exceed 30 characters')
    .regex(/^[a-zA-Z0-9_.-]+$/, 'Please enter a valid username'),

  email: z
    .string({
      error: issue =>
        issue.input === undefined ? 'Email is required' : undefined,
    })
    .trim()
    .toLowerCase()
    .email('Please enter a valid email'),

  password: passwordSchema,

  role: roleSchema.default(APPLICATION_ROLES.CLIENT_VIEWER),

  clientId: z.string().trim().min(1).optional(),

  isActive: z.boolean().default(true),

  permissions: permissionsSchema,
});

const validateClientIdForRole = (data: {
  role: (typeof APPLICATION_ROLES)[keyof typeof APPLICATION_ROLES];
  clientId?: string | undefined;
}) => data.role === APPLICATION_ROLES.SUPER_ADMIN || Boolean(data.clientId);

export const userSchema = baseUserSchema.refine(validateClientIdForRole, {
  message: 'clientId is required unless role is super_admin',
  path: ['clientId'],
});

export const registerSchema = baseUserSchema
  .pick({
    username: true,
    email: true,
    password: true,
    role: true,
    clientId: true,
    isActive: true,
    permissions: true,
  })
  .refine(validateClientIdForRole, {
    message: 'clientId is required unless role is super_admin',
    path: ['clientId'],
  });

export const loginSchema = baseUserSchema.pick({
  email: true,
  password: true,
});

// Backward-compatible alias for existing imports.
export const signupSchema = registerSchema;

export type UserInput = z.infer<typeof userSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type SignupInput = RegisterInput;
export type LoginInput = z.infer<typeof loginSchema>;
