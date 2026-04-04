import 'express';

declare global {
  namespace Express {
    interface Request {
      requestId?: string;
      user?: {
        userId?: string | undefined;
        username?: string | undefined;
        email?: string | undefined;
        role?: string | undefined;
        clientId?: string | undefined;
      };
    }
  }
}

export {};
