export const successResponse = <T>(message: string, data?: T) => ({
  success: true as const,
  message,
  data,
});

export const errorResponse = <T>(message: string, error: T) => ({
  success: false as const,
  errMsg: message,
  error, // for backend logging/debugging; not meant for client consumption
});
