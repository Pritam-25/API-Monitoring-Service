export const resolvePublicErrorCode = (error: unknown): string | undefined => {
  if (error === undefined || error === null) {
    return undefined;
  }

  if (typeof error === 'string') {
    return error;
  }

  if (typeof error === 'number') {
    return String(error);
  }

  if (typeof error === 'object') {
    const candidate =
      (error as { code?: unknown; errorCode?: unknown }).code ??
      (error as { code?: unknown; errorCode?: unknown }).errorCode;

    if (typeof candidate === 'string' || typeof candidate === 'number') {
      return String(candidate);
    }
  }

  return 'INTERNAL_ERROR';
};
