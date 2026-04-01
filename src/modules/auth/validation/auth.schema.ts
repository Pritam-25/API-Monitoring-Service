import { z } from 'zod';

// Password Validation Schema
export const passwordSchema = z
  .string()
  .min(6, 'Password must be at least 6 characters long')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(
    /[@$#!%*~?&/\\(){}[\]]/,
    'Password must contain at least one special character'
  );

// Signup Schema
export const signupSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must not exceed 30 characters'),

  email: z.email('Invalid email format'),

  password: passwordSchema,
});

// Login Schema
export const loginSchema = z.object({
  email: z.email('Invalid email format'),

  password: z.string().min(6, 'Invalid Credentials'),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
