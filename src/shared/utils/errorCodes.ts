const ERROR_CODES = {
  INTERNAL_ERROR: 'Internal Server Error',
  INVALID_INPUT: 'Invalid JSON body',
  REQUIRE_REQUEST_BODY: 'Request body is required',
  NOT_FOUND: 'Endpoint not found',
  UNAUTHORIZED: 'Unauthorized',
} as const;

export { ERROR_CODES };
