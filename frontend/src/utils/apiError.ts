/** The server's message for a failed request, else a fallback. */
export function apiError(err: unknown, fallback: string) {
  const e = err as { response?: { data?: { message?: string } }; name?: string; message?: string } | null;
  return e?.response?.data?.message ?? (e?.name === 'ForbiddenError' ? e.message : undefined) ?? fallback;
}
